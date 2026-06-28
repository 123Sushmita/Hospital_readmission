import json
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import ComparisonPoint, PatientInput, PredictionResponse

BASE_DIR = Path(__file__).parent.parent
MODEL_PATH = BASE_DIR / "model" / "model.joblib"
DASHBOARD_DATA_PATH = BASE_DIR / "model" / "dashboard_data.json"

NUMERIC_COLS = [
    "time_in_hospital",
    "n_lab_procedures",
    "n_procedures",
    "n_medications",
    "n_outpatient",
    "n_inpatient",
    "n_emergency",
]
CATEGORICAL_COLS = [
    "age",
    "medical_specialty",
    "diag_1",
    "diag_2",
    "diag_3",
    "glucose_test",
    "A1Ctest",
    "change",
    "diabetes_med",
]

app = FastAPI(
    title="ReadmitWatch API",
    description="Predicts 30-day hospital readmission risk and serves population-level analytics.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to your frontend's origin before deploying publicly
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None
dashboard_data = None


@app.on_event("startup")
def load_artifacts():
    global model, dashboard_data
    if not MODEL_PATH.exists() or not DASHBOARD_DATA_PATH.exists():
        raise RuntimeError(
            "Model artifacts not found. Run `python train_model.py` from the "
            "backend/ directory before starting the API."
        )
    model = joblib.load(MODEL_PATH)
    with open(DASHBOARD_DATA_PATH) as f:
        dashboard_data = json.load(f)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/options")
def get_options():
    """Categorical dropdown options for the prediction form."""
    return dashboard_data["options"]


@app.get("/api/model-info")
def model_info():
    return {
        "best_model": dashboard_data["best_model"],
        "model_comparison": dashboard_data["model_comparison"],
        "roc_curves": dashboard_data["roc_curves"],
        "feature_importance": dashboard_data["feature_importance"],
    }


@app.get("/api/dashboard/overview")
def dashboard_overview():
    return dashboard_data["overview"]


@app.get("/api/dashboard/age-distribution")
def dashboard_age_distribution():
    return dashboard_data["age_distribution"]


@app.get("/api/dashboard/categorical-breakdowns")
def dashboard_categorical_breakdowns():
    return dashboard_data["categorical_breakdowns"]


@app.get("/api/dashboard/numerical-distributions")
def dashboard_numerical_distributions():
    return dashboard_data["numerical_distributions"]


@app.get("/api/dashboard/correlations")
def dashboard_correlations():
    return dashboard_data["correlations"]


@app.get("/api/dashboard/feature-importance")
def dashboard_feature_importance():
    return dashboard_data["feature_importance"]


def _risk_band(probability: float):
    if probability < 0.40:
        return "Low", 0
    elif probability < 0.60:
        return "Medium", 40
    return "High", 60


def _build_comparisons(payload: PatientInput) -> list[ComparisonPoint]:
    means = dashboard_data["numeric_means"]
    top_numeric_features = [
        f["feature"]
        for f in dashboard_data["feature_importance"]
        if f["feature"] in NUMERIC_COLS
    ][:4]

    comparisons = []
    for feature in top_numeric_features:
        patient_value = getattr(payload, feature)
        avg = means.get(feature, 0)
        if patient_value > avg * 1.05:
            direction = "above_average"
        elif patient_value < avg * 0.95:
            direction = "below_average"
        else:
            direction = "at_average"
        comparisons.append(
            ComparisonPoint(
                feature=feature,
                patient_value=patient_value,
                average_value=avg,
                direction=direction,
            )
        )
    return comparisons


@app.post("/api/predict", response_model=PredictionResponse)
def predict(payload: PatientInput):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded.")

    row = {col: getattr(payload, col) for col in NUMERIC_COLS + CATEGORICAL_COLS}
    X = pd.DataFrame([row])

    probability = float(model.predict_proba(X)[0, 1])
    risk_level, band_floor = _risk_band(probability)
    comparisons = _build_comparisons(payload)

    messages = {
        "Low": "This patient's profile is in line with or below typical readmission risk factors.",
        "Medium": "This patient shows a moderate mix of risk factors. Consider a standard post-discharge follow-up.",
        "High": "This patient's profile carries several elevated risk factors. Consider prioritizing for proactive follow-up and a structured discharge plan.",
    }

    return PredictionResponse(
        readmission_probability=round(probability * 100, 1),
        risk_level=risk_level,
        risk_band_floor=band_floor,
        model_used=dashboard_data["best_model"],
        comparisons=comparisons,
        message=messages[risk_level],
    )
