"""
CrediFlux Metrics Service
Provides verified evaluation metrics, test set performance, confusion matrices,
and data provenance directly from stored repository artifacts.
"""

from typing import List, Dict, Any
from crediflux.config import VERIFIED_METRICS, FEATURE_NAMES
from crediflux.schemas import (
    ModelsResponse, ModelDetailSchema, ModelProvenance, ConfusionMatrixSchema
)


def get_all_model_details() -> ModelsResponse:
    """
    Returns structured verified model metrics and provenance.
    Never fabricates metrics; serves directly from verified benchmarks.
    """
    model_details: List[ModelDetailSchema] = []

    for key, data in VERIFIED_METRICS.items():
        cm = None
        if data.get("confusion_matrix"):
            cm = ConfusionMatrixSchema(
                tn=data["confusion_matrix"]["tn"],
                fp=data["confusion_matrix"]["fp"],
                fn=data["confusion_matrix"]["fn"],
                tp=data["confusion_matrix"]["tp"]
            )

        prov = ModelProvenance(
            source_file=data["provenance"]["source_file"],
            split=data["provenance"]["split"],
            threshold=data["provenance"]["threshold"],
            resampling_or_weights=data["provenance"]["resampling_or_weights"],
            evaluation_phase=data["provenance"]["evaluation_phase"]
        )

        model_details.append(
            ModelDetailSchema(
                name=data["name"],
                type=data["type"],
                task=data["task"],
                is_classifier=data["is_classifier"],
                can_serve_assess=data["can_serve_assess"],
                unavailability_reason=data.get("unavailability_reason"),
                metrics=data["metrics"],
                confusion_matrix=cm,
                provenance=prov,
                description=data["description"]
            )
        )

    return ModelsResponse(
        models=model_details,
        total_models=len(model_details),
        feature_count=len(FEATURE_NAMES),
        verdict="NOT READY",
        verdict_summary=(
            "Models were trained with lender-assigned underwriting variables (sub_grade, int_rate, installment, verification_status). "
            "Because prospective applicants cannot supply these fields and synthetic imputation violates statistical integrity, "
            "prospective assessment (/api/assess) is unavailable. Retrospective scoring on complete historical records is fully operational."
        )
    )
