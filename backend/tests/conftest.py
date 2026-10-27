"""
Pytest Fixtures for CrediFlux Backend Tests
"""

import os
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure project root is in sys.path
TEST_DIR = Path(__file__).resolve().parent
BACKEND_DIR = TEST_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.main import app
from backend.app.services.model_loader import get_model_loader


@pytest.fixture(scope="session")
def client():
    """Session-scoped FastAPI TestClient."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="session")
def model_loader():
    """Loaded model loader singleton."""
    loader = get_model_loader()
    if not loader.loaded:
        loader.load_artifacts()
    return loader


@pytest.fixture
def sample_prospective_applicant():
    """Valid prospective borrower input without lender-assigned fields."""
    return {
        "loan_amnt": 15000.0,
        "term": "36 months",
        "annual_inc": 75000.0,
        "fico_score": 710.0,
        "dti": 18.5,
        "revol_bal": 8500.0,
        "revol_util": 45.0,
        "open_acc": 9.0,
        "total_acc": 22.0,
        "delinq_2yrs": 0.0,
        "credit_history_years": 12.5,
        "emp_length": "5 years",
        "home_ownership": "MORTGAGE",
        "purpose": "debt_consolidation",
        "application_type": "Individual"
    }


@pytest.fixture
def sample_retrospective_record(sample_prospective_applicant):
    """Complete historical loan file containing lender-assigned fields."""
    record = sample_prospective_applicant.copy()
    record.update({
        "model_name": "Logistic Regression",
        "sub_grade": "B3",
        "int_rate": 11.99,
        "installment": 498.25,
        "verification_status": "Source Verified"
    })
    return record
