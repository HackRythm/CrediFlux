"""
CrediFlux Preprocessing Service
Transforms raw origination inputs or historical records into the exact 35-feature
representation expected by the serialized models, with strict data integrity controls.
"""

from typing import Dict, Any, Tuple, Optional, List
import numpy as np
import pandas as pd

from crediflux.config import (
    FEATURE_NAMES, SUB_GRADE_MAP, EMP_LENGTH_MAP, PREPROCESSING_STATS
)


class PreprocessingError(ValueError):
    """Raised when loan input fails numerical or business logic validation."""
    pass


LENDER_ASSIGNED_FIELDS = [
    "sub_grade",
    "int_rate",
    "installment",
    "verification_status"
]

TOP_PURPOSES = [
    "debt_consolidation", "credit_card", "home_improvement",
    "small_business", "major_purchase", "medical", "car"
]


def check_prospective_availability(data: Dict[str, Any]) -> Tuple[bool, List[str], List[str]]:
    """
    Analyzes whether input is missing lender-assigned fields required for prediction.
    Returns:
        (is_ready, missing_features, limitations)
    """
    missing = []
    for field in LENDER_ASSIGNED_FIELDS:
        if field not in data or data[field] is None:
            missing.append(field)

    limitations = [
        "The model requires lender-assigned underwriting outputs (sub_grade, int_rate, installment, verification_status) which are not yet determined for prospective applicants.",
        "Imputing lender-assigned fields with synthetic averages or sample medians violates statistical integrity and would fabricate predictions.",
        "Model trained on historical loans with class_weight='balanced', requiring all 35 origination features."
    ]

    is_ready = len(missing) == 0
    return is_ready, missing, limitations


def transform_historical_loan_to_dataframe(data: Dict[str, Any]) -> pd.DataFrame:
    """
    Transforms a complete historical origination loan record (including lender-assigned fields)
    into a single-row DataFrame matching the exact 35-feature schema.
    Replicates the Phase 4 feature engineering pipeline with 100% numerical parity.
    """
    # Verify required lender fields
    missing_lender = [f for f in LENDER_ASSIGNED_FIELDS if f not in data or data[f] is None]
    if missing_lender:
        raise PreprocessingError(
            f"Cannot transform loan record: missing required underwriting fields: {', '.join(missing_lender)}"
        )

    # 1. Base Numericals
    loan_amnt = float(data["loan_amnt"])
    annual_inc = float(data["annual_inc"])
    dti = float(data.get("dti", PREPROCESSING_STATS["dti_median"]))
    fico_score = float(data["fico_score"])
    revol_bal = float(data.get("revol_bal", 0.0))
    revol_util = float(data.get("revol_util", PREPROCESSING_STATS["revol_util_median"]))
    open_acc = float(data["open_acc"])
    total_acc = float(data["total_acc"])
    delinq_2yrs = float(data.get("delinq_2yrs", 0.0))
    credit_history_years = float(data["credit_history_years"])
    int_rate = float(data["int_rate"])
    installment = float(data["installment"])
    sub_grade = str(data["sub_grade"]).upper().strip()

    if sub_grade not in SUB_GRADE_MAP:
        raise PreprocessingError(
            f"Invalid subgrade '{sub_grade}'. Expected format: A1 through G5."
        )
    sub_grade_num = int(SUB_GRADE_MAP[sub_grade])

    # 2. Domain-Engineered Ratios (computed before capping, exactly as in Phase 4 Cell 8)
    # Notice: In notebook 04 Cell 8, installment_to_income and loan_to_income used raw annual_inc
    installment_to_income = (installment * 12.0) / (annual_inc + 1.0)
    loan_to_income = loan_amnt / (annual_inc + 1.0)
    open_to_total_acc_ratio = open_acc / (total_acc + 1.0)
    revol_util_over_100 = 1 if revol_util > 100.0 else 0
    has_delinq_2yrs = 1 if delinq_2yrs > 0 else 0

    # 3. Anomaly Capping & Imputation (Phase 4 Cell 10)
    if annual_inc <= 0:
        annual_inc_capped = PREPROCESSING_STATS["annual_inc_min"]
    else:
        annual_inc_capped = min(annual_inc, PREPROCESSING_STATS["annual_inc_cap"])

    dti_capped = min(max(dti, 0.0), PREPROCESSING_STATS["dti_cap"])
    revol_util_capped = min(max(revol_util, 0.0), PREPROCESSING_STATS["revol_util_cap"])
    revol_bal_capped = min(max(revol_bal, 0.0), PREPROCESSING_STATS["revol_bal_cap"])

    # 4. Log Transforms
    log_annual_inc = float(np.log1p(annual_inc_capped))
    log_revol_bal = float(np.log1p(revol_bal_capped))

    # 5. Categorical Encodings (Phase 4 Cell 12)
    term_str = str(data.get("term", "36 months")).strip()
    term_60m = 1 if term_str == "60 months" else 0

    app_type = str(data.get("application_type", "Individual")).strip()
    is_joint_app = 1 if app_type in ["Joint App", "Joint"] else 0

    # Employment length
    raw_emp = data.get("emp_length")
    if raw_emp is None or str(raw_emp).strip() not in EMP_LENGTH_MAP:
        emp_length_num = PREPROCESSING_STATS["emp_length_median"]
        emp_length_missing = 1
    else:
        emp_length_num = EMP_LENGTH_MAP[str(raw_emp).strip()]
        emp_length_missing = 0

    # Home ownership (Reference baseline: MORTGAGE)
    raw_home = str(data.get("home_ownership", "MORTGAGE")).upper().strip()
    home_RENT = 1 if raw_home == "RENT" else 0
    home_OWN = 1 if raw_home == "OWN" else 0
    home_OTHER = 1 if raw_home in ["OTHER", "ANY", "NONE"] else 0

    # Verification status (Reference baseline: Not Verified)
    raw_ver = str(data.get("verification_status", "Not Verified")).strip()
    ver_Source_Verified = 1 if raw_ver == "Source Verified" else 0
    ver_Verified = 1 if raw_ver == "Verified" else 0

    # Purpose (Reference baseline: other)
    raw_purpose = str(data.get("purpose", "other")).lower().strip()
    purpose_debt_consolidation = 1 if raw_purpose == "debt_consolidation" else 0
    purpose_credit_card = 1 if raw_purpose == "credit_card" else 0
    purpose_home_improvement = 1 if raw_purpose == "home_improvement" else 0
    purpose_small_business = 1 if raw_purpose == "small_business" else 0
    purpose_major_purchase = 1 if raw_purpose == "major_purchase" else 0
    purpose_medical = 1 if raw_purpose == "medical" else 0
    purpose_car = 1 if raw_purpose == "car" else 0
    purpose_other = 1 if (raw_purpose not in TOP_PURPOSES or raw_purpose == "other") else 0

    # 6. Assemble into DataFrame in exact feature order
    feature_row = {
        "loan_amnt": loan_amnt,
        "installment": installment,
        "int_rate": int_rate,
        "dti": dti_capped,
        "fico_score": fico_score,
        "revol_util": revol_util_capped,
        "open_acc": open_acc,
        "total_acc": total_acc,
        "delinq_2yrs": delinq_2yrs,
        "log_annual_inc": log_annual_inc,
        "log_revol_bal": log_revol_bal,
        "credit_history_years": credit_history_years,
        "installment_to_income": installment_to_income,
        "loan_to_income": loan_to_income,
        "open_to_total_acc_ratio": open_to_total_acc_ratio,
        "revol_util_over_100": revol_util_over_100,
        "has_delinq_2yrs": has_delinq_2yrs,
        "sub_grade_num": sub_grade_num,
        "term_60m": term_60m,
        "is_joint_app": is_joint_app,
        "emp_length_num": emp_length_num,
        "emp_length_missing": emp_length_missing,
        "home_RENT": home_RENT,
        "home_OWN": home_OWN,
        "home_OTHER": home_OTHER,
        "ver_Source_Verified": ver_Source_Verified,
        "ver_Verified": ver_Verified,
        "purpose_debt_consolidation": purpose_debt_consolidation,
        "purpose_credit_card": purpose_credit_card,
        "purpose_home_improvement": purpose_home_improvement,
        "purpose_small_business": purpose_small_business,
        "purpose_major_purchase": purpose_major_purchase,
        "purpose_medical": purpose_medical,
        "purpose_car": purpose_car,
        "purpose_other": purpose_other
    }

    df = pd.DataFrame([feature_row], columns=FEATURE_NAMES)
    return df


def validate_and_order_35_features(df_input: pd.DataFrame) -> pd.DataFrame:
    """
    Validates a DataFrame containing pre-engineered features, ensuring all 35 columns
    are present, numeric, non-null, and ordered identically to FEATURE_NAMES.
    """
    missing = [c for c in FEATURE_NAMES if c not in df_input.columns]
    if missing:
        raise PreprocessingError(
            f"Input DataFrame is missing required features: {missing[:5]} (total missing: {len(missing)})"
        )

    ordered_df = df_input[FEATURE_NAMES].copy()

    # Convert all to float
    try:
        ordered_df = ordered_df.astype(float)
    except Exception as e:
        raise PreprocessingError(f"Features must be strictly numeric: {e}")

    # Check for NaNs or Infs
    if ordered_df.isnull().any().any():
        nan_cols = ordered_df.columns[ordered_df.isnull().any()].tolist()
        raise PreprocessingError(f"Input features contain NaN values in columns: {nan_cols}")

    if np.isinf(ordered_df.values).any():
        raise PreprocessingError("Input features contain infinite values.")

    return ordered_df
