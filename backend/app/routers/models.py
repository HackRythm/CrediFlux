"""
CrediFlux Model Catalog & Provenance Router
Endpoint: GET /api/models
"""

from fastapi import APIRouter
from backend.app.schemas import ModelsResponse
from backend.app.services.metrics import get_all_model_details

router = APIRouter(prefix="/api", tags=["Model Metadata"])


@router.get("/models", response_model=ModelsResponse)
def get_models() -> ModelsResponse:
    """
    Returns verified model metrics, hyperparameter provenance, evaluation methodology,
    and capability flags for prospective vs. retrospective assessment.
    """
    return get_all_model_details()
