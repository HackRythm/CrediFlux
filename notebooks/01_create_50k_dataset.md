# Notebook 01: Create Representative 50K Dataset

This document explains the purpose, workflow, and results of the Jupyter notebook:

[`01_create_50k_dataset.ipynb`](file:///d:/SEM_3/23AID205- AI & ML/CrediFlux/notebooks/01_create_50k_dataset.ipynb)

---

## 🎯 Objective
The primary objective of this notebook is to extract a manageable, high-quality, and representative subset of **exactly 50,000 records** from the massive Lending Club source dataset (`accepted_2007_to_2018Q4.csv`).
- **Source size**: ~2.26 million records, 151 columns (~1.67 GB).
- **Target size**: 50,000 records, 151 columns.

---

## ⚙️ Methodology

### 1. Memory-Safe Chunk Reading
Because the source dataset is too large to load into memory on standard local development setups, the notebook utilizes pandas' chunked reading mechanism (`chunksize=100,000`). This reads, scans, and collects target labels sequentially to avoid Out-Of-Memory (OOM) crashes.

### 2. Stratified Random Sampling
To preserve the distribution of the highly imbalanced target column `loan_status` (Fully Paid, Charged Off, Late, Current, etc.), the notebook implements **Stratified Random Sampling** using `train_test_split` from `scikit-learn`:
- **Stratification Column**: `loan_status`
- **Random Seed**: `random_state = 42` (ensures 100% reproducibility)

### 3. Preprocessing Constraint
As per project requirements, **no preprocessing, cleaning, scaling, or modeling is done in this notebook**. The output is raw data to ensure subsequent notebooks handle their respective cleaning pipeline from scratch.

---

## 📊 Distribution Validation
The notebook asserts that the 50K sample retains the target distribution down to three decimal places.

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

## 📁 Output Artifact
The sampled dataset is written to:
- [`data/crediflux_50k.csv`](file:///d:/SEM_3/23AID205- AI & ML/CrediFlux/data/crediflux_50k.csv)
