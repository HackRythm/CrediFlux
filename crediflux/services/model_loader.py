"""
Model Loader Service for CrediFlux
Handles safe startup loading of serialized scikit-learn models using joblib,
enforces security constraints (repo-contained artifacts only), validates
scikit-learn runtime versions, and fails fast on missing artifacts.
"""

import os
import json
import logging
from typing import Dict, Any, Optional
from pathlib import Path
import joblib
import sklearn

from crediflux.config import (
    MODELS_DIR, REPO_ROOT, EXPECTED_SKLEARN_VERSION
)

logger = logging.getLogger("crediflux.model_loader")


class ModelArtifactNotFoundError(FileNotFoundError):
    """Raised when a required model artifact is absent from disk."""
    pass


class ModelSecurityError(SecurityError if "SecurityError" in dir(__builtins__) else PermissionError):
    """Raised when an artifact path attempts to resolve outside the allowed repository scope."""
    pass


class ModelLoader:
    _instance: Optional["ModelLoader"] = None

    def __init__(self, models_dir: Optional[Path] = None):
        self.models_dir = Path(models_dir or MODELS_DIR).resolve()
        self.models: Dict[str, Any] = {}
        self.schema: Dict[str, Any] = {}
        self.loaded = False
        self.sklearn_version = sklearn.__version__
        self.sklearn_version_match = True

    @classmethod
    def get_instance(cls, models_dir: Optional[Path] = None) -> "ModelLoader":
        if cls._instance is None:
            cls._instance = cls(models_dir=models_dir)
        return cls._instance

    def _validate_path_security(self, file_path: Path) -> Path:
        """
        Verify that the file path is within the trusted models_dir
        and that models_dir resides within REPO_ROOT (or an explicitly trusted directory).
        """
        resolved_path = file_path.resolve()
        
        # Security: joblib can execute arbitrary code on unpickling.
        # Ensure path exists and is an exact child of models_dir
        try:
            resolved_path.relative_to(self.models_dir)
        except ValueError:
            raise ModelSecurityError(
                f"Security violation: Artifact path '{resolved_path}' is outside trusted models directory '{self.models_dir}'."
            )
        return resolved_path

    def load_artifacts(self) -> None:
        """
        Loads all required model artifacts once at startup.
        Fails fast if any artifact is missing.
        """
        logger.info(f"Initializing ModelLoader from models directory: {self.models_dir}")

        if not self.models_dir.exists() or not self.models_dir.is_dir():
            raise ModelArtifactNotFoundError(
                f"Configured models directory does not exist: {self.models_dir}. "
                "Ensure serialized artifacts are in models/ or set CREDIFLUX_MODELS_DIR."
            )

        # 1. Load Feature Schema
        schema_path = self._validate_path_security(self.models_dir / "feature_schema.json")
        if not schema_path.exists():
            raise ModelArtifactNotFoundError(
                f"Required feature schema artifact missing: {schema_path}"
            )

        try:
            with open(schema_path, "r", encoding="utf-8") as f:
                self.schema = json.load(f)
            logger.info(f"Loaded feature schema: {self.schema.get('feature_count', 0)} features expected.")
        except Exception as e:
            raise RuntimeError(f"Failed to parse feature_schema.json at {schema_path}: {e}")

        # 2. Check scikit-learn version
        schema_env = self.schema.get("environment", {})
        schema_sklearn = schema_env.get("scikit_learn", EXPECTED_SKLEARN_VERSION)

        if self.sklearn_version != schema_sklearn:
            self.sklearn_version_match = False
            logger.warning(
                f"scikit-learn version mismatch detected! Runtime version is {self.sklearn_version}, "
                f"but models were serialized with {schema_sklearn}. "
                "Unpickling across different sklearn minor versions may yield unexpected numerical behavior."
            )
        else:
            self.sklearn_version_match = True
            logger.info(f"scikit-learn runtime version ({self.sklearn_version}) matches training environment.")

        # 3. Load Logistic Regression Pipeline
        lr_path = self._validate_path_security(self.models_dir / "logistic_regression_pipeline.joblib")
        if not lr_path.exists():
            raise ModelArtifactNotFoundError(
                f"Required Logistic Regression artifact missing: {lr_path}"
            )
        try:
            self.models["Logistic Regression"] = joblib.load(lr_path)
            logger.info(f"Loaded Logistic Regression Pipeline from {lr_path}")
        except Exception as e:
            raise RuntimeError(f"Failed to unpickle Logistic Regression from {lr_path}: {e}")

        # 4. Load Random Forest Classifier
        rf_path = self._validate_path_security(self.models_dir / "random_forest.joblib")
        if not rf_path.exists():
            raise ModelArtifactNotFoundError(
                f"Required Random Forest artifact missing: {rf_path}"
            )
        try:
            self.models["Random Forest"] = joblib.load(rf_path)
            logger.info(f"Loaded Random Forest Classifier from {rf_path}")
        except Exception as e:
            raise RuntimeError(f"Failed to unpickle Random Forest from {rf_path}: {e}")

        self.loaded = True
        logger.info("All model artifacts successfully verified and loaded into memory.")

    def get_model(self, model_name: str) -> Any:
        if not self.loaded:
            self.load_artifacts()
        if model_name not in self.models:
            raise KeyError(
                f"Model '{model_name}' not loaded. Available models: {list(self.models.keys())}"
            )
        return self.models[model_name]

    def get_loaded_model_names(self) -> list:
        return list(self.models.keys())


def get_model_loader() -> ModelLoader:
    return ModelLoader.get_instance()
