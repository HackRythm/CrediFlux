# Notebook 04: Leakage-Free Feature Engineering for XGBoost

This document explains the purpose, workflow, and results of the Jupyter notebook:

[`04_feature_engineering.ipynb`](file:///d:/SEM_3/23AID205-%20AI%20&%20ML/CrediFlux/notebooks/04_feature_engineering.ipynb)

---

## 🎯 Objective
Transform the raw, resolved-loan dataset (`29,754` records) into a clean, highly predictive, and strictly leakage-free feature matrix tailored for gradient boosted decision trees (**XGBoost**) and ensemble classifiers.

---

## ⚙️ Methodology & Sections

### 1. Data Ingestion & Target Definition
- Loads `data/crediflux_50k.csv` and isolates resolved loans (`Fully Paid` $\rightarrow$ 0, `Charged Off` $\rightarrow$ 1).
- Total records: `29,754` loans (23,814 non-defaults, 5,940 defaults, 19.96% default rate).

### 2. Leakage-Free Train-Test Splitting
- **Stratified Split (80/20):** `train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)`.
- **Training Set:** 23,803 records (19,051 non-defaults, 4,752 defaults).
- **Test Set:** 5,951 records (4,763 non-defaults, 1,188 defaults).
- All statistics (medians, capping thresholds, encoding maps) are learned **exclusively on `X_train`**.

### 3. Domain-Driven Feature Engineering
1. **`fico_score`:** Midpoint of FICO score range `(fico_range_low + fico_range_high) / 2`. Eliminates $r = 0.9999999$ redundancy.
2. **`credit_history_years`:** Time difference in years from `earliest_cr_line` to `issue_d`, capturing credit maturity.
3. **`installment_to_income`:** Annualized debt service burden `(installment * 12) / (annual_inc + 1.0)`.
4. **`loan_to_income`:** Total borrowing leverage relative to income `loan_amnt / (annual_inc + 1.0)`.
5. **`open_to_total_acc_ratio`:** Active credit line ratio `open_acc / (total_acc + 1.0)`.
6. **`revol_util_over_100`:** Binary flag indicating over-limit credit card utilization.
7. **`has_delinq_2yrs`:** Binary flag for past 2-year delinquency history (mitigates 82.3% zero-inflation).

### 4. Skewness Treatment, Capping & Imputation (Fitted on Train Only)
- **Zero Income:** $0 reported incomes replaced with learned minimum positive income ($3,000).
- **Outlier Capping:** `dti` capped at 100%, `revol_util` capped at 150%, `annual_inc` and `revol_bal` capped at 99.9th percentiles.
- **Log Transformations:** `log_annual_inc = log1p(annual_inc)` and `log_revol_bal = log1p(revol_bal)`.
- **Missing Value Imputation:** Numerical nulls imputed with `X_train` medians.

### 5. Categorical Encoding Pipeline
- **`sub_grade_num`:** Monotonic ordinal integer encoding (`A1: 0, A2: 1, ..., G5: 34`), preserving the steep default probability curve.
- **`term_60m`:** Binary encoding (`36 months: 0, 60 months: 1`).
- **`is_joint_app`:** Binary encoding (`Individual: 0, Joint App: 1`).
- **`emp_length_num` & `emp_length_missing`:** Ordinal integer mapping with missing tenure imputed using training median (6.0 years) plus missingness indicator.
- **`home_ownership`:** Rare categories (`ANY`, `OTHER`, `NONE`) merged into `'OTHER'`, then one-hot encoded (MORTGAGE reference).
- **`purpose`:** Low-frequency purposes merged into `'other'`, then top 7 purposes one-hot encoded.
- **`verification_status`:** One-hot encoded.

---

## 📊 Before vs. After Feature Summary

| Stage | Feature Count | Description |
| :--- | :---: | :--- |
| **1. Raw Origination Columns** | 22 | 12 numerical + 8 categorical + 2 date columns |
| **2. Engineered Domain Features** | +7 | `fico_score`, `credit_history_years`, `installment_to_income`, `loan_to_income`, `open_to_total_acc_ratio`, `revol_util_over_100`, `has_delinq_2yrs` |
| **3. Log Transforms** | +2 | `log_annual_inc`, `log_revol_bal` |
| **4. Categorical Encodings** | +16 | `sub_grade_num`, `term_60m`, `is_joint_app`, `emp_length_num`, `emp_length_missing`, 3 home dummies, 2 ver dummies, 8 purpose dummies |
| **5. Excluded / Redundant** | -18 | `fico_range_low`, `fico_range_high`, `grade`, `issue_d`, `earliest_cr_line`, raw skewed columns, raw text categoricals |
| **Final Modeling Matrix** | **29** | **Strictly numeric, clean, leakage-free feature matrix** |

---

## 📁 Exported Modeling-Ready Artifacts

The final processed splits are saved in `data/` for direct consumption:
- [`data/X_train_processed.csv`](file:///d:/SEM_3/23AID205-%20AI%20&%20ML/CrediFlux/data/X_train_processed.csv) (`23,803` rows $\times$ `29` columns)
- [`data/X_test_processed.csv`](file:///d:/SEM_3/23AID205-%20AI%20&%20ML/CrediFlux/data/X_test_processed.csv) (`5,951` rows $\times$ `29` columns)
- [`data/y_train.csv`](file:///d:/SEM_3/23AID205-%20AI%20&%20ML/CrediFlux/data/y_train.csv) (`23,803` labels)
- [`data/y_test.csv`](file:///d:/SEM_3/23AID205-%20AI%20&%20ML/CrediFlux/data/y_test.csv) (`5,951` labels)
