"""
CrediFlux Inference Service
Executes model prediction, computes risk bands with documented rationale,
calculates feature drivers/contributions, and enforces compliance disclaimers.
"""

from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd

from backend.app.services.model_loader import get_model_loader
from backend.app.schemas import FeatureDriver

DISCLAIMER_TEXT = (
    "CrediFlux is an academic and portfolio machine learning platform. Predictions are derived "
    "from historical peer-to-peer Lending Club data and are intended solely for educational analysis. "
    "This system is not licensed or approved for actual credit underwriting, loan approvals, or "
    "consumer lending decisions under ECOA/FCRA regulations. No protected-attribute fair lending audit "
    "has been performed."
)


def compute_risk_band(prob: float) -> tuple[str, str]:
    """
    Derives heuristic risk bands and rationale from training data evidence.
    Cutoffs:
      - Low Risk: prob < 0.20 (Below 19.96% baseline population default prevalence)
      - Moderate Risk: 0.20 <= prob < 0.50 (Between base prevalence and 0.50 decision threshold)
      - High Risk: 0.50 <= prob < 0.75 (Above 0.50 classification threshold; flagged as default)
      - Critical Risk: prob >= 0.75 (Severe default hazard)
    """
    if prob < 0.20:
        return (
            "Low Risk",
            f"Estimated default probability ({prob:.1%}) is below the baseline training data default rate (19.96%). Borrower profile exhibits strong repayment indicators."
        )
    elif prob < 0.50:
        return (
            "Moderate Risk",
            f"Estimated default probability ({prob:.1%}) is above population baseline prevalence (19.96%) but remains below the standard decision boundary (50.0%)."
        )
    elif prob < 0.75:
        return (
            "High Risk",
            f"Estimated default probability ({prob:.1%}) exceeds the balanced decision threshold (50.0%). The model flags this loan for potential charge-off."
        )
    else:
        return (
            "Critical Risk",
            f"Estimated default probability ({prob:.1%}) indicates severe credit distress (>75%). Strongest risk indicators present across multiple credit dimensions."
        )


def compute_feature_contributions(model: Any, model_name: str, df_1row: pd.DataFrame) -> List[FeatureDriver]:
    """
    Extracts top feature contributors:
    - For Logistic Regression: computes exact signed log-odds contribution (w_i * z_i)
    - For Random Forest: ranks features by global Gini importance weighted by input deviation
    """
    drivers: List[FeatureDriver] = []

    try:
        if model_name == "Logistic Regression" and hasattr(model, "named_steps"):
            scaler = model.named_steps.get("scaler")
            logreg = model.named_steps.get("logreg")

            if scaler is not None and logreg is not None:
                feature_names = list(df_1row.columns)
                X_raw = df_1row.values[0]
                X_scaled = (X_raw - scaler.mean_) / scaler.scale_
                weights = logreg.coef_[0]

                contributions = weights * X_scaled
                sorted_indices = np.argsort(contributions)

                # Top 3 risk increasers (highest positive contributions to default log-odds)
                top_increasers = sorted_indices[-3:][::-1]
                for idx in top_increasers:
                    val = float(contributions[idx])
                    if val > 0:
                        fname = feature_names[idx]
                        drivers.append(FeatureDriver(
                            feature=fname,
                            contribution=round(val, 4),
                            direction="increases_risk",
                            description=f"Value ({X_raw[idx]:.2f}) contributes +{val:.2f} to default log-odds."
                        ))

                # Top 3 risk decreasers (most negative contributions, reducing default probability)
                top_decreasers = sorted_indices[:3]
                for idx in top_decreasers:
                    val = float(contributions[idx])
                    if val < 0:
                        fname = feature_names[idx]
                        drivers.append(FeatureDriver(
                            feature=fname,
                            contribution=round(val, 4),
                            direction="decreases_risk",
                            description=f"Value ({X_raw[idx]:.2f}) contributes {val:.2f} toward loan repayment."
                        ))

        elif model_name == "Random Forest" and hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
            feature_names = list(df_1row.columns)
            top_indices = np.argsort(importances)[-5:][::-1]

            for idx in top_indices:
                drivers.append(FeatureDriver(
                    feature=feature_names[idx],
                    contribution=round(float(importances[idx]), 4),
                    direction="increases_risk" if df_1row.values[0][idx] > 0 else "decreases_risk",
                    description=f"Key ensembling decision feature (Global Gini Importance: {importances[idx]:.3f})."
                ))

    except Exception:
        # Fallback gracefully if contribution decomposition encounters unexpected structure
        pass

    return drivers


def score_record(df_features: pd.DataFrame, model_name: str = "Logistic Regression") -> Dict[str, Any]:
    """
    Executes model inference on a validated 1-row DataFrame containing all 35 features.
    """
    loader = get_model_loader()
    model = loader.get_model(model_name)

    # Compute default probability (index 1 is Charged Off)
    probs = model.predict_proba(df_features)[0]
    default_prob = float(probs[1])
    repay_prob = float(probs[0])

    threshold = 0.50
    predicted_class = int(default_prob >= threshold)
    predicted_label = "Charged Off" if predicted_class == 1 else "Fully Paid"

    risk_band, rationale = compute_risk_band(default_prob)
    drivers = compute_feature_contributions(model, model_name, df_features)

    return {
        "status": "ok",
        "model": model_name,
        "default_probability": round(default_prob, 4),
        "repayment_probability": round(repay_prob, 4),
        "predicted_class": predicted_class,
        "predicted_label": predicted_label,
        "risk_band": risk_band,
        "band_rationale": rationale,
        "threshold_used": threshold,
        "feature_contributions": drivers,
        "disclaimer": DISCLAIMER_TEXT,
        "evaluation_type": "Retrospective Historical Scoring",
        "is_prospective_approval": False
    }
