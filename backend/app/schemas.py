"""
CrediFlux Pydantic v2 Schemas
Defines request and response validation contracts with realistic domain bounds.
"""

from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field, model_validator


# ---------------------------------------------------------------------------
# Health Schemas
# ---------------------------------------------------------------------------
class HealthResponse(BaseModel):
    status: str = Field(..., example="healthy")
    loaded_models: List[str] = Field(..., example=["Logistic Regression", "Random Forest"])
    sklearn_version: str = Field(..., example="1.7.2")
    expected_sklearn_version: str = Field(..., example="1.7.2")
    scikit_learn_match: bool = Field(..., example=True)
    app_version: str = Field(..., example="1.0.0")
    models_dir: str = Field(..., example="/path/to/models")


# ---------------------------------------------------------------------------
# Model Metadata & Provenance Schemas
# ---------------------------------------------------------------------------
class ModelProvenance(BaseModel):
    source_file: str
    split: str
    threshold: float
    resampling_or_weights: str
    evaluation_phase: str


class ConfusionMatrixSchema(BaseModel):
    tn: int
    fp: int
    fn: int
    tp: int


class ModelDetailSchema(BaseModel):
    name: str
    type: str
    task: Literal["classification", "regression"]
    is_classifier: bool
    can_serve_assess: bool
    unavailability_reason: Optional[str] = None
    metrics: Dict[str, Optional[float]]
    confusion_matrix: Optional[ConfusionMatrixSchema] = None
    provenance: ModelProvenance
    description: str


class ModelsResponse(BaseModel):
    models: List[ModelDetailSchema]
    total_models: int
    feature_count: int
    verdict: str
    verdict_summary: str


# ---------------------------------------------------------------------------
# Prospective Assessment Schemas (Intake from prospective borrower)
# ---------------------------------------------------------------------------
class ProspectiveApplicantRequest(BaseModel):
    """
    Features an actual prospective borrower can supply at application time,
    plus credit report bureau fields.
    Does NOT contain lender-assigned underwriting fields.
    """
    loan_amnt: float = Field(
        ...,
        ge=500.0,
        le=100000.0,
        description="Requested loan amount in USD ($500 to $100,000)",
        example=15000.0
    )
    term: Literal["36 months", "60 months"] = Field(
        ...,
        description="Repayment term: '36 months' or '60 months'",
        example="36 months"
    )
    annual_inc: float = Field(
        ...,
        ge=0.0,
        le=10000000.0,
        description="Self-reported gross annual income in USD",
        example=75000.0
    )
    fico_score: float = Field(
        ...,
        ge=300.0,
        le=850.0,
        description="Credit bureau FICO score (standard range: 300 to 850)",
        example=710.0
    )
    dti: float = Field(
        ...,
        ge=0.0,
        le=150.0,
        description="Debt-to-income ratio percentage (e.g. 18.5 for 18.5%)",
        example=18.5
    )
    revol_bal: float = Field(
        default=0.0,
        ge=0.0,
        description="Total revolving credit balance in USD",
        example=8500.0
    )
    revol_util: float = Field(
        default=0.0,
        ge=0.0,
        le=200.0,
        description="Revolving line utilization percentage (0% to 200%)",
        example=45.0
    )
    open_acc: float = Field(
        ...,
        ge=0.0,
        le=150.0,
        description="Number of currently open credit lines",
        example=9.0
    )
    total_acc: float = Field(
        ...,
        ge=1.0,
        le=200.0,
        description="Total number of historical credit lines in credit file",
        example=22.0
    )
    delinq_2yrs: float = Field(
        default=0.0,
        ge=0.0,
        le=50.0,
        description="Number of 30+ days past-due delinquencies in past 2 years",
        example=0.0
    )
    credit_history_years: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Years since earliest recorded credit line",
        example=12.5
    )
    emp_length: Optional[str] = Field(
        default=None,
        description="Employment tenure: '< 1 year', '1 year', ..., '10+ years'",
        example="5 years"
    )
    home_ownership: Literal["RENT", "OWN", "MORTGAGE", "OTHER", "ANY", "NONE"] = Field(
        default="MORTGAGE",
        description="Home ownership status",
        example="MORTGAGE"
    )
    purpose: str = Field(
        default="debt_consolidation",
        description="Loan purpose category",
        example="debt_consolidation"
    )
    application_type: Literal["Individual", "Joint App", "Joint"] = Field(
        default="Individual",
        description="Application type",
        example="Individual"
    )

    @model_validator(mode="after")
    def validate_accounts_consistency(self):
        if self.open_acc > self.total_acc + 5:
            raise ValueError(
                f"Open accounts ({self.open_acc}) cannot substantially exceed total accounts ({self.total_acc})."
            )
        return self


class FeatureDriver(BaseModel):
    feature: str
    contribution: float
    direction: Literal["increases_risk", "decreases_risk"]
    description: str


class AssessResponseOk(BaseModel):
    status: Literal["ok"] = "ok"
    model: str
    default_probability: float
    repayment_probability: float
    predicted_class: int
    predicted_label: str
    risk_band: str
    band_rationale: str
    threshold_used: float = 0.50
    feature_contributions: Optional[List[FeatureDriver]] = None
    disclaimer: str


class AssessResponseUnavailable(BaseModel):
    status: Literal["unavailable"] = "unavailable"
    reason: str
    missing_features: List[str]
    limitations: List[str]
    verdict: str = "NOT READY"
    recommended_action: str


# ---------------------------------------------------------------------------
# Retrospective Scoring Schemas (Full-Schema Historical Loan Evaluation)
# ---------------------------------------------------------------------------
class RetrospectiveLoanRecord(BaseModel):
    """
    Complete historical loan record matching the training schema.
    Can be supplied as either full origination fields or pre-engineered 35 features.
    """
    model_name: Optional[Literal["Logistic Regression", "Random Forest"]] = "Logistic Regression"
    
    # Prospective features
    loan_amnt: float = Field(..., ge=500.0, le=100000.0, example=15000.0)
    term: Literal["36 months", "60 months"] = Field(..., example="36 months")
    annual_inc: float = Field(..., ge=0.0, example=75000.0)
    fico_score: float = Field(..., ge=300.0, le=850.0, example=710.0)
    dti: float = Field(..., ge=0.0, le=150.0, example=18.5)
    revol_bal: float = Field(default=0.0, ge=0.0, example=8500.0)
    revol_util: float = Field(default=0.0, ge=0.0, le=200.0, example=45.0)
    open_acc: float = Field(..., ge=0.0, example=9.0)
    total_acc: float = Field(..., ge=1.0, example=22.0)
    delinq_2yrs: float = Field(default=0.0, ge=0.0, example=0.0)
    credit_history_years: float = Field(..., ge=0.0, example=12.5)
    emp_length: Optional[str] = Field(default=None, example="5 years")
    home_ownership: Literal["RENT", "OWN", "MORTGAGE", "OTHER", "ANY", "NONE"] = Field(default="MORTGAGE", example="MORTGAGE")
    purpose: str = Field(default="debt_consolidation", example="debt_consolidation")
    application_type: Literal["Individual", "Joint App", "Joint"] = Field(default="Individual", example="Individual")
    
    # Lender-assigned underwriting fields (Mandatory for retrospective scoring)
    sub_grade: str = Field(..., example="B3", description="Assigned subgrade (A1 through G5)")
    int_rate: float = Field(..., ge=1.0, le=50.0, example=11.99, description="Assigned interest rate percentage")
    installment: float = Field(..., ge=5.0, le=5000.0, example=498.25, description="Monthly repayment installment in USD")
    verification_status: Literal["Not Verified", "Source Verified", "Verified"] = Field(
        default="Not Verified",
        example="Source Verified",
        description="Lender documentation verification status"
    )


class RetrospectiveRaw35FeaturesRecord(BaseModel):
    """
    Direct input of all 35 pre-engineered features in exact training order.
    """
    model_name: Optional[Literal["Logistic Regression", "Random Forest"]] = "Logistic Regression"
    features: Dict[str, float]


class RetrospectiveScoreResponse(BaseModel):
    status: Literal["ok"] = "ok"
    model: str
    default_probability: float
    repayment_probability: float
    predicted_class: int
    predicted_label: str
    risk_band: str
    band_rationale: str
    threshold_used: float = 0.50
    feature_contributions: Optional[List[FeatureDriver]] = None
    disclaimer: str
    evaluation_type: str = "Retrospective Historical Scoring"
    is_prospective_approval: bool = False


class RetrospectiveBatchItemResult(BaseModel):
    row_index: int
    status: str
    error: Optional[str] = None
    default_probability: Optional[float] = None
    predicted_class: Optional[int] = None
    predicted_label: Optional[str] = None
    risk_band: Optional[str] = None


class RetrospectiveBatchResponse(BaseModel):
    status: Literal["ok"] = "ok"
    model: str
    total_records: int
    successful_scores: int
    failed_records: int
    average_default_probability: float
    results: List[RetrospectiveBatchItemResult]
    disclaimer: str
