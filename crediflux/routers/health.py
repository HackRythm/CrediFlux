"""
CrediFlux Health Check Router
Endpoint: GET /api/health
"""

from fastapi import APIRouter
from crediflux.schemas import HealthResponse
from crediflux.services.model_loader import get_model_loader
from crediflux.config import APP_VERSION, EXPECTED_SKLEARN_VERSION

router = APIRouter(prefix="/api", tags=["System Health"])


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """
    Check system health, loaded models, runtime scikit-learn version,
    and application version.
    """
    loader = get_model_loader()
    return HealthResponse(
        status="healthy",
        loaded_models=loader.get_loaded_model_names(),
        sklearn_version=loader.sklearn_version,
        expected_sklearn_version=EXPECTED_SKLEARN_VERSION,
        scikit_learn_match=loader.sklearn_version_match,
        app_version=APP_VERSION,
        models_dir=str(loader.models_dir)
    )
