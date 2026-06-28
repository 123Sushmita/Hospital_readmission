"""
Trains the readmission risk model and precomputes everything the dashboard
needs, so the API only has to load JSON/joblib files at startup instead of
recomputing stats from the raw CSV on every request.

Run once (or whenever the dataset changes):
    python train_model.py
"""
import json
import warnings
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.tree import DecisionTreeClassifier

warnings.filterwarnings("ignore")

BASE_DIR = Path(__file__).parent
DATA_PATH = BASE_DIR / "data" / "hospital_readmissions.csv"
MODEL_DIR = BASE_DIR / "model"
MODEL_DIR.mkdir(exist_ok=True)

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
TARGET = "readmitted"

AGE_ORDER = ["[40-50)", "[50-60)", "[60-70)", "[70-80)", "[80-90)", "[90-100)"]


def main():
    df = pd.read_csv(DATA_PATH)
    df[TARGET] = df[TARGET].map({"no": 0, "yes": 1})

    X = df[NUMERIC_COLS + CATEGORICAL_COLS]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", "passthrough", NUMERIC_COLS),
            ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_COLS),
        ]
    )

    candidates = {
        "Logistic Regression": LogisticRegression(max_iter=1000),
        "Decision Tree": DecisionTreeClassifier(random_state=42, max_depth=8),
        "Random Forest": RandomForestClassifier(
            n_estimators=200, random_state=42, max_depth=12, n_jobs=-1
        ),
        "Gradient Boosting": GradientBoostingClassifier(random_state=42),
    }

    results = []
    fitted_pipelines = {}
    roc_curves = {}

    for name, clf in candidates.items():
        pipe = Pipeline([("prep", preprocessor), ("clf", clf)])
        pipe.fit(X_train, y_train)
        preds = pipe.predict(X_test)
        probs = pipe.predict_proba(X_test)[:, 1]

        fpr, tpr, _ = roc_curve(y_test, probs)
        # subsample the curve to ~30 points so the JSON stays small
        idx = np.linspace(0, len(fpr) - 1, min(30, len(fpr))).astype(int)
        roc_curves[name] = {
            "fpr": [round(float(v), 4) for v in fpr[idx]],
            "tpr": [round(float(v), 4) for v in tpr[idx]],
        }

        metrics = {
            "model": name,
            "accuracy": round(accuracy_score(y_test, preds), 4),
            "precision": round(precision_score(y_test, preds), 4),
            "recall": round(recall_score(y_test, preds), 4),
            "f1": round(f1_score(y_test, preds), 4),
            "roc_auc": round(roc_auc_score(y_test, probs), 4),
        }
        results.append(metrics)
        fitted_pipelines[name] = pipe
        print(metrics)

    results_df = pd.DataFrame(results).sort_values("roc_auc", ascending=False)
    best_name = results_df.iloc[0]["model"]
    best_pipeline = fitted_pipelines[best_name]
    print(f"\nBest model by ROC-AUC: {best_name}")

    joblib.dump(best_pipeline, MODEL_DIR / "model.joblib")

    # ---- feature importance (only meaningful for tree-based models) ----
    feature_importance = []
    clf = best_pipeline.named_steps["clf"]
    if hasattr(clf, "feature_importances_"):
        feature_names = best_pipeline.named_steps["prep"].get_feature_names_out()
        importances = clf.feature_importances_
        fi_df = pd.DataFrame(
            {"feature": feature_names, "importance": importances}
        ).sort_values("importance", ascending=False)
        fi_df["feature"] = fi_df["feature"].str.replace("num__", "", regex=False)
        fi_df["feature"] = fi_df["feature"].str.replace("cat__", "", regex=False)
        feature_importance = (
            fi_df.head(12)
            .assign(importance=lambda d: d["importance"].round(4))
            .to_dict(orient="records")
        )

    # ---- dataset-wide stats for averages used in "vs. average patient" ----
    numeric_means = df[NUMERIC_COLS].mean().round(2).to_dict()

    # ---- precompute dashboard stats ----
    readmit_counts = df[TARGET].value_counts().to_dict()
    overview = {
        "total_patients": int(len(df)),
        "readmitted_count": int(readmit_counts.get(1, 0)),
        "not_readmitted_count": int(readmit_counts.get(0, 0)),
        "readmission_rate": round(df[TARGET].mean() * 100, 2),
        "avg_time_in_hospital": round(df["time_in_hospital"].mean(), 2),
        "avg_medications": round(df["n_medications"].mean(), 2),
        "avg_lab_procedures": round(df["n_lab_procedures"].mean(), 2),
    }

    age_rate = (
        df.groupby("age")[TARGET].mean().mul(100).round(2).reindex(AGE_ORDER)
    )
    age_distribution = [
        {"age": age, "readmission_rate": float(rate)}
        for age, rate in age_rate.items()
    ]

    def categorical_breakdown(col, top_n=8):
        grp = (
            df.groupby(col)
            .agg(count=(TARGET, "size"), readmission_rate=(TARGET, "mean"))
            .reset_index()
        )
        grp["readmission_rate"] = (grp["readmission_rate"] * 100).round(2)
        grp = grp.sort_values("count", ascending=False).head(top_n)
        return grp.rename(columns={col: "category"}).to_dict(orient="records")

    categorical_breakdowns = {
        "medical_specialty": categorical_breakdown("medical_specialty"),
        "diag_1": categorical_breakdown("diag_1"),
        "glucose_test": categorical_breakdown("glucose_test"),
        "A1Ctest": categorical_breakdown("A1Ctest"),
        "change": categorical_breakdown("change"),
        "diabetes_med": categorical_breakdown("diabetes_med"),
    }

    def histogram(col, bins=12):
        counts, edges = np.histogram(df[col], bins=bins)
        return [
            {
                "bin_start": round(float(edges[i]), 1),
                "bin_end": round(float(edges[i + 1]), 1),
                "count": int(counts[i]),
            }
            for i in range(len(counts))
        ]

    numerical_distributions = {col: histogram(col) for col in NUMERIC_COLS}

    corr = df[NUMERIC_COLS].corr().round(3)
    correlations = {
        "columns": NUMERIC_COLS,
        "matrix": corr.values.round(3).tolist(),
    }

    options = {col: sorted(df[col].dropna().unique().tolist()) for col in CATEGORICAL_COLS}
    # age should stay in chronological order, not alphabetical
    options["age"] = AGE_ORDER

    dashboard_payload = {
        "overview": overview,
        "age_distribution": age_distribution,
        "categorical_breakdowns": categorical_breakdowns,
        "numerical_distributions": numerical_distributions,
        "correlations": correlations,
        "feature_importance": feature_importance,
        "numeric_means": numeric_means,
        "options": options,
        "model_comparison": results_df.round(4).to_dict(orient="records"),
        "roc_curves": roc_curves,
        "best_model": best_name,
    }

    with open(MODEL_DIR / "dashboard_data.json", "w") as f:
        json.dump(dashboard_payload, f, indent=2)

    print(f"\nSaved model -> {MODEL_DIR / 'model.joblib'}")
    print(f"Saved dashboard data -> {MODEL_DIR / 'dashboard_data.json'}")


if __name__ == "__main__":
    main()
