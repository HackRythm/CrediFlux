# <p align="center"><img src="assets/crediflux_logo.svg" alt="CrediFlux Logo" width="220"/><br>CrediFlux — Credit Default Risk Prediction</p>

[![Python Version](https://img.shields.io/badge/python-3.13%2B-blue.svg)](https://www.python.org/)
[![Jupyter Notebook](https://img.shields.io/badge/Jupyter-Notebook-orange.svg)](https://jupyter.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**CrediFlux** is an end-to-end Machine Learning credit risk pipeline developed to predict whether a borrower will default on a loan. Using historical peer-to-peer lending data from Lending Club, CrediFlux automates risk evaluation, evaluates borrower creditworthiness, and provides interpretable risk scores for financial decision-making.

---

## 📌 Problem Statement

In consumer credit and peer-to-peer lending, accurate credit risk assessment is fundamental to financial stability. CrediFlux formulates credit default prediction as a binary classification task on resolved loans:

* **`0 = Fully Paid`** (Non-default: borrower successfully repaid loan principal and interest)
* **`1 = Charged Off`** (Default: borrower defaulted, resulting in financial loss)

### Why Credit-Default Prediction Matters
Failing to detect a loan default prior to origination leads to severe financial principal loss. A robust machine learning classifier allows lenders to:
1. **Minimize Credit Loss**: Identify high-risk applicants before disbursing funds.
2. **Optimize Risk-Based Pricing**: Adjust interest rates dynamically based on predicted default probability.
3. **Automate Underwriting**: Accelerate loan approval workflows with consistent, data-driven decisions.

---

## 📊 Dataset & Stratified Sampling

### Dataset Overview
* **Source Dataset**: Lending Club Accepted Loan Data (2007–2018Q4)
* **Original Size**: 2,260,701 rows × 151 columns (~1.67 GB)
* **Working Sample**: 50,000-row reproducible stratified sample (`random_state = 42`)
* **Resolved Modeling Subset**: 29,754 loans (unresolved active loans like `Current`, `Late`, and `In Grace Period` were excluded from default target modeling)

### Target Distribution (`loan_status`)
The 50,000-row sample maintains the exact target distribution of the full 2.26M dataset across all loan statuses:

| Category | Original Count | Original % | Sample Count | Sample % | Modeling Use |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Fully Paid** | 1,076,751 | 47.629% | 23,814 | 47.628% | Included (`y = 0`) |
| **Current** | 878,317 | 38.852% | 19,426 | 38.852% | Excluded (Unresolved) |
| **Charged Off** | 268,559 | 11.879% | 5,940 | 11.880% | Included (`y = 1`) |
| **Late (31–120 days)** | 21,467 | 0.950% | 475 | 0.950% | Excluded (Unresolved) |
| **In Grace Period** | 8,436 | 0.373% | 186 | 0.372% | Excluded (Unresolved) |
| **Late (16–30 days)** | 4,349 | 0.192% | 96 | 0.192% | Excluded (Unresolved) |
| **Other / Default** | 2,822 | 0.125% | 63 | 0.126% | Excluded (Unresolved) |

The resolved modeling dataset consists of **29,754 loans**: **23,814 Fully Paid (80.04%)** and **5,940 Charged Off (19.96%)**.

---

## 🛠️ Project Pipeline

The project covers 10 end-to-end execution phases:

- [x] **Phase 1: Stratified Sampling & Verification** — Extracted a representative 50,000-row sample with random seed 42 and verified target distributions.
- [x] **Phase 2: Simple Linear Regression Baseline** — Established a benchmark Linear Probability Model on origination features.
- [x] **Phase 3: Exploratory Data Analysis (EDA)** — Conducted deep bivariate and multivariate risk analysis on 29,754 resolved loans.
- [x] **Phase 4: Data Preprocessing & Feature Engineering** — Built a strictly leakage-free transformation pipeline producing **35 modeling features**.
- [x] **Phase 5: XGBoost Classifier** — Developed initial gradient-boosted decision tree baseline.
- [x] **Phase 6: Random Forest Classifier** — Built non-linear bagging ensemble classifier.
- [x] **Phase 7: Logistic Regression Classifier** — Built classical interpretable linear classifier with scaled pipeline.
- [x] **Phase 8: 5-Fold Stratified Cross-Validation** — Evaluated out-of-fold performance stability across all three algorithms.
- [x] **Phase 9: Basic Hyperparameter Tuning** — Executed grid search using 5-fold CV on training data only to select optimal parameters.
- [x] **Phase 10: Final Test Evaluation** — Evaluated final tuned models on the untouched test set at standard threshold = 0.50.

---

## ⚙️ Feature Engineering (35 Features)

Feature engineering transformed raw origination features into a strictly numeric, leakage-free modeling matrix containing **35 final features**:

1. **Domain-Engineered Ratios**:
   - `fico_score`: Midpoint of FICO range `(fico_range_low + fico_range_high) / 2`.
   - `credit_history_years`: Elapsed credit history maturity from `earliest_cr_line` to loan origination.
   - `installment_to_income`: Annualized debt service burden `(installment * 12) / (annual_inc + 1.0)`.
   - `loan_to_income`: Total borrowing ratio relative to annual income.
   - `open_to_total_acc_ratio`: Active revolving credit lines ratio.
   - `revol_util_over_100`: Binary indicator for over-limit credit utilization.
   - `has_delinq_2yrs`: Binary indicator for past 2-year delinquency history.

2. **Categorical Encodings**:
   - `sub_grade_num`: Monotonic integer mapping (`A1: 0` to `G5: 34`), preserving sub-grade risk hierarchy.
   - `term_60m`: Binary indicator (`36m: 0`, `60m: 1`).
   - `is_joint_app`: Binary indicator (`Individual: 0`, `Joint: 1`).
   - `emp_length_num` & `emp_length_missing`: Ordinal tenure mapping + missingness flag.
   - **One-Hot Encoded Features**: Categorical variables such as loan `purpose`, `home_ownership`, and `verification_status` were encoded into multiple one-hot dummy features (e.g., `home_ownership_RENT`, `home_ownership_OWN`, `verification_status_Verified`, `purpose_credit_card`, `purpose_debt_consolidation`, etc.).

3. **Log Transformations & Outlier Capping**:
   - Log-transformed highly skewed monetary variables: `log_annual_inc` and `log_revol_bal`.
   - Capped extreme outliers (`dti` at 100%, `revol_util` at 150%, annual income at 99.9th percentile).

---

## 📈 Model Comparison Table (Untouched Test Set)

The three final tuned models were trained on the complete training set ($23,803$ samples) and evaluated on the untouched test set ($5,951$ samples) at standard threshold = **0.50**:

| Model | Accuracy | Precision (0.50) | Recall (0.50) | F1-Score (0.50) | ROC-AUC | PR-AUC |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| **Logistic Regression** | 0.6554 | 0.3139 | 0.6128 | 0.4152 | 0.6963 | 0.3568 |
| **Random Forest** | 0.7701 | 0.3996 | 0.3013 | 0.3436 | 0.6936 | 0.3617 |
| **XGBoost** | **0.6459** | **0.3122** | **0.6431** | **0.4204** | **0.6990** | **0.3631** |

---

## 🏆 Final Model Selection

### Selected Champion Model: **XGBoost Classifier**

XGBoost was selected as the final model because it achieved the highest ROC-AUC, PR-AUC, recall, and F1-score on the untouched test set.

* **ROC-AUC**: **`0.6990`** (Best overall discrimination across thresholds)
* **PR-AUC**: **`0.3631`** (Best precision-recall trade-off under ~20% default imbalance)
* **Recall (0.50)**: **`64.31%`** (Captures ~64.3% of true defaults)
* **F1-Score (0.50)**: **`0.4204`** (Optimal balance between precision and recall)

### Financial & Business Rationale
While Random Forest achieved higher overall accuracy (0.7701) and precision (0.3996), it suffered from low recall (30.13%), missing almost 70% of actual default cases. In credit default prediction, recall is particularly relevant because failing to identify a true default (False Negative) represents a potentially costly credit-risk error resulting in direct loss of principal capital. XGBoost's balanced sensitivity (`scale_pos_weight` ~ 4.01) ensures maximum default detection and risk protection.

---

## 🔬 Model Development & Validation

| Model | Purpose | Key Parameters |
| :--- | :--- | :--- |
| **Logistic Regression** | Interpretable linear baseline | `C=10`, `class_weight='balanced'`, `StandardScaler()` in CV pipeline |
| **Random Forest** | Nonlinear bagging ensemble | `n_estimators=300`, `max_depth=20`, `min_samples_leaf=5`, `class_weight='balanced'` |
| **XGBoost** | Gradient-boosting final model | `n_estimators=200`, `max_depth=3`, `learning_rate=0.05`, `scale_pos_weight=4.01` |

### Validation Methodology
1. **5-Fold Stratified Cross-Validation**: Performed using training data only (`X_train_processed.csv`, `y_train.csv`, 23,803 samples) to assess model stability.
2. **Hyperparameter Tuning**: Tuned hyperparameters using 5-fold Stratified CV with ROC-AUC as the optimization metric.
3. **Untouched Test Set Evaluation**: The 5,951-sample test set (`X_test_processed.csv`, `y_test.csv`) was kept strictly untouched during model selection and tuning, and was accessed **ONLY** for final evaluation in Phase 10.

---

## 🛡️ Data Leakage Audit & Controls

To guarantee production-grade integrity, strict data leakage controls were implemented:
* **Target Leakage Audit**: Excluded post-origination features (e.g., total payments, principal received, recovery fees, late fee receipts, loan status updates).
* **Train-Only Parameter Fitting**: Imputation medians, capping thresholds, and log transformations were learned **exclusively on `X_train`** and applied to `X_test`.
* **Pipeline Scaling**: Feature scaling (`StandardScaler`) for Logistic Regression was embedded inside a `Pipeline` object so scaling statistics were computed strictly within each cross-validation fold.
* **Untouched Test Discipline**: Test data was never accessed during hyperparameter grid search or threshold analysis.

---

## 📂 Project Structure

```text
CrediFlux/
├── assets/
│   ├── crediflux_logo.svg                  # Project branding logo
│   ├── baseline_diagnostic_plots.png       # Baseline linear regression plots
│   ├── final_logreg_confusion_matrix.png   # Final test confusion matrix — Logistic Regression
│   ├── final_rf_confusion_matrix.png       # Final test confusion matrix — Random Forest
│   ├── final_xgb_confusion_matrix.png      # Final test confusion matrix — XGBoost
│   ├── final_model_comparison.png          # Final test ROC-AUC & PR-AUC comparison figure
│   ├── cv_roc_auc_comparison.png           # 5-fold cross-validation comparison plot
│   └── hyperparameter_tuning_comparison.png# Baseline vs tuned CV ROC-AUC plot
│
├── data/
│   ├── crediflux_50k.csv                   # Reproducible 50,000-row sample
│   ├── X_train_processed.csv               # Processed training features (23,803 × 35)
│   ├── X_test_processed.csv                # Processed test features (5,951 × 35)
│   ├── y_train.csv                         # Training targets (23,803)
│   └── y_test.csv                          # Test targets (5,951)
│
├── notebooks/
│   ├── 01_create_50k_dataset.ipynb         # Dataset sampling and verification
│   ├── 02_linear_regression_baseline.ipynb # Simple Linear Regression baseline
│   ├── 03_deeper_eda.ipynb                 # Comprehensive Exploratory Data Analysis
│   ├── 04_feature_engineering.ipynb        # Preprocessing & 35-feature engineering pipeline
│   ├── 05_xgboost_model.ipynb              # Baseline XGBoost classifier
│   ├── 06_random_forest_model.ipynb        # Random Forest classifier
│   ├── 07_logistic_regression_model.ipynb  # Logistic Regression classifier
│   ├── 08_cross_validation.ipynb           # 5-fold Stratified Cross-Validation
│   ├── 09_hyperparameter_tuning.ipynb      # Hyperparameter tuning
│   └── 10_final_test_evaluation.ipynb      # Final untouched test set evaluation
│
├── scripts/
│   ├── evaluate_final_models.py            # Standalone final test evaluation script
│   ├── run_cross_validation.py             # 5-fold CV evaluation script
│   ├── train_baseline.py                   # Baseline training script
│   ├── train_logistic_regression.py        # Logistic Regression training script
│   ├── train_random_forest.py              # Random Forest training script
│   └── tune_models.py                      # Hyperparameter grid search script
│
├── tests/
│   └── test_pipeline.py                    # Unit tests for dataset integrity and pipeline
│
├── .gitignore                              # Git exclusions (data, environments, caches)
├── README.md                               # Project documentation
└── requirements.txt                        # Python dependencies
```

---

## 🚀 Getting Started

### 1. Installation
Clone the repository and install the required dependencies:

```bash
git clone https://github.com/HackRythm/CrediFlux.git
cd CrediFlux
pip install -r requirements.txt
```

### 2. Running Final Evaluation
Execute the final test evaluation script to train models and generate asset visualisations:

```bash
python scripts/evaluate_final_models.py
```

### 3. Running Unit Tests
Validate dataset integrity and pipeline sanity checks:

```bash
pytest
```
All unit tests should pass cleanly.
