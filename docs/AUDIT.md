# CrediFlux Repository Audit (Phase 0)

**Date**: October 2026  
**Auditor**: ML Engineering & Full-Stack Development Team  
**Scope**: Model Artifacts, Preprocessing Pipelines, Training Schemas, Metric Provenance, and Prospective Feature Compatibility  

---

## 1. Inventory of Model Artifacts

| Model Name | Artifact Path | Serialization Format | Model Class / Architecture | scikit-learn Version | Classifier? | Exists on Disk? |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **Logistic Regression Pipeline** | `models/logistic_regression_pipeline.joblib` | `joblib` (compress=3, 2,404 bytes) | `sklearn.pipeline.Pipeline` (`[('scaler', StandardScaler()), ('logreg', LogisticRegression(C=10, max_iter=1000, class_weight='balanced', solver='lbfgs', random_state=42))]`) | `1.7.2` | **Yes** (Binary: 0=Fully Paid, 1=Charged Off) | **Yes** |
| **Random Forest Classifier** | `models/random_forest.joblib` | `joblib` (compress=3, 24,815,994 bytes) | `sklearn.ensemble.RandomForestClassifier` (`n_estimators=300, max_depth=20, min_samples_leaf=5, max_features='sqrt', class_weight='balanced', random_state=42, n_jobs=-1`) | `1.7.2` | **Yes** (Binary: 0=Fully Paid, 1=Charged Off) | **Yes** |
| **Feature Schema Metadata** | `models/feature_schema.json` | `JSON` (2,844 bytes) | Schema and training metadata dictionary | `1.7.2` (logged in env block) | N/A (Metadata) | **Yes** |
| **Linear Regression Baseline** | *None* (Code only in `scripts/train_baseline.py`, `notebooks/02_linear_regression_baseline.ipynb`) | None (Discarded from memory after training) | `sklearn.linear_model.LinearRegression` (Linear Probability Model on 12 origination features) | Unserialized | **No** (Regressor, continuous $\hat{y} \in (-\infty, \infty)$) | **No** |
| **XGBoost Classifier** | *None* (Code only in `scripts/evaluate_final_models.py`, `notebooks/10_final_test_evaluation.ipynb`) | None (Discarded from memory after evaluation) | `xgboost.XGBClassifier` (`n_estimators=200, max_depth=3, learning_rate=0.05, subsample=0.8, colsample_bytree=0.8, scale_pos_weight=4.01, eval_metric='logloss', random_state=42`) | Unserialized | **Yes** (Binary classifier) | **No** |

### Key Findings on Model Artifacts:
1. Only **two serialized model artifacts** exist in `models/`:
   - `logistic_regression_pipeline.joblib`: Complete standalone pipeline containing fitted `StandardScaler` followed by tuned `LogisticRegression(C=10, class_weight='balanced')`.
   - `random_forest.joblib`: Tuned `RandomForestClassifier` fitted on the unscaled 35 features.
2. **Linear Regression** was developed solely as a benchmark Linear Probability Model in Phase 2; no `.joblib` or `.pkl` was serialized to disk. It is a regressor, not a classifier.
3. **XGBoost** was designated as the champion model in the Phase 10 notebook analysis, but was never serialized to disk in `models/`.

---

## 2. Preprocessing & Feature Engineering Pipeline

### Location of Logic
The preprocessing logic was originally developed across cells in `notebooks/04_feature_engineering.ipynb` (Cells 8, 10, 12, 14) and later extracted into an importable module at `app/ml/preprocessing.py` (and re-modularized cleanly under `backend/app/services/preprocessing.py`).

### Pipeline Components & Execution Flow
1. **Domain Feature Engineering**:
   - `fico_score`: Midpoint average `(fico_range_low + fico_range_high) / 2.0`.
   - `credit_history_years`: Elapsed credit maturity `(issue_d - earliest_cr_line).dt.days / 365.25`.
   - `installment_to_income`: Debt burden `(installment * 12.0) / (annual_inc + 1.0)`.
   - `loan_to_income`: Leverage ratio `loan_amnt / (annual_inc + 1.0)`.
   - `open_to_total_acc_ratio`: Active line ratio `open_acc / (total_acc + 1.0)`.
   - `revol_util_over_100`: Binary indicator `int(revol_util > 100.0)`.
   - `has_delinq_2yrs`: Binary indicator `int(delinq_2yrs > 0)`.

2. **Imputation & Outlier Capping (Learned Strictly on Training Set $X_{\text{train}}$)**:
   - `dti_median`: `17.63` (imputes missing DTI).
   - `revol_util_median`: `52.40%` (imputes missing revolving utilization).
   - `annual_inc_min`: `$3,000.00` (replaces reported `$0` income).
   - `dti_cap`: `100.0%` (caps extreme leverage).
   - `revol_util_cap`: `150.0%` (caps extreme card utilization).
   - `annual_inc_cap`: `550,396.00` (99.9th percentile cap).
   - `revol_bal_cap`: `277,728.27` (99.9th percentile cap).
   - `emp_length_median`: `6.0` years (imputes missing employment tenure).

3. **Logarithmic Transforms**:
   - `log_annual_inc`: $\ln(1 + \text{annual\_inc\_capped})$
   - `log_revol_bal`: $\ln(1 + \text{revol\_bal\_capped})$

4. **Categorical Encodings**:
   - `sub_grade_num`: Monotonic integer encoding (`A1: 0, A2: 1, ..., G5: 34`).
   - `term_60m`: Binary indicator (`36 months: 0, 60 months: 1`).
   - `is_joint_app`: Binary indicator (`Individual: 0, Joint App: 1`).
   - `emp_length_num` & `emp_length_missing`: Ordinal integer mapping (0 to 10) + binary missingness flag.
   - `home_ownership`: Consolidates `ANY`, `OTHER`, `NONE` into `OTHER`, then creates dummy indicators `home_RENT`, `home_OWN`, `home_OTHER` with `MORTGAGE` as the omitted reference baseline.
   - `verification_status`: Creates dummy indicators `ver_Source_Verified`, `ver_Verified` with `Not Verified` as the omitted reference baseline.
   - `purpose`: Top 7 purposes one-hot encoded (`purpose_debt_consolidation`, `purpose_credit_card`, `purpose_home_improvement`, `purpose_small_business`, `purpose_major_purchase`, `purpose_medical`, `purpose_car`), with all low-frequency categories merged into `purpose_other`.

5. **Scaling**:
   - Scaler: `StandardScaler` fitted on $X_{\text{train}}$ (embedded inside `logistic_regression_pipeline.joblib`).
   - Random Forest accepts unscaled features directly.

---

## 3. Input Feature Schema Expected by Saved Models

The serialized models strictly require a 2D matrix / DataFrame with **35 numeric features** in this exact order:

| Index | Feature Name | DataType | Valid / Training Range | Meaning & Notes |
| :---: | :--- | :--- | :--- | :--- |
| 0 | `loan_amnt` | Float | `[1000.0, 40000.0]` | Principal loan amount requested |
| 1 | `installment` | Float | `[25.16, 1714.54]` | Monthly committed installment payment |
| 2 | `int_rate` | Float | `[5.31, 30.99]` | Loan interest rate (percentage) |
| 3 | `dti` | Float | `[0.0, 100.0]` | Debt-to-income ratio (capped at 100%) |
| 4 | `fico_score` | Float | `[662.0, 847.5]` | Midpoint of FICO score range |
| 5 | `revol_util` | Float | `[0.0, 150.0]` | Revolving credit line utilization (capped at 150%) |
| 6 | `open_acc` | Float | `[1.0, 65.0]` | Number of open credit lines |
| 7 | `total_acc` | Float | `[2.0, 103.0]` | Total number of credit lines |
| 8 | `delinq_2yrs` | Float | `[0.0, 15.0]` | Number of 30+ day delinquencies in past 2 years |
| 9 | `log_annual_inc` | Float | `[6.91, 13.22]` | $\ln(1 + \text{annual\_inc\_capped})$ |
| 10 | `log_revol_bal` | Float | `[0.0, 12.53]` | $\ln(1 + \text{revol\_bal\_capped})$ |
| 11 | `credit_history_years` | Float | `[3.08, 56.67]` | Years from earliest credit line to origination |
| 12 | `installment_to_income`| Float | `[0.0006, 15470.28]`| $(installment \times 12) / (annual\_inc + 1.0)$ |
| 13 | `loan_to_income` | Float | `[0.0016, 40000.0]` | $loan\_amnt / (annual\_inc + 1.0)$ |
| 14 | `open_to_total_acc_ratio`| Float | `[0.0667, 0.9583]` | $open\_acc / (total\_acc + 1.0)$ |
| 15 | `revol_util_over_100` | Int | `{0, 1}` | Binary flag: revol_util > 100% |
| 16 | `has_delinq_2yrs` | Int | `{0, 1}` | Binary flag: delinq_2yrs > 0 |
| 17 | `sub_grade_num` | Int | `[0, 34]` | Monotonic integer: A1=0 ... G5=34 |
| 18 | `term_60m` | Int | `{0, 1}` | Binary flag: 1 if term is 60 months, 0 if 36 |
| 19 | `is_joint_app` | Int | `{0, 1}` | Binary flag: 1 if Joint App, 0 if Individual |
| 20 | `emp_length_num` | Float | `[0.0, 10.0]` | Employment length in years (nulls imputed to 6.0) |
| 21 | `emp_length_missing` | Int | `{0, 1}` | Binary flag: 1 if emp_length was missing |
| 22 | `home_RENT` | Int | `{0, 1}` | One-hot dummy: Home ownership is RENT |
| 23 | `home_OWN` | Int | `{0, 1}` | One-hot dummy: Home ownership is OWN |
| 24 | `home_OTHER` | Int | `{0, 1}` | One-hot dummy: Home ownership is OTHER/ANY/NONE |
| 25 | `ver_Source_Verified` | Int | `{0, 1}` | One-hot dummy: Income Source Verified |
| 26 | `ver_Verified` | Int | `{0, 1}` | One-hot dummy: Income Verified |
| 27 | `purpose_debt_consolidation` | Int | `{0, 1}` | One-hot dummy: Loan purpose |
| 28 | `purpose_credit_card` | Int | `{0, 1}` | One-hot dummy: Loan purpose |
| 29 | `purpose_home_improvement` | Int | `{0, 1}` | One-hot dummy: Loan purpose |
| 30 | `purpose_small_business` | Int | `{0, 1}` | One-hot dummy: Loan purpose |
| 31 | `purpose_major_purchase` | Int | `{0, 1}` | One-hot dummy: Loan purpose |
| 32 | `purpose_medical` | Int | `{0, 1}` | One-hot dummy: Loan purpose |
| 33 | `purpose_car` | Int | `{0, 1}` | One-hot dummy: Loan purpose |
| 34 | `purpose_other` | Int | `{0, 1}` | One-hot dummy: Other low-frequency loan purpose |

---

## 4. Provenance of Every Reported Metric

All reported metrics are reproduced from exact repository artifacts and logs:

### A. Linear Regression Baseline (Phase 2 Benchmark)
- **Source**: `scripts/train_baseline.py`, `notebooks/02_linear_regression_baseline.ipynb`, `notebooks/02_linear_regression_baseline.md`
- **Dataset Split**: 80/20 train/test split on resolved loans ($N_{\text{test}} = 5,951$)
- **Features Used**: 12 raw origination numerical features (`loan_amnt`, `annual_inc`, `int_rate`, `installment`, `dti`, `fico_range_low`, `fico_range_high`, `revol_bal`, `revol_util`, `open_acc`, `total_acc`, `delinq_2yrs`)
- **Threshold**: 0.50 (for classification categorization)
- **Resampling / Class Weights**: None (Standard Ordinary Least Squares)
- **Reported Regression Metrics**:
  - MAE: `0.295204`
  - MSE: `0.146893`
  - RMSE: `0.383267`
  - $R^2$: `0.080642`
- **Reported Classification Metrics (Threshold = 0.50)**:
  - Accuracy: `0.799866` (~80.0%)
  - Precision: `0.470588` (47.06%)
  - Recall: `0.020202` (2.02%)
  - F1-Score: `0.038741` (3.87%)
  - Confusion Matrix: TN = 4,736, FP = 27, FN = 1,164, TP = 24

### B. 5-Fold Stratified Cross-Validation (Phase 8)
- **Source**: `scripts/run_cross_validation.py`, `notebooks/08_cross_validation.ipynb`
- **Split**: 5-Fold Stratified CV strictly on `X_train_processed.csv` (23,803 samples, default rate 19.96%)
- **Models**:
  - Logistic Regression (Pipeline + StandardScaler, `C=1.0`, `class_weight='balanced'`): ROC-AUC = $0.7112 \pm 0.0076$
  - Random Forest (`n_estimators=300`, `class_weight='balanced'`): ROC-AUC = $0.7018 \pm 0.0068$
  - XGBoost (`n_estimators=300, max_depth=5, lr=0.1, scale_pos_weight=4.01`): ROC-AUC = $0.6923 \pm 0.0071$

### C. Hyperparameter Tuning (Phase 9)
- **Source**: `scripts/tune_models.py`, `notebooks/09_hyperparameter_tuning.ipynb`
- **Split**: 5-Fold Stratified CV on training data only
- **Selected Hyperparameters**:
  - Logistic Regression: `C=10` (CV ROC-AUC: `0.711226`)
  - Random Forest: `n_estimators=300, max_depth=20, min_samples_leaf=5, max_features='sqrt'` (CV ROC-AUC: `0.709734`)
  - XGBoost: `n_estimators=200, max_depth=3, learning_rate=0.05, subsample=0.8, colsample_bytree=0.8` (CV ROC-AUC: `0.711818`)

### D. Final Untouched Test Set Evaluation (Phase 10)
- **Source**: `scripts/evaluate_final_models.py`, `scripts/serialize_models.py`, `notebooks/10_final_test_evaluation.ipynb`, `README.md`
- **Split**: Untouched Test Set (`X_test_processed.csv`, `y_test.csv`, 5,951 samples: 4,763 Fully Paid, 1,188 Charged Off, Default Rate = 19.96%)
- **Threshold**: 0.50
- **Reported Test Metrics**:

| Model | Accuracy | Precision (0.50) | Recall (0.50) | F1-Score (0.50) | ROC-AUC | PR-AUC | Source File & Verified Provenance |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Logistic Regression** | `0.6554` | `0.3139` | `0.6128` | `0.4152` | `0.6963` | `0.3568` | `scripts/evaluate_final_models.py:98-105`, `README.md:100` |
| **Random Forest** | `0.7701` | `0.3996` | `0.3013` | `0.3436` | `0.6936` | `0.3617` | `scripts/evaluate_final_models.py:98-105`, `README.md:101` |
| **XGBoost** | `0.6459` | `0.3122` | `0.6431` | `0.4204` | `0.6990` | `0.3631` | `scripts/evaluate_final_models.py:98-105`, `README.md:102` *(Model not serialized on disk)* |

---

## 5. Feature-Compatibility Analysis & Target Leakage

In credit risk modeling, there is a fundamental distinction between features known **at the time of application** (prospective borrower features) and features assigned **during or after loan underwriting** (lender-assigned and post-origination features).

### Feature Categorization Matrix

| Feature | Category | Prospective Applicant Can Supply? | Reason / Endogeneity Risk |
| :--- | :--- | :---: | :--- |
| `loan_amnt` | Applicant-Supplied | **Yes** | Requested loan amount |
| `annual_inc` | Applicant-Supplied | **Yes** | Self-reported income |
| `term` | Applicant-Supplied | **Yes** | Requested term (36 or 60 months) |
| `home_ownership` | Applicant-Supplied | **Yes** | Rent, Own, Mortgage, Other |
| `purpose` | Applicant-Supplied | **Yes** | Stated loan reason |
| `application_type` | Applicant-Supplied | **Yes** | Individual vs. Joint |
| `emp_length` | Applicant-Supplied | **Yes** | Stated employment tenure |
| `fico_score` | Bureau Pull | **Yes** | Credit score pulled from bureau |
| `dti` | Bureau / Computed | **Yes** | Existing debt payments / income |
| `revol_bal` | Bureau Pull | **Yes** | Credit card balances |
| `revol_util` | Bureau Pull | **Yes** | Utilization percentage |
| `open_acc` | Bureau Pull | **Yes** | Open accounts count |
| `total_acc` | Bureau Pull | **Yes** | Total accounts count |
| `delinq_2yrs` | Bureau Pull | **Yes** | Past 2-year 30+ day delinquencies |
| `earliest_cr_line` | Bureau Pull | **Yes** | Used for credit history length |
| **`int_rate`** | **Lender-Assigned** | **NO** | Assigned by Lending Club underwriting based on proprietary risk pricing formula |
| **`installment`** | **Lender-Assigned** | **NO** | Monthly repayment calculated from `int_rate`, `loan_amnt`, and `term` |
| **`sub_grade_num`** | **Lender-Assigned** | **NO** | Proprietary internal risk grade (A1 to G5) determined by lender underwriting |
| **`installment_to_income`** | **Lender-Derived** | **NO** | Derived from `installment`, hence depends directly on `int_rate` |
| **`ver_Source_Verified` / `ver_Verified`** | **Lender / Post-App** | **NO** | Assigned post-application after documentation audit by lender staff |

### Target Leakage & Endogeneity Audit:
1. **Severe Endogeneity in `sub_grade`**: Lending Club assigns `sub_grade` using their own proprietary risk model. Feeding `sub_grade_num` back into a default prediction model creates circular reasoning: the machine learning model is largely predicting the lender's internal assessment rather than borrower creditworthiness from raw attributes.
2. **Endogeneity in `int_rate` and `installment`**: The interest rate is directly determined by the assigned `sub_grade`. Borrowers judged riskier are assigned higher interest rates and correspondingly higher installments.
3. **Absence at Application Intake**: A prospective applicant applying on a public portal does not possess an assigned `sub_grade`, `int_rate`, `installment`, or `verification_status`.
4. **Data Leakage Risk**: If an intake form were to default these fields to fixed medians (e.g., $12.74\%$ interest rate and grade B3), the model would produce distorted, artificial risk scores that have no statistical validity for prospective applicants.

---

## 6. Phase 0 Verdict & Architectural Consequence

### Verdict: **NOT READY (Prospective Underwriting Incompatible)**

#### Justification:
The existing trained and serialized model artifacts (`logistic_regression_pipeline.joblib`, `random_forest.joblib`) were fitted on a 35-feature schema that mandatorily includes lender-assigned underwriting outputs (`sub_grade_num`, `int_rate`, `installment`, `installment_to_income`, and `verification_status`). 
Because these features **cannot realistically or truthfully be supplied by a prospective applicant**, and imputing them with synthetic constants or sample medians violates statistical integrity and the hard rules of this project, the models **cannot be used for prospective applicant approval**.

#### Architectural Consequence for Application & API:
1. **`/api/assess` (Prospective Mode)**:
   - Returns `{ "status": "unavailable", "reason": "...", "missing_features": [...], "limitations": [...] }`.
   - Explicitly lists the missing underwriting features (`sub_grade`, `int_rate`, `installment`, `verification_status`).
   - Does NOT fabricate predictions or default lender-assigned fields.
2. **`/api/assess/retrospective` (Retrospective Mode)**:
   - Serves real model scoring on complete historical loan records matching the 35-feature training schema (via single-loan form or batch CSV upload).
   - Clearly labeled as **retrospective analysis of originated loans**, not prospective borrower underwriting.
3. **Model Insights & Disclaimers**:
   - Transparently discloses the presence of lender-assigned variables and circularity in the training pipeline.
   - Highlights that prospective deployment requires retraining models exclusively on applicant-available and credit-bureau features (subject to separate human approval).
