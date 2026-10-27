"""
CrediFlux Configuration
Handles environment settings, schema definitions, model feature names,
preprocessing statistics, and verified metrics provenance.
"""

import os
from typing import List, Dict, Any
from pathlib import Path


def find_repo_root() -> Path:
    """Finds the root directory containing models/ and requirements.txt."""
    current = Path(__file__).resolve().parent
    while current != current.parent:
        if (current / "models").exists() or (current / "requirements.txt").exists():
            return current
        current = current.parent
    return Path(__file__).resolve().parent.parent


REPO_ROOT = find_repo_root()

# Environment-configurable variables
MODELS_DIR = Path(os.getenv("CREDIFLUX_MODELS_DIR", str(REPO_ROOT / "models"))).resolve()
DATA_DIR = Path(os.getenv("CREDIFLUX_DATA_DIR", str(REPO_ROOT / "data"))).resolve()
FRONTEND_DIST_DIR = Path(os.getenv("CREDIFLUX_FRONTEND_DIST", str(REPO_ROOT / "frontend" / "dist"))).resolve()

CORS_ORIGINS: List[str] = [
    origin.strip()
    for origin in os.getenv(
        "CREDIFLUX_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000"
    ).split(",")
    if origin.strip()
]
APP_VERSION = "1.0.0"
APP_NAME = "CrediFlux API"
EXPECTED_SKLEARN_VERSION = "1.7.2"

# 35 Model Features in Exact Training Order
FEATURE_NAMES: List[str] = [
    "loan_amnt", "installment", "int_rate", "dti", "fico_score",
    "revol_util", "open_acc", "total_acc", "delinq_2yrs",
    "log_annual_inc", "log_revol_bal", "credit_history_years",
    "installment_to_income", "loan_to_income", "open_to_total_acc_ratio",
    "revol_util_over_100", "has_delinq_2yrs", "sub_grade_num",
    "term_60m", "is_joint_app", "emp_length_num", "emp_length_missing",
    "home_RENT", "home_OWN", "home_OTHER",
    "ver_Source_Verified", "ver_Verified",
    "purpose_debt_consolidation", "purpose_credit_card", "purpose_home_improvement",
    "purpose_small_business", "purpose_major_purchase", "purpose_medical",
    "purpose_car", "purpose_other"
]

# Monotonic Subgrade mapping (A1=0 ... G5=34)
SUB_GRADE_MAP: Dict[str, int] = {
    f"{grade}{sub}": idx
    for idx, (grade, sub) in enumerate(
        [(g, s) for g in ["A", "B", "C", "D", "E", "F", "G"] for s in range(1, 6)]
    )
}

# Employment tenure mapping (years)
EMP_LENGTH_MAP: Dict[str, float] = {
    "< 1 year": 0.0,
    "1 year": 1.0,
    "2 years": 2.0,
    "3 years": 3.0,
    "4 years": 4.0,
    "5 years": 5.0,
    "6 years": 6.0,
    "7 years": 7.0,
    "8 years": 8.0,
    "9 years": 9.0,
    "10+ years": 10.0,
}

# Features required for model inference that are established during lender underwriting
LENDER_ASSIGNED_FEATURES: List[str] = [
    "sub_grade",
    "int_rate",
    "installment",
    "verification_status"
]

# Training-derived numerical anomaly caps and medians (learned on X_train only)
PREPROCESSING_STATS: Dict[str, float] = {
    "dti_median": 17.63,
    "revol_util_median": 52.40,
    "annual_inc_min": 3000.0,
    "dti_cap": 100.0,
    "revol_util_cap": 150.0,
    "annual_inc_cap": 550396.0,
    "revol_bal_cap": 277728.27,
    "emp_length_median": 6.0
}

# Population and sample statistics
TRAINING_METADATA: Dict[str, Any] = {
    "train_samples": 23803,
    "test_samples": 5951,
    "default_rate_train": 0.1996,
    "default_rate_test": 0.1996,
    "class_distribution": {"Fully Paid": 0.8004, "Charged Off": 0.1996}
}

# Verified Model Metrics on Untouched Test Set (Threshold = 0.50)
VERIFIED_METRICS: Dict[str, Dict[str, Any]] = {
    "Logistic Regression": {
        "name": "Logistic Regression",
        "type": "Pipeline([StandardScaler, LogisticRegression])",
        "task": "classification",
        "is_classifier": True,
        "can_serve_assess": False,
        "unavailability_reason": "Model requires lender-assigned features (sub_grade, int_rate, installment, verification_status) unavailable at prospective application intake.",
        "metrics": {
            "accuracy": 0.6554,
            "precision": 0.3139,
            "recall": 0.6128,
            "f1_score": 0.4152,
            "roc_auc": 0.6963,
            "pr_auc": 0.3568
        },
        "confusion_matrix": {
            "tn": 3172,
            "fp": 1591,
            "fn": 460,
            "tp": 728
        },
        "provenance": {
            "source_file": "scripts/evaluate_final_models.py (lines 98-105) & notebooks/10_final_test_evaluation.ipynb",
            "split": "Untouched Test Set (5,951 samples: 4,763 Fully Paid, 1,188 Charged Off)",
            "threshold": 0.50,
            "resampling_or_weights": "class_weight='balanced'",
            "evaluation_phase": "Phase 10: Final Test Evaluation"
        },
        "description": "Standardized Linear Probability Pipeline optimizing balanced sensitivity (Default recall: 61.28%)."
    },
    "Random Forest": {
        "name": "Random Forest",
        "type": "RandomForestClassifier(n_estimators=300, max_depth=20, min_samples_leaf=5)",
        "task": "classification",
        "is_classifier": True,
        "can_serve_assess": False,
        "unavailability_reason": "Model requires lender-assigned features (sub_grade, int_rate, installment, verification_status) unavailable at prospective application intake.",
        "metrics": {
            "accuracy": 0.7701,
            "precision": 0.3996,
            "recall": 0.3013,
            "f1_score": 0.3436,
            "roc_auc": 0.6936,
            "pr_auc": 0.3617
        },
        "confusion_matrix": {
            "tn": 4225,
            "fp": 538,
            "fn": 830,
            "tp": 358
        },
        "provenance": {
            "source_file": "scripts/evaluate_final_models.py (lines 98-105) & notebooks/10_final_test_evaluation.ipynb",
            "split": "Untouched Test Set (5,951 samples: 4,763 Fully Paid, 1,188 Charged Off)",
            "threshold": 0.50,
            "resampling_or_weights": "class_weight='balanced'",
            "evaluation_phase": "Phase 10: Final Test Evaluation"
        },
        "description": "Nonlinear Ensembling with balanced class weighting, maximizing conservative specificity (Accuracy: 77.01%)."
    },
    "Linear Regression Baseline": {
        "name": "Linear Regression Baseline",
        "type": "LinearRegression (Ordinary Least Squares)",
        "task": "regression",
        "is_classifier": False,
        "can_serve_assess": False,
        "unavailability_reason": "Linear Regression is an unbounded continuous regressor (Linear Probability Model benchmark), not a calibrated probability classifier. It does not exist as a serialized artifact on disk.",
        "metrics": {
            "mae": 0.295204,
            "mse": 0.146893,
            "rmse": 0.383267,
            "r2": 0.080642,
            "accuracy": 0.799866,
            "precision": 0.470588,
            "recall": 0.020202,
            "f1_score": 0.038741,
            "roc_auc": None,
            "pr_auc": None
        },
        "confusion_matrix": {
            "tn": 4736,
            "fp": 27,
            "fn": 1164,
            "tp": 24
        },
        "provenance": {
            "source_file": "scripts/train_baseline.py & notebooks/02_linear_regression_baseline.ipynb (Cell 10)",
            "split": "80/20 train/test split on resolved loans (5,951 test instances, 12 numerical origination features)",
            "threshold": 0.50,
            "resampling_or_weights": "None (Standard OLS)",
            "evaluation_phase": "Phase 2: Baseline Benchmark"
        },
        "description": "Benchmark Linear Probability Model on 12 origination features. Unbounded predictions violate probability constraints."
    },
    "XGBoost": {
        "name": "XGBoost",
        "type": "XGBClassifier(n_estimators=200, max_depth=3, learning_rate=0.05)",
        "task": "classification",
        "is_classifier": True,
        "can_serve_assess": False,
        "unavailability_reason": "Evaluated in research notebooks and scripts, but model artifact is not serialized on disk in models/.",
        "metrics": {
            "accuracy": 0.6459,
            "precision": 0.3122,
            "recall": 0.6431,
            "f1_score": 0.4204,
            "roc_auc": 0.6990,
            "pr_auc": 0.3631
        },
        "confusion_matrix": {
            "tn": 3080,
            "fp": 1683,
            "fn": 424,
            "tp": 764
        },
        "provenance": {
            "source_file": "scripts/evaluate_final_models.py (lines 98-105) & notebooks/10_final_test_evaluation.ipynb",
            "split": "Untouched Test Set (5,951 samples)",
            "threshold": 0.50,
            "resampling_or_weights": "scale_pos_weight=4.01",
            "evaluation_phase": "Phase 10: Final Test Evaluation"
        },
        "description": "Gradient-boosted decision tree champion model in repo evaluation; not serialized as joblib artifact."
    }
}
