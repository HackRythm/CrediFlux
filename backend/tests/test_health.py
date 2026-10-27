"""
Unit Tests for GET /api/health
Verifies system health status, loaded model list, and scikit-learn version match.
"""

def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "healthy"
    assert "Logistic Regression" in data["loaded_models"]
    assert "Random Forest" in data["loaded_models"]
    assert data["scikit_learn_match"] is True
    assert data["sklearn_version"] == "1.7.2"
    assert data["app_version"] == "1.0.0"
