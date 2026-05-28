"""
XGBoost ranking model for horse race prediction.
Uses XGBRanker with rank:pairwise objective — the correct approach
for an ordinal ranking problem (finish position).
"""

from __future__ import annotations

import os
import logging
from pathlib import Path
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
import xgboost as xgb
from supabase import create_client

logger = logging.getLogger(__name__)

MODEL_PATH = Path("xgb_model.ubj")

# ─── 12 facteurs — identiques à ceux de route.ts et collect-results ──────────
FEATURES: list[str] = [
    "raw_form",           # forme récente (musique PMU)
    "raw_odds_rank",      # rang marché (signal cotes)
    "raw_consist",        # taux de victoires carrière
    "raw_placement",      # taux de placement carrière
    "raw_mvt",            # mouvement de cote (insider signal)
    "raw_age",            # âge optimal par discipline
    "raw_earnings",       # gains carrière normalisés (classe)
    "raw_jockey_wr",      # win rate jockey (90 jours glissants)
    "raw_trainer_wr",     # win rate entraîneur (90 jours glissants)
    "raw_weight_penalty", # poids de monte / handicap
    "raw_form_x_signal",  # interaction forme × marché
    "raw_jockey_x_trainer", # interaction jockey × trainer
]

NEUTRAL = 5.0  # valeur neutre (données manquantes)


def _get_supabase():
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)


# ─── Collecte des données ─────────────────────────────────────────────────────

def fetch_training_data(days: int = 90) -> pd.DataFrame:
    since = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    supabase = _get_supabase()

    cols = ["race_id", "finish_pos"] + FEATURES
    result = (
        supabase.table("race_outcomes")
        .select(",".join(cols))
        .gte("race_date", since)
        .execute()
    )

    if not result.data:
        return pd.DataFrame(columns=cols)

    df = pd.DataFrame(result.data)

    # Remplir les colonnes manquantes (avant migration complète)
    for f in FEATURES:
        if f not in df.columns:
            df[f] = NEUTRAL
        else:
            df[f] = pd.to_numeric(df[f], errors="coerce").fillna(NEUTRAL)

    df["finish_pos"] = pd.to_numeric(df["finish_pos"], errors="coerce")
    df = df.dropna(subset=["race_id", "finish_pos"])
    df["finish_pos"] = df["finish_pos"].astype(int)

    return df


# ─── Préparation pour XGBRanker ───────────────────────────────────────────────

def _prepare_ranking_data(
    df: pd.DataFrame,
) -> tuple[np.ndarray, np.ndarray, np.ndarray] | tuple[None, None, None]:
    """
    XGBRanker attend :
      - X      : feature matrix (n_samples × n_features)
      - y      : relevance labels (entiers, plus haut = meilleur)
      - groups : taille de chaque groupe (course)

    Données triées par race_id (obligatoire pour les groupes).
    """
    # Garder seulement les courses avec ≥ 3 partants et un gagnant
    def valid_race(g: pd.DataFrame) -> bool:
        return len(g) >= 3 and (g["finish_pos"] == 1).any()

    df = df.groupby("race_id", group_keys=False).filter(valid_race)
    if df.empty:
        return None, None, None

    df = df.sort_values("race_id").reset_index(drop=True)

    # Relevance = max_pos_dans_la_course - finish_pos + 1
    # → gagnant (pos=1) a la plus haute valeur dans son groupe
    df["max_pos"] = df.groupby("race_id")["finish_pos"].transform("max")
    df["relevance"] = (df["max_pos"] - df["finish_pos"] + 1).astype(int)

    X = df[FEATURES].values.astype(np.float32)
    y = df["relevance"].values.astype(int)
    groups = df.groupby("race_id", sort=False).size().values

    return X, y, groups


# ─── Entraînement ─────────────────────────────────────────────────────────────

def train(days: int = 90) -> dict:
    logger.info("Fetching training data (last %d days)…", days)
    df = fetch_training_data(days)

    if len(df) < 200:
        return {
            "success": False,
            "reason": "insufficient data",
            "rows": len(df),
        }

    X, y, groups = _prepare_ranking_data(df)
    if X is None:
        return {"success": False, "reason": "data preparation failed"}

    n_races = len(groups)
    n_train = max(1, int(n_races * 0.70))

    # Split train / validation par course (70/30)
    cum = np.cumsum(groups)
    split_idx = int(cum[n_train - 1])

    X_train, X_val = X[:split_idx], X[split_idx:]
    y_train, y_val = y[:split_idx], y[split_idx:]
    g_train,  g_val  = groups[:n_train], groups[n_train:]

    logger.info(
        "Training XGBRanker on %d races (%d horses), validating on %d races…",
        n_train, len(X_train), n_races - n_train,
    )

    # early_stopping_rounds dans le constructeur (API XGBoost 2.x)
    model = xgb.XGBRanker(
        objective="rank:pairwise",
        n_estimators=400,
        max_depth=5,
        learning_rate=0.04,
        subsample=0.80,
        colsample_bytree=0.80,
        min_child_weight=3,
        reg_alpha=0.1,
        reg_lambda=1.0,
        random_state=42,
        verbosity=0,
        early_stopping_rounds=40,
    )

    # Validation set pour early stopping (XGBoost 2.x : eval_group dans fit)
    if len(g_val) > 0:
        model.fit(
            X_train, y_train,
            group=g_train,
            eval_set=[(X_val, y_val)],
            eval_group=[g_val],
            verbose=False,
        )
    else:
        model.fit(X_train, y_train, group=g_train, verbose=False)

    model.save_model(str(MODEL_PATH))
    logger.info("Model saved → %s (best iter: %d)", MODEL_PATH, model.best_iteration)

    # Feature importances
    importances = {
        f: round(float(v), 4)
        for f, v in zip(FEATURES, model.feature_importances_)
    }

    train_top1, train_top3 = _accuracy(X_train, y_train, g_train, model)
    val_top1,   val_top3   = _accuracy(X_val,   y_val,   g_val,   model)

    return {
        "success": True,
        "n_estimators": model.best_iteration + 1,
        "train_races": n_train,
        "val_races": n_races - n_train,
        "train_top1": round(train_top1, 3),
        "train_top3": round(train_top3, 3),
        "val_top1": round(val_top1, 3),
        "val_top3": round(val_top3, 3),
        "feature_importances": importances,
    }


# ─── Métriques top-k ──────────────────────────────────────────────────────────

def _accuracy(
    X: np.ndarray,
    y: np.ndarray,
    groups: np.ndarray,
    model: xgb.XGBRanker,
) -> tuple[float, float]:
    scores = model.predict(X)
    top1_hits = top3_hits = total = 0
    idx = 0
    for g in groups:
        s = scores[idx : idx + g]
        r = y[idx : idx + g]
        order = np.argsort(-s)       # indices triés par score décroissant
        best  = int(np.argmax(r))    # indice du vrai gagnant (relevance max)

        if order[0] == best:
            top1_hits += 1
        if best in order[:3]:
            top3_hits += 1
        total += 1
        idx += g

    return (
        top1_hits / total if total else 0.0,
        top3_hits / total if total else 0.0,
    )


# ─── Prédiction ───────────────────────────────────────────────────────────────

def _load_model() -> xgb.XGBRanker | None:
    if MODEL_PATH.exists():
        m = xgb.XGBRanker()
        m.load_model(str(MODEL_PATH))
        return m
    return None


def predict(horse_features: list[dict]) -> list[float]:
    """
    Retourne des scores 0-100 (plus haut = plus susceptible de gagner).
    Fallback sur la moyenne uniforme si le modèle n'est pas encore entraîné.
    """
    if not horse_features:
        return []

    model = _load_model()

    X = np.array(
        [[h.get(f, NEUTRAL) for f in FEATURES] for h in horse_features],
        dtype=np.float32,
    )

    if model is None:
        # Pas encore de modèle : score uniforme (le fallback linéaire de route.ts prend le relais)
        return [50.0] * len(horse_features)

    raw = model.predict(X)

    # Normalisation 0-100 par rapport au champ courant (une course à la fois)
    lo, hi = float(raw.min()), float(raw.max())
    if hi > lo:
        return [round((float(v) - lo) / (hi - lo) * 100, 1) for v in raw]
    return [50.0] * len(horse_features)


def feature_importances() -> dict | None:
    m = _load_model()
    if m is None:
        return None
    return {f: round(float(v), 4) for f, v in zip(FEATURES, m.feature_importances_)}
