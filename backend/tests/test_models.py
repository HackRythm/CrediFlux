"""
Unit Tests for GET /api/models
Verifies that the models endpoint returns metrics matching stored benchmarks exactly,
with full provenance and task distinction.
"""

def test_models_endpoint_structure(client):
    response = client.get("/api/models")
    assert response.status_code == 200

    data = response.json()
    assert "models" in data
    assert data["total_models"] >= 3
    assert data["feature_count"] == 35
    assert data["verdict"] == "NOT READY"

    models_by_name = {m["name"]: m for m in data["models"]}
    assert "Logistic Regression" in models_by_name
    assert "Random Forest" in models_by_name
    assert "Linear Regression Baseline" in models_by_name


def test_logistic_regression_metrics_match_stored_benchmark(client):
    response = client.get("/api/models")
    models_by_name = {m["name"]: m for m in response.json()["models"]}
    lr = models_by_name["Logistic Regression"]

    # Verify exact metrics from Phase 10 evaluation
    assert lr["metrics"]["accuracy"] == 0.6554
    assert lr["metrics"]["precision"] == 0.3139
    assert lr["metrics"]["recall"] == 0.6128
    assert lr["metrics"]["f1_score"] == 0.4152
    assert lr["metrics"]["roc_auc"] == 0.6963
    assert lr["metrics"]["pr_auc"] == 0.3568

    # Confusion matrix
    assert lr["confusion_matrix"]["tn"] == 3172
    assert lr["confusion_matrix"]["fp"] == 1591
    assert lr["confusion_matrix"]["fn"] == 460
    assert lr["confusion_matrix"]["tp"] == 728

    # Provenance
    assert "evaluate_final_models.py" in lr["provenance"]["source_file"]
    assert lr["provenance"]["threshold"] == 0.50
    assert lr["is_classifier"] is True
    assert lr["can_serve_assess"] is False


def test_random_forest_metrics_match_stored_benchmark(client):
    response = client.get("/api/models")
    models_by_name = {m["name"]: m for m in response.json()["models"]}
    rf = models_by_name["Random Forest"]

    assert rf["metrics"]["accuracy"] == 0.7701
    assert rf["metrics"]["precision"] == 0.3996
    assert rf["metrics"]["recall"] == 0.3013
    assert rf["metrics"]["f1_score"] == 0.3436
    assert rf["metrics"]["roc_auc"] == 0.6936
    assert rf["metrics"]["pr_auc"] == 0.3617

    assert rf["confusion_matrix"]["tn"] == 4225
    assert rf["confusion_matrix"]["fp"] == 538
    assert rf["confusion_matrix"]["fn"] == 830
    assert rf["confusion_matrix"]["tp"] == 358
    assert rf["is_classifier"] is True
    assert rf["can_serve_assess"] is False


def test_linear_regression_metrics_and_regressor_status(client):
    response = client.get("/api/models")
    models_by_name = {m["name"]: m for m in response.json()["models"]}
    linreg = models_by_name["Linear Regression Baseline"]

    assert linreg["task"] == "regression"
    assert linreg["is_classifier"] is False
    assert linreg["can_serve_assess"] is False

    # Valid regression metrics
    assert linreg["metrics"]["mae"] == 0.295204
    assert linreg["metrics"]["mse"] == 0.146893
    assert linreg["metrics"]["rmse"] == 0.383267
    assert linreg["metrics"]["r2"] == 0.080642

    # Thresholded classification metrics from Phase 2 benchmark
    assert linreg["metrics"]["accuracy"] == 0.799866
    assert linreg["metrics"]["precision"] == 0.470588
    assert linreg["metrics"]["recall"] == 0.020202
    assert linreg["metrics"]["f1_score"] == 0.038741
