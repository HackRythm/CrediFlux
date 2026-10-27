"""
Integration tests for the crediflux package.
Verifies API endpoints, retrospective inference parity, and health checks.
"""

import pytest
from fastapi.testclient import TestClient
from crediflux.main import app


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_crediflux_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Logistic Regression" in data["loaded_models"]
    assert "Random Forest" in data["loaded_models"]
    assert data["scikit_learn_match"] is True


def test_crediflux_models(client):
    response = client.get("/api/models")
    assert response.status_code == 200
    data = response.json()
    assert data["total_models"] == 4
    assert data["feature_count"] == 35
    assert data["verdict"] == "NOT READY"

    model_names = [m["name"] for m in data["models"]]
    assert "Logistic Regression" in model_names
    assert "Random Forest" in model_names
    assert "Linear Regression Baseline" in model_names
    assert "XGBoost" in model_names


def test_crediflux_assess_prospective_unavailable(client):
    payload = {
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
        "credit_history_years": 8.5,
        "emp_length": "5 years",
        "home_ownership": "MORTGAGE",
        "purpose": "debt_consolidation",
        "application_type": "Individual"
    }
    response = client.post("/api/assess", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "unavailable"
    assert data["verdict"] == "NOT READY"
    assert "missing_features" in data
    assert "sub_grade" in data["missing_features"]
    assert len(data["limitations"]) > 0


def test_crediflux_retrospective_assessment(client):
    payload = {
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
        "credit_history_years": 8.5,
        "emp_length": "5 years",
        "home_ownership": "MORTGAGE",
        "purpose": "debt_consolidation",
        "application_type": "Individual",
        "sub_grade": "B3",
        "int_rate": 11.99,
        "installment": 498.25,
        "verification_status": "Source Verified"
    }
    response = client.post("/api/assess/retrospective", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["evaluation_type"] == "Retrospective Historical Scoring"
    assert 0.0 <= data["default_probability"] <= 1.0
    assert 0.0 <= data["repayment_probability"] <= 1.0
    assert data["predicted_label"] in ["Fully Paid", "Charged Off"]
    assert data["risk_band"] in ["Low Risk", "Moderate Risk", "Elevated Risk", "High Risk"]
    assert data["feature_contributions"] is not None
    assert len(data["feature_contributions"]) > 0
