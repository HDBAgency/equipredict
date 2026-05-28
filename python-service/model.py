"""
XGBoost ranking model for horse race prediction.
Uses XGBRanker with rank:pairwise — optimal for ordinal ranking (finish position).
Supabase access via httpx + PostgREST (no supabase-py dependency).
"""

from __future__ import annotations

import os
import logging
from pathlib import Path
from datetime import datetime, timedelta

import httpx
import numpy as np
import pandas as pd
import xgboost as xgb

logger = logging.getLogger(__name__)

MODEL_PATH = Path("xgb_model.ubj")

FEATURES: list[str] = [
    "raw_form",
    "raw_odds_rank",
    "raw_consist",
    "raw_placement",
    "raw_mvt",
    "raw_age",
    "raw_earnings",
    "raw_jockey_wr",
    "raw_trainer_wr",
    "raw_weight_penalty",
    "raw_form_x_signal",
    "raw_jockey_x_trainer",
]

NEUTRAL = 5.0


# ─── Supabase REST (PostgREST) via httpx ─────────────────────────────────────

def _supabase_select(table: str, columns: list[str], filters: dict[str, str] | None = None) -> list[dict]:
    """
    Appel GET PostgREST.
    filters = {"race_date": "gte.2025-01-01"} → ?race_date=gte.2025-01-01
    """
    url     = os.environ["SUPABASE_URL"].rstrip("/")
    key     = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    headers = {
        "apikey":        key,
        "Authorization": f"Bearer {key}",
    }
    params: dict[str, str] = {"select": ",".join(columns)}
    if filters:
        params.update(filters)

    with httpx.Client(timeout=30.0) as client:
        resp = client.get(f"{url}/rest/v1/{table}", headers=headers, params=params)

    resp.raise_for_status()
    return resp.json()


# ─── Collecte des données ─────────────────────────────────────────────────────

def fetch_training_data(days: int = 90) -> pd.DataFrame:
    since = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    cols  = ["race_id", "finish_pos"] + FEATURES

    try:
        rows = _supabase_select(
            table="race_outcomes",
            columns=cols,
            filters={"race_date": f"gte.{since}"},
        )
    except Exception as exc:
        logger.error("Supabase fetch failed: %s", exc)
        return pd.DataFrame(columns=cols)

    if not rows:
        return pd.DataFrame(columns=cols)

    df = pd.DataFrame(rows)

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

def _prepare(df: pd.DataFrame):
    def valid(g: pd.DataFrame) -> bool:
        return len(g) >= 3 and (g["finish_pos"] == 1).any()

    df = df.groupby("race_id", group_keys=False).filter(valid)
    if df.empty:
        return None, None, None

    df = df.sort_values("race_id").reset_index(drop=True)
    df["max_pos"]   = df.groupby("race_id")["finish_pos"].transform("max")
    df["relevance"] = (df["max_pos"] - df["finish_pos"] + 1).astype(int)

    X      = df[FEATURES].values.astype(np.float32)
    y      = df["relevance"].values.astype(int)
    groups = df.groupby("race_id", sort=False).size().values
    return X, y, groups


# ─── Entraînement ─────────────────────────────────────────────────────────────

def train(days: int = 90) -> dict:
    logger.info("Fetching %d days of race data…", days)
    df = fetch_training_data(days)

    if len(df) < 200:
        return {"success": False, "reason": "insufficient_data", "rows": len(df)}

    result = _prepare(df)
    if result[0] is None:
        return {"success": False, "reason": "preparation_failed"}

    X, y, groups = result
    n_races  = len(groups)
    n_train  = max(1, int(n_races * 0.70))
    cum      = np.cumsum(groups)
    split    = int(cum[n_train - 1])

    X_tr, X_val = X[:split],  X[split:]
    y_tr, y_val = y[:split],  y[split:]
    g_tr, g_val = groups[:n_train], groups[n_train:]

    logger.info("Training on %d races, validating on %d…", n_train, n_races - n_train)

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

    if len(g_val) > 0:
        model.fit(
            X_tr, y_tr,
            group=g_tr,
            eval_set=[(X_val, y_val)],
            eval_group=[g_val],
            verbose=False,
        )
    else:
        model.fit(X_tr, y_tr, group=g_tr, verbose=False)

    model.save_model(str(MODEL_PATH))
    best_iter = getattr(model, "best_iteration", model.n_estimators)
    logger.info("Model saved (best_iteration=%d)", best_iter)

    fi = {f: round(float(v), 4) for f, v in zip(FEATURES, model.feature_importances_)}
    tr_top1, tr_top3 = _accuracy(X_tr,  y_tr,  g_tr,  model)
    va_top1, va_top3 = _accuracy(X_val, y_val, g_val, model) if len(g_val) > 0 else (0.0, 0.0)

    return {
        "success":             True,
        "n_estimators":        best_iter,
        "train_races":         n_train,
        "val_races":           n_races - n_train,
        "train_top1":          round(tr_top1, 3),
        "train_top3":          round(tr_top3, 3),
        "val_top1":            round(va_top1, 3),
        "val_top3":            round(va_top3, 3),
        "feature_importances": fi,
    }


# ─── Métriques ────────────────────────────────────────────────────────────────

def _accuracy(X: np.ndarray, y: np.ndarray, groups: np.ndarray, model: xgb.XGBRanker):
    scores = model.predict(X)
    top1 = top3 = total = 0
    idx = 0
    for g in groups:
        s     = scores[idx: idx + g]
        r     = y[idx: idx + g]
        order = np.argsort(-s)
        best  = int(np.argmax(r))
        if order[0] == best:         top1 += 1
        if best in order[:3]:        top3 += 1
        total += 1
        idx   += g
    return (top1 / total if total else 0.0, top3 / total if total else 0.0)


# ─── Prédiction ───────────────────────────────────────────────────────────────

def load_model() -> xgb.XGBRanker | None:
    if not MODEL_PATH.exists():
        return None
    m = xgb.XGBRanker()
    m.load_model(str(MODEL_PATH))
    return m


def predict(horse_features: list[dict]) -> list[float]:
    if not horse_features:
        return []

    model = load_model()
    X     = np.array([[h.get(f, NEUTRAL) for f in FEATURES] for h in horse_features], dtype=np.float32)

    if model is None:
        return [50.0] * len(horse_features)

    raw = model.predict(X)
    lo, hi = float(raw.min()), float(raw.max())
    if hi > lo:
        return [round((float(v) - lo) / (hi - lo) * 100, 1) for v in raw]
    return [50.0] * len(horse_features)


def feature_importances() -> dict | None:
    m = load_model()
    if m is None:
        return None
    fi = {f: round(float(v), 4) for f, v in zip(FEATURES, m.feature_importances_)}
    return dict(sorted(fi.items(), key=lambda x: x[1], reverse=True))
