"""
EquiPredict — Microservice XGBoost
FastAPI servant le modèle XGBRanker pour le scoring des courses hippiques.
"""

from __future__ import annotations

import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Security
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel, Field

import model as xgb_model

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TRAIN_SECRET = os.environ.get("TRAIN_SECRET", "")


# ─── Sécurité : clé secrète sur /train ───────────────────────────────────────

api_key_header = APIKeyHeader(name="X-Train-Secret", auto_error=False)

def require_train_secret(key: str | None = Security(api_key_header)) -> str:
    if not TRAIN_SECRET:
        return ""  # pas de secret configuré = endpoint ouvert (dev)
    if key != TRAIN_SECRET:
        raise HTTPException(status_code=403, detail="Invalid train secret")
    return key


# ─── Lifespan : warmup du modèle au démarrage ────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    m = xgb_model._load_model()
    if m is not None:
        logger.info("XGBoost model loaded from %s", xgb_model.MODEL_PATH)
    else:
        logger.warning("No trained model found — /predict will return neutral scores until /train is called")
    yield


app = FastAPI(
    title="EquiPredict XGBoost Service",
    version="1.0.0",
    lifespan=lifespan,
)


# ─── Schémas Pydantic ─────────────────────────────────────────────────────────

class HorseFeatures(BaseModel):
    id: str
    raw_form:             float = Field(default=5.0, ge=0, le=10)
    raw_odds_rank:        float = Field(default=5.0, ge=0, le=10)
    raw_consist:          float = Field(default=5.0, ge=0, le=10)
    raw_placement:        float = Field(default=5.0, ge=0, le=10)
    raw_mvt:              float = Field(default=5.0, ge=0, le=10)
    raw_age:              float = Field(default=5.0, ge=0, le=10)
    raw_earnings:         float = Field(default=5.0, ge=0, le=10)
    raw_jockey_wr:        float = Field(default=5.0, ge=0, le=10)
    raw_trainer_wr:       float = Field(default=5.0, ge=0, le=10)
    raw_weight_penalty:   float = Field(default=5.0, ge=0, le=10)
    raw_form_x_signal:    float = Field(default=5.0, ge=0, le=10)
    raw_jockey_x_trainer: float = Field(default=5.0, ge=0, le=10)


class PredictRequest(BaseModel):
    horses: list[HorseFeatures]


class TrainRequest(BaseModel):
    days: int = Field(default=90, ge=14, le=365)


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_ready": xgb_model.MODEL_PATH.exists(),
        "features": xgb_model.FEATURES,
    }


@app.post("/train")
def train_endpoint(
    req: TrainRequest = TrainRequest(),
    _: str = Security(require_train_secret),
):
    """
    Entraîne le modèle XGBRanker sur les données race_outcomes.
    Appelé par le cron Supabase chaque nuit à 00:00.
    """
    logger.info("Training requested for last %d days", req.days)
    result = xgb_model.train(days=req.days)
    if not result.get("success"):
        raise HTTPException(status_code=422, detail=result)
    return result


@app.post("/predict")
def predict_endpoint(req: PredictRequest):
    """
    Retourne un score XGBoost 0-100 pour chaque cheval.
    Les chevaux DOIVENT appartenir à la même course (normalisation relative).
    """
    if not req.horses:
        return {"scores": []}

    features = [
        {f: getattr(h, f) for f in xgb_model.FEATURES}
        for h in req.horses
    ]
    scores = xgb_model.predict(features)

    return {
        "scores": [
            {"id": h.id, "xgb_score": scores[i]}
            for i, h in enumerate(req.horses)
        ],
        "model_ready": xgb_model.MODEL_PATH.exists(),
    }


@app.get("/feature-importance")
def feature_importance_endpoint():
    fi = xgb_model.feature_importances()
    if fi is None:
        return {"available": False, "message": "Model not trained yet"}
    # Tri par importance décroissante
    sorted_fi = dict(sorted(fi.items(), key=lambda x: x[1], reverse=True))
    return {"available": True, "importances": sorted_fi}
