"""
CrediFlux Application Entrypoint
Initializes models on startup, configures CORS, registers API routers,
and serves the integrated React UI when built.
"""

import time
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError

from crediflux.config import APP_NAME, APP_VERSION, CORS_ORIGINS, FRONTEND_DIST_DIR
from crediflux.services.model_loader import get_model_loader
from crediflux.routers import health, models, assess

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
# Register API Routers
# ---------------------------------------------------------------------------
app.include_router(health.router)
app.include_router(models.router)
app.include_router(assess.router)


# ---------------------------------------------------------------------------
# Serve Integrated Frontend (SPA) if dist directory exists
# ---------------------------------------------------------------------------
if FRONTEND_DIST_DIR.exists() and (FRONTEND_DIST_DIR / "index.html").exists():
    logger.info(f"Mounting built React UI from: {FRONTEND_DIST_DIR}")
    assets_dir = FRONTEND_DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        # Don't intercept API or Docs routes
        if full_path.startswith("api/") or full_path in ("docs", "redoc", "openapi.json"):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        file_path = FRONTEND_DIST_DIR / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(FRONTEND_DIST_DIR / "index.html"))
else:
    @app.get("/")
    async def root():
        return {
            "app": APP_NAME,
            "version": APP_VERSION,
            "status": "operational",
            "docs": "/docs",
            "endpoints": {
                "health": "/api/health",
                "models": "/api/models",
                "assess_prospective": "/api/assess",
                "assess_retrospective": "/api/assess/retrospective",
                "assess_batch": "/api/assess/retrospective/batch"
            }
        }
