export interface HealthResponse {
  status: string;
  loaded_models: string[];
  sklearn_version: string;
  expected_sklearn_version: string;
  scikit_learn_match: boolean;
  app_version: string;
  models_dir: string;
}

export interface ConfusionMatrix {
  tn: number;
  fp: number;
  fn: number;
  tp: number;
}

export interface ModelProvenance {
  source_file: string;
  split: string;
  threshold: number;
  resampling_or_weights: string;
  evaluation_phase: string;
}

export interface ModelDetail {
  name: string;
  type: string;
  task: 'classification' | 'regression';
  is_classifier: boolean;
  can_serve_assess: boolean;
  unavailability_reason?: string | null;
  metrics: {
    accuracy?: number | null;
    precision?: number | null;
    recall?: number | null;
    f1?: number | null;
    roc_auc?: number | null;
    pr_auc?: number | null;
    rmse?: number | null;
    mae?: number | null;
    r2?: number | null;
  };
  confusion_matrix?: ConfusionMatrix | null;
  provenance: ModelProvenance;
  description: string;
}

export interface ModelsResponse {
  models: ModelDetail[];
  total_models: number;
  feature_count: number;
  verdict: string;
  verdict_summary: string;
}

export interface ProspectiveApplicantRequest {
  loan_amnt: number;
  term: '36 months' | '60 months';
  annual_inc: number;
  fico_score: number;
  dti: number;
  revol_bal: number;
  revol_util: number;
  open_acc: number;
  total_acc: number;
  delinq_2yrs: number;
  credit_history_years: number;
  emp_length?: string | null;
  home_ownership: 'RENT' | 'OWN' | 'MORTGAGE' | 'OTHER' | 'ANY' | 'NONE';
  purpose: string;
  application_type: 'Individual' | 'Joint App' | 'Joint';
}

export interface FeatureDriver {
  feature: string;
  contribution: number;
  direction: 'increases_risk' | 'decreases_risk';
  description: string;
}

export interface AssessResponseUnavailable {
  status: 'unavailable';
  reason: string;
  missing_features: string[];
  limitations: string[];
  verdict: string;
  recommended_action: string;
}

export interface RetrospectiveLoanRecord {
  model_name?: 'Logistic Regression' | 'Random Forest';
  loan_amnt: number;
  term: '36 months' | '60 months';
  annual_inc: number;
  fico_score: number;
  dti: number;
  revol_bal: number;
  revol_util: number;
  open_acc: number;
  total_acc: number;
  delinq_2yrs: number;
  credit_history_years: number;
  emp_length?: string | null;
  home_ownership: 'RENT' | 'OWN' | 'MORTGAGE' | 'OTHER' | 'ANY' | 'NONE';
  purpose: string;
  application_type: 'Individual' | 'Joint App' | 'Joint';
  sub_grade: string;
  int_rate: number;
  installment: number;
  verification_status: 'Not Verified' | 'Source Verified' | 'Verified';
}

export interface RetrospectiveScoreResponse {
  status: 'ok';
  model: string;
  default_probability: number;
  repayment_probability: number;
  predicted_class: number;
  predicted_label: string;
  risk_band: string;
  band_rationale: string;
  threshold_used: number;
  feature_contributions?: FeatureDriver[] | null;
  disclaimer: string;
  evaluation_type: string;
  is_prospective_approval: boolean;
}

export interface RetrospectiveBatchItemResult {
  row_index: number;
  status: string;
  error?: string | null;
  default_probability?: number | null;
  predicted_class?: number | null;
  predicted_label?: string | null;
  risk_band?: string | null;
}

export interface RetrospectiveBatchResponse {
  status: 'ok';
  model: string;
  total_records: number;
  successful_scores: number;
  failed_records: number;
  average_default_probability: number;
  results: RetrospectiveBatchItemResult[];
  disclaimer: string;
}

export interface UserProfile {
  name: string;
  title: string;
  organization: string;
  role: 'Model Risk Auditor' | 'Credit Underwriter' | 'ML Engineer';
  riskTolerance: 'Conservative' | 'Moderate' | 'Aggressive';
}
