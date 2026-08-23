# <p align="center"><img src="assets/crediflux_logo.svg" alt="CrediFlux Logo" width="220"/><br>CrediFlux</p>

[![Python Version](https://img.shields.io/badge/python-3.13%2B-blue.svg)](https://www.python.org/)
[![Jupyter Notebook](https://img.shields.io/badge/Jupyter-Notebook-orange.svg)](https://jupyter.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**CrediFlux** is an end-to-end Machine Learning project designed for **credit risk assessment** and **loan default prediction**. By leveraging historical peer-to-peer lending data from Lending Club, the system aims to analyze borrower profiles, financial indicators, and credit history to classify loan defaults and evaluate creditworthiness.

---

## 📂 Project Structure

The project follows a clean, modular structure:

```text
CrediFlux/
│
├── assets/
│   └── crediflux_logo.svg            # Project branding logo
│
├── data/
│   ├── accepted_2007_to_2018Q4.csv   # Raw source dataset (~2.26M rows, locally stored)
│   └── crediflux_50k.csv             # Stratified representative sample (50,000 rows)
│
├── notebooks/
│   └── 01_create_50k_dataset.ipynb   # Dataset sampling and verification notebook
│
├── .gitignore                        # Git exclusions (ignores raw dataset and caches)
└── README.md                         # Project documentation (this file)
```

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have Python 3.13+ installed. Install the required data science packages:

```bash
pip install pandas numpy matplotlib seaborn scikit-learn jupyter
```

### 2. Running the Sampling Notebook
To execute the data sampling notebook and regenerate the 50K sample:

```bash
jupyter nbconvert --to notebook --execute --inplace notebooks/01_create_50k_dataset.ipynb
```

---

## 📊 Mid-Semester Phase: Stratified Random Sampling

Because the full dataset is extremely large (~1.67 GB, 2.26 million rows), we generated a manageable yet highly representative working subset of **exactly 50,000 rows** for local development.

### 🔍 Sampling Strategy
To preserve the distribution of the highly imbalanced target column `loan_status` (which contains credit default and performance indicators), we implemented **Stratified Random Sampling** using scikit-learn.
* **Seed:** `random_state = 42` (ensures 100% reproducibility).
* **Memory Safety:** Streaming chunk-based pandas reading was used to prevent Out-Of-Memory (OOM) crashes on local environments.

### 📈 Representativeness Validation

#### Size Verification
* **Original Dataset:** 2,260,701 rows $\times$ 151 columns
* **Sampled Dataset:** 50,000 rows $\times$ 151 columns
* **Status:** Verified (`assert len(df_50k) == 50000`)

#### Target Distribution Comparison (`loan_status`)
The stratified sampling retains class percentages down to three decimal places:

| Category | Original Count | Original % | Sample Count | Sample % |
| :--- | :---: | :---: | :---: | :---: |
| **Fully Paid** | 1,076,751 | 47.629% | 23,814 | 47.628% |
| **Current** | 878,317 | 38.852% | 19,426 | 38.852% |
| **Charged Off** | 268,559 | 11.879% | 5,940 | 11.880% |
| **Late (31-120 days)** | 21,467 | 0.950% | 475 | 0.950% |
| **In Grace Period** | 8,436 | 0.373% | 186 | 0.372% |
| **Late (16-30 days)** | 4,349 | 0.192% | 96 | 0.192% |
| **Does not meet credit policy: Fully Paid** | 1,988 | 0.088% | 44 | 0.088% |
| **Does not meet credit policy: Charged Off** | 761 | 0.034% | 17 | 0.034% |
| **Default** | 40 | 0.002% | 1 | 0.002% |
| **Missing** | 33 | 0.001% | 1 | 0.002% |

---

## 🛠️ Roadmap & Future Phases

- [x] **Phase 1: Stratified Sampling & Validation (Current)**
  * Sample 50,000 representative records.
  * Verify target and numerical distribution similarity.
  * Establish reproducible seed structure.
- [ ] **Phase 2: Data Preprocessing & Cleaning**
  * Target variable binarization (mapping `loan_status` categories to Default/Non-Default).
  * Missing value imputation strategies.
  * Categorical feature encoding (One-Hot / Target encoding).
  * Outlier detection and treatment.
- [ ] **Phase 3: Exploratory Data Analysis (EDA) & Feature Selection**
  * Correlation analysis, distribution plotting, and feature importance analysis.
  * Multicollinearity detection (VIF analysis).
- [ ] **Phase 4: ML Model Training & Evaluation**
  * Benchmark models (Logistic Regression, Random Forest, XGBoost).
  * Hyperparameter tuning using Grid/Randomized Search.
  * Evaluation metrics focusing on Recall, F1-Score, and ROC-AUC.
