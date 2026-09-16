# Notebook 03: Deeper Exploratory Data Analysis (EDA)

This document explains the purpose, workflow, and results of the Jupyter notebook:

[`03_deeper_eda.ipynb`](file:///d:/SEM_3/23AID205-%20AI%20&%20ML/CrediFlux/notebooks/03_deeper_eda.ipynb)

---

## 🎯 Objective
Perform a research-grade, diagnostic Exploratory Data Analysis on the resolved loans subset (29,754 records) from the representative 50K sample. The goal is to uncover distributional characteristics, risk discriminators, multicollinearity patterns, and anomalies to guide the upcoming feature engineering and XGBoost modeling stages.

---

## ⚙️ Methodology & Sections

### 1. Data Quality & Structural Overview
- **Resolved Shape:** 29,754 rows $\times$ 152 columns (including target).
- **Duplicate Rows:** Exactly 0 duplicate records.
- **Completeness:** Core numerical features have $\approx 100\%$ completeness (`dti` has 6 missing values; `revol_util` has 26 missing values). Categorical predictor `emp_length` has 1,729 missing values (5.81%).

### 2. Target Imbalance Analysis
- `0` = **Fully Paid (Non-Default):** 23,814 instances (**80.04%**)
- `1` = **Charged Off (Default):** 5,940 instances (**19.96%**)
- Imbalance ratio: ~4:1. Demonstrates the "Accuracy Paradox" and sets the requirement for PR-AUC and ROC-AUC evaluation.

### 3. Statistical Profiling of Key Numerical Variables
Summary metrics (Mean, Median, Std Dev, Variance, Min, Q1, Q3, Max, IQR, Skewness) for 12 origination features:

| Feature | Mean | Median | Std Dev | Min | Max | IQR | Skewness |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `loan_amnt` | 14,411.02 | 12,000.00 | 8,707.03 | 1,000.00 | 40,000.00 | 12,000.00 | 0.70 |
| `annual_inc` | 76,013.92 | 65,000.00 | 66,743.08 | 0.00 | 4,300,012.00 | 45,000.00 | 29.58 |
| `int_rate` | 13.27 | 12.74 | 4.77 | 5.31 | 30.99 | 6.55 | 0.88 |
| `installment` | 437.76 | 373.94 | 261.42 | 14.77 | 1,566.59 | 363.66 | 0.89 |
| `dti` | 18.41 | 17.62 | 9.94 | 0.00 | 831.97 | 11.23 | 12.39 |
| `fico_range_low` | 697.68 | 690.00 | 31.81 | 660.00 | 845.00 | 40.00 | 0.90 |
| `fico_range_high`| 701.68 | 694.00 | 31.81 | 664.00 | 850.00 | 40.00 | 0.90 |
| `revol_bal` | 16,211.22 | 11,048.00 | 21,800.82 | 0.00 | 616,104.00 | 13,858.00 | 8.52 |
| `revol_util` | 52.00 | 52.30 | 24.50 | 0.00 | 155.30 | 36.30 | -0.07 |
| `open_acc` | 11.58 | 11.00 | 5.48 | 0.00 | 61.00 | 6.00 | 1.14 |
| `total_acc` | 24.89 | 23.00 | 11.96 | 2.00 | 123.00 | 15.00 | 0.91 |
| `delinq_2yrs` | 0.31 | 0.00 | 0.88 | 0.00 | 16.00 | 0.00 | 5.21 |

---

## 📊 Key Findings

### 1. Primary Risk Discriminators
- **`grade` & `sub_grade`:** Monotonic surge in default probability from Grade A (5.93%) to Grade G (48.84%), and A1 (2.5%) to G5 (55.6%).
- **`int_rate`:** Mean interest rate is 15.70% for defaults vs. 12.66% for non-defaults (+24.01% higher).
- **`term`:** 60-month loans have a default rate of **32.37%**, more than double that of 36-month loans (**16.09%**).
- **`dti` & `revol_util`:** Defaulted borrowers carry higher debt-to-income (20.17% vs. 17.97%) and higher revolving utilization (54.91% vs. 51.27%).
- **`purpose`:** `small_business` carries the highest default rate (32.27%), whereas `credit_card` carries 16.22%.

### 2. Multicollinearity & Diagnostic VIF
- **`fico_range_low` vs. `fico_range_high` ($r = 0.9999999$):** Identical with an offset of 4 points. Must consolidate to a single FICO score.
- **`loan_amnt` vs. `installment` ($r = 0.9535$):** Deterministic amortization relationship.

### 3. Data Anomalies Documented
- 13 loans with DTI > 100% (max 831.97%).
- 89 loans with revolving utilization > 100% (max 155.3%, over credit limit).
- 6 records with $0 annual income; extreme right tail skewness up to $4.3M.
- `delinq_2yrs` zero-inflation (82.3% of loans have 0 delinquencies).

---

## 🛠️ Roadmap: Recommended Next Phase (Phase 4)
1. **Feature Engineering:** Consolidate FICO bounds, extract credit history age (`issue_d - earliest_cr_line`), compute debt service burden ratios (`installment / monthly_income`), and binary delinquency flags.
2. **Preprocessing Pipeline:** Ordinal encoding for `sub_grade`, binary encoding for `term`, One-Hot encoding for `home_ownership`/`purpose` with rare consolidation, and outlier capping for `dti`.
3. **Advanced Modeling:** Train **Logistic Regression** (balanced weights) and **XGBoost Classifier** with threshold optimization on PR-AUC / ROC-AUC.
