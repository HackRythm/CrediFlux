# Notebook 02: Simple Linear Regression Baseline

This document explains the purpose, workflow, and results of the Jupyter notebook:

[`02_linear_regression_baseline.ipynb`](file:///d:/SEM_3/23AID205- AI & ML/CrediFlux/notebooks/02_linear_regression_baseline.ipynb)

---

## 🎯 Objective
Establish an initial machine learning baseline using a simple Linear Regression model on the representative 50K sample. The goal is to set a performance benchmark for comparing classification algorithms (Logistic Regression vs. Random Forest) later in the project.

---

## ⚙️ Workflow

### 1. Target Binarization
We filter the dataset to resolved loans and map `loan_status`:
- `Fully Paid` $\rightarrow$ `0` (Non-default, 23,814 instances)
- `Charged Off` $\rightarrow$ `1` (Default, 5,940 instances)
- Ongoing/unresolved loan statuses are excluded to prevent target pollution.

*Data Leakage Prevention*: `loan_status` and post-loan variables (recovery payments, settlements, future loan performance) are excluded from input features.

### 2. Feature Selection
We extract 12 numerical features available at loan origination:
`loan_amnt`, `annual_inc`, `int_rate`, `installment`, `dti`, `fico_range_low`, `fico_range_high`, `revol_bal`, `revol_util`, `open_acc`, `total_acc`, `delinq_2yrs`.

### 3. Missing Value Handling & Scaling (Leakage-free)
- **Train-Test Split**: 80% training / 20% testing with `random_state=42`.
- **Imputation**: Missing values are filled with the **median** computed from the training split only.
- **Scaling**: Normalized using `StandardScaler` fitted on the training split only.

---

## 📊 Evaluation Results

### Regression Performance

| Metric | Score |
| ------ | ----: |
| MAE    | 0.295204 |
| MSE    | 0.146893 |
| RMSE   | 0.383267 |
| R²     | 0.080642 |

### Classification Performance (Threshold = 0.5)
Continuous predictions are categorized using a standard `0.5` boundary:
- **Accuracy**: 0.799866 (Approx. 80.0%)
- **Precision**: 0.470588 (Approx. 47.1%)
- **Recall**: 0.020202 (Approx. 2.0%)
- **F1-Score**: 0.038741 (Approx. 3.9%)

**Confusion Matrix**:
- **True Negatives (TN)**: 4,736
- **False Positives (FP)**: 27
- **False Negatives (FN)**: 1,164
- **True Positives (TP)**: 24

---

## 📈 Visualizations
The notebook generates three key diagnostic plots:
1. **Actual vs. Predicted Plot**: Shows continuous outputs vs. binary ground truth with a jitter stripplot to display density.
2. **Residual Plot**: Displays prediction errors ($y - \hat{y}$) against predicted values. Shows non-constant variance (heteroscedasticity) typical of binary targets modeled via regression.
3. **Confusion Matrix Heatmap**: A color-coded visualization of model classifications.

---

## 💡 Key Findings & Next Steps
- **Linear Probability Model**: Applying Linear Regression to binary outcomes leads to unconstrained predictions outside $[0, 1]$ and heteroscedastic residuals, violating standard regression assumptions.
- **Class Imbalance Bias**: Since default is a minority class (~20%), the regression line is pulled towards 0. Consequently, almost all predictions fall below 0.5. The model classifies nearly every record as Non-default, leading to high accuracy (~80%) but an extremely poor recall (~2%).
- **Conclusion**: Linear Regression is inappropriate as a final system. We will transition to binary classification models (e.g., **Logistic Regression** and **Random Forest**) in the next phase.
