"""
Unit Tests for Pydantic Schema Validation Boundaries
Verifies that invalid applicant values are rejected with structured 422 field errors.
"""

def test_validation_rejects_fico_out_of_bounds(client, sample_prospective_applicant):
    # FICO > 850
    bad_payload = sample_prospective_applicant.copy()
    bad_payload["fico_score"] = 920.0
    response = client.post("/api/assess", json=bad_payload)
    assert response.status_code == 422
    data = response.json()
    assert data["status"] == "error"
    assert any(err["field"] == "fico_score" for err in data["errors"])

    # FICO < 300
    bad_payload["fico_score"] = 250.0
    response = client.post("/api/assess", json=bad_payload)
    assert response.status_code == 422


def test_validation_rejects_negative_income(client, sample_prospective_applicant):
    bad_payload = sample_prospective_applicant.copy()
    bad_payload["annual_inc"] = -1000.0
    response = client.post("/api/assess", json=bad_payload)
    assert response.status_code == 422
    data = response.json()
    assert any(err["field"] == "annual_inc" for err in data["errors"])


def test_validation_rejects_negative_dti(client, sample_prospective_applicant):
    bad_payload = sample_prospective_applicant.copy()
    bad_payload["dti"] = -5.0
    response = client.post("/api/assess", json=bad_payload)
    assert response.status_code == 422
    data = response.json()
    assert any(err["field"] == "dti" for err in data["errors"])


def test_validation_rejects_open_acc_exceeding_total_acc(client, sample_prospective_applicant):
    bad_payload = sample_prospective_applicant.copy()
    bad_payload["open_acc"] = 25.0
    bad_payload["total_acc"] = 10.0
    response = client.post("/api/assess", json=bad_payload)
    assert response.status_code == 422


def test_validation_rejects_invalid_loan_amount(client, sample_prospective_applicant):
    # Loan amount too low (< $500)
    bad_payload = sample_prospective_applicant.copy()
    bad_payload["loan_amnt"] = 100.0
    response = client.post("/api/assess", json=bad_payload)
    assert response.status_code == 422

    # Loan amount too high (> $100,000)
    bad_payload["loan_amnt"] = 250000.0
    response = client.post("/api/assess", json=bad_payload)
    assert response.status_code == 422


def test_validation_rejects_invalid_term(client, sample_prospective_applicant):
    bad_payload = sample_prospective_applicant.copy()
    bad_payload["term"] = "24 months"
    response = client.post("/api/assess", json=bad_payload)
    assert response.status_code == 422
