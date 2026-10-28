"""
CrediFlux Assessment Router
Endpoints:
  - POST /api/assess                 (Prospective Mode -> returns explicit 'unavailable')
  - POST /api/assess/retrospective   (Single Historical Loan -> real model scoring)
  - POST /api/assess/retrospective/batch (Batch CSV upload -> real model scoring)
"""

import io
from typing import Union, List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query, status
import numpy as np
import pandas as pd

from backend.app.schemas import (
    ProspectiveApplicantRequest,
    AssessResponseUnavailable,
    AssessResponseOk,
    RetrospectiveLoanRecord,
    RetrospectiveRaw35FeaturesRecord,
    RetrospectiveScoreResponse,
    RetrospectiveBatchResponse,
    RetrospectiveBatchItemResult
)
from backend.app.services.preprocessing import (
    check_prospective_availability,
    transform_historical_loan_to_dataframe,
    validate_and_order_35_features,
    PreprocessingError
)
from backend.app.services.inference import score_record, compute_risk_band

router = APIRouter(prefix="/api/assess", tags=["Credit Risk Assessment"])


@router.post(
    "",
    response_model=Union[AssessResponseOk, AssessResponseUnavailable],
    status_code=status.HTTP_200_OK,
    summary="Prospective Applicant Assessment"
)
def assess_prospective_applicant(
    payload: ProspectiveApplicantRequest
) -> Union[AssessResponseOk, AssessResponseUnavailable]:
    """
    Evaluates a prospective borrower application.
    
    PER PHASE 0 AUDIT VERDICT (NOT READY):
    The models require lender-assigned variables (sub_grade, int_rate, installment, verification_status)
    that are unavailable prior to credit underwriting. In accordance with strict prediction policy,
    this endpoint refuses to fabricate lender variables and returns an explicit 'unavailable' status
    with the missing features and limitations.
    """
    input_dict = payload.model_dump()
    is_ready, missing_features, limitations = check_prospective_availability(input_dict)

    if not is_ready:
        return AssessResponseUnavailable(
            status="unavailable",
            reason=(
                "Prospective applicant assessment is unavailable because the trained models require "
                "lender-assigned underwriting variables (sub_grade, int_rate, installment, verification_status) "
                "which are not yet determined at application intake."
            ),
            missing_features=missing_features,
            limitations=limitations,
            verdict="NOT READY",
            recommended_action=(
                "Use Retrospective Scoring (/api/assess/retrospective) to evaluate completed historical "
                "loan files with all 35 origination features, or approve retraining a dedicated "
                "prospective model using applicant-only features."
            )
        )

    # In the theoretical event all lender fields were supplied (not the case for prospective)
    df_features = transform_historical_loan_to_dataframe(input_dict)
    res = score_record(df_features, model_name="Logistic Regression")
    return AssessResponseOk(**res)


@router.post(
    "/retrospective",
    response_model=RetrospectiveScoreResponse,
    summary="Retrospective Historical Loan Scoring"
)
def assess_retrospective_record(
    payload: Union[RetrospectiveLoanRecord, RetrospectiveRaw35FeaturesRecord]
) -> RetrospectiveScoreResponse:
    """
    Evaluates a completed historical loan record where all 35 model features
    (including lender-assigned subgrade, interest rate, installment, and verification status)
    are present.
    Scores the record using the authentic serialized model.
    """
    try:
        model_name = payload.model_name or "Logistic Regression"

        if isinstance(payload, RetrospectiveRaw35FeaturesRecord):
            df_row = pd.DataFrame([payload.features])
            df_features = validate_and_order_35_features(df_row)
        else:
            raw_data = payload.model_dump()
            df_features = transform_historical_loan_to_dataframe(raw_data)

        result = score_record(df_features, model_name=model_name)
        return RetrospectiveScoreResponse(**result)

    except PreprocessingError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Preprocessing error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}"
        )


@router.post(
    "/retrospective/batch",
    response_model=RetrospectiveBatchResponse,
    summary="Batch Retrospective CSV Scoring"
)
async def assess_retrospective_batch_csv(
    file: UploadFile = File(..., description="CSV file containing historical loan records"),
    model_name: Optional[str] = Form(None),
    model_name_query: Optional[str] = Query(None, alias="model_name")
) -> RetrospectiveBatchResponse:
    """
    Upload a CSV file containing historical loan records (either the 35 pre-engineered features
    or full origination records) to be scored in batch by the chosen serialized model.
    """
    chosen_model = model_name or model_name_query or "Logistic Regression"
    if chosen_model not in ("Logistic Regression", "Random Forest"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="model_name must be 'Logistic Regression' or 'Random Forest'"
        )

    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be a CSV (.csv)."
        )

    try:
        content = await file.read()
        df_uploaded = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse uploaded CSV: {str(e)}"
        )

    if df_uploaded.empty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded CSV is empty."
        )

    # Check whether the CSV already contains the 35 features
    from backend.app.config import FEATURE_NAMES
    has_35_features = all(c in df_uploaded.columns for c in FEATURE_NAMES)

    results: List[RetrospectiveBatchItemResult] = []
    default_probs: List[float] = []

    for idx, row in df_uploaded.iterrows():
        try:
            if has_35_features:
                row_df = pd.DataFrame([row[FEATURE_NAMES].to_dict()])
                row_features = validate_and_order_35_features(row_df)
            else:
                row_dict = row.to_dict()
                row_features = transform_historical_loan_to_dataframe(row_dict)

            score_res = score_record(row_features, model_name=chosen_model)
            prob = score_res["default_probability"]
            default_probs.append(prob)

            results.append(RetrospectiveBatchItemResult(
                row_index=int(idx),
                status="success",
                default_probability=prob,
                predicted_class=score_res["predicted_class"],
                predicted_label=score_res["predicted_label"],
                risk_band=score_res["risk_band"]
            ))

        except Exception as e:
            results.append(RetrospectiveBatchItemResult(
                row_index=int(idx),
                status="error",
                error=str(e)
            ))

    successful = len(default_probs)
    avg_prob = float(np.mean(default_probs)) if default_probs else 0.0

    return RetrospectiveBatchResponse(
        status="ok",
        model=chosen_model,
        total_records=len(df_uploaded),
        successful_scores=successful,
        failed_records=len(df_uploaded) - successful,
        average_default_probability=round(avg_prob, 4),
        results=results,
        disclaimer=(
            "Batch retrospective scoring evaluates historical loans only. "
            "It is not prospective credit underwriting."
        )
    )
