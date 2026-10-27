"""
Integration Tests for /api/assess and /api/assess/retrospective
Verifies:
1. /api/assess returns status: 'unavailable' with exact missing features
2. /api/assess/retrospective executes real model inference and returns matching probabilities
3. Retrospective scoring preserves identical output to calling model.predict_proba directly
4. Preprocessing equivalence against actual saved reference rows (X_test_processed.csv)
5. Missing-artifact failure behavior
6. CORS headers on responses
"""

import os
import pytest
import numpy as np
import pandas as pd


def test_assess_prospective_returns_unavailable(client, sample_prospective_applicant):
    """
    PER PHASE 0 AUDIT:
    Prospective applicant assessment must return status: 'unavailable'
    listing the exact missing lender-assigned fields without fabricating values.
    """
    response = client.post("/api/assess", json=sample_prospective_applicant)
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "unavailable"
    assert data["verdict"] == "NOT READY"
    assert "missing_features" in data

    # Verify exact required lender-assigned fields are flagged
    missing = data["missing_features"]
    assert "sub_grade" in missing
    assert "int_rate" in missing
    assert "installment" in missing
    assert "verification_status" in missing
    assert len(data["limitations"]) > 0


def test_retrospective_single_loan_scoring(client, sample_retrospective_record):
    """
    Retrospective scoring with complete historical origination features
    must execute real model inference and return probability and risk band.
    """
    # Test with Logistic Regression
    sample_retrospective_record["model_name"] = "Logistic Regression"
    response = client.post("/api/assess/retrospective", json=sample_retrospective_record)
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "ok"
    assert data["model"] == "Logistic Regression"
    assert 0.0 <= data["default_probability"] <= 1.0
    assert 0.0 <= data["repayment_probability"] <= 1.0
    assert np.isclose(data["default_probability"] + data["repayment_probability"], 1.0)
    assert data["risk_band"] in ["Low Risk", "Moderate Risk", "Elevated Risk", "High Risk", "Critical Risk"]
    assert "disclaimer" in data

    # Test with Random Forest
    sample_retrospective_record["model_name"] = "Random Forest"
    response_rf = client.post("/api/assess/retrospective", json=sample_retrospective_record)
    assert response_rf.status_code == 200
    data_rf = response_rf.json()
    assert data_rf["model"] == "Random Forest"
    assert 0.0 <= data_rf["default_probability"] <= 1.0


def test_retrospective_parity_with_direct_model_call(client, model_loader):
    """
    Verify that scoring through the API yields identical output to calling
    model.predict_proba directly on preprocessed rows from X_test_processed.csv.
    """
    # Load first 5 rows of actual test set
    x_test_df = pd.read_csv("data/X_test_processed.csv").iloc[:5]

    lr_pipeline = model_loader.get_model("Logistic Regression")
    rf_model = model_loader.get_model("Random Forest")

    direct_lr_probs = lr_pipeline.predict_proba(x_test_df)[:, 1]
    direct_rf_probs = rf_model.predict_proba(x_test_df)[:, 1]

    for idx, row in x_test_df.iterrows():
        # Call API using RetrospectiveRaw35FeaturesRecord schema
        payload_lr = {
            "model_name": "Logistic Regression",
            "features": row.to_dict()
        }
        res_lr = client.post("/api/assess/retrospective", json=payload_lr)
        assert res_lr.status_code == 200
        api_prob_lr = res_lr.json()["default_probability"]
        # API returns round(prob, 4), verify within 0.0001
        assert np.isclose(api_prob_lr, direct_lr_probs[idx], atol=1e-4)

        payload_rf = {
            "model_name": "Random Forest",
            "features": row.to_dict()
        }
        res_rf = client.post("/api/assess/retrospective", json=payload_rf)
        assert res_rf.status_code == 200
        api_prob_rf = res_rf.json()["default_probability"]
        assert np.isclose(api_prob_rf, direct_rf_probs[idx], atol=1e-4)


def test_cors_headers_present(client):
    """
    Verify that CORS headers are appropriately returned for allowed origins.
    """
    response = client.options(
        "/api/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET"
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_missing_model_artifacts_error_handling(monkeypatch):
    """
    Verify that if model artifacts path is invalid, loader fails fast with ModelArtifactNotFoundError.
    """
    from backend.app.services.model_loader import ModelLoader, ModelArtifactNotFoundError

    bad_loader = ModelLoader(models_dir="non_existent_models_dir_xyz")
    with pytest.raises(ModelArtifactNotFoundError):
        bad_loader.load_artifacts()
