"""
CrediFlux FastAPI Application Entrypoint
Initializes models on startup, configures CORS, sets up structured validation
error handling, and registers API routers.
"""

import time
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from backend.app.config import APP_NAME, APP_VERSION, CORS_ORIGINS
from backend.app.services.model_loader import get_model_loader
from backend.app.routers import health, models, assess

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("crediflux.api")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Startup & Shutdown Lifespan:
    Loads and validates all model artifacts once on server launch.
    """
    logger.info("Initializing CrediFlux API startup lifespan...")
    loader = get_model_loader()
    loader.load_artifacts()
    logger.info(f"Loaded models: {loader.get_loaded_model_names()}")
    yield
    logger.info("Shutting down CrediFlux API...")


app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="Credit Risk Assessment & Loan Default Prediction Intelligence Platform",
    lifespan=lifespan
)

# ---------------------------------------------------------------------------
# Middleware: CORS Configuration
# ---------------------------------------------------------------------------
logger.info(f"Configuring CORS origins: {CORS_ORIGINS}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Middleware: Request Logging & Latency Tracking
# ---------------------------------------------------------------------------
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start_time) * 1000
    logger.info(
        f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms:.2f}ms)"
    )
    return response


# ---------------------------------------------------------------------------
# Custom Exception Handler: Structured 422 Field-Level Messages
# ---------------------------------------------------------------------------
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        loc = err.get("loc", [])
        field_name = loc[-1] if loc else "body"
        msg = err.get("msg", "Invalid value")
        errors.append({
            "field": str(field_name),
            "message": msg,
            "type": err.get("type", "value_error")
        })

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "status": "error",
            "message": "Input validation failed. Please check field requirements and bounds.",
            "errors": errors
        }
    )


# ---------------------------------------------------------------------------
# Register Routers
# ---------------------------------------------------------------------------
app.include_router(health.router)
app.include_router(models.router)
app.include_router(assess.router)


@app.get("/", tags=["Root"])
def root():
    return {
        "app": APP_NAME,
        "version": APP_VERSION,
        "docs_url": "/docs",
        "health_url": "/api/health",
        "models_url": "/api/models"
    }
