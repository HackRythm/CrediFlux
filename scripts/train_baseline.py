import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

def main():
    # Load dataset
    data_path = os.path.join("data", "crediflux_50k.csv")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}")

    print(f"Loading dataset from {data_path}...")
    df = pd.read_csv(data_path, low_memory=False)

    # Filter dataset to include only resolved outcomes
    resolved_df = df[df['loan_status'].isin(['Fully Paid', 'Charged Off'])].copy()

    # Map to binary targets: Fully Paid -> 0, Charged Off -> 1
    resolved_df['target'] = resolved_df['loan_status'].map({'Fully Paid': 0, 'Charged Off': 1})

    print(f"Original dataset size: {df.shape[0]} rows")
    print(f"Resolved dataset size: {resolved_df.shape[0]} rows")

    # Select the 12 numerical features available at loan origination
    candidate_features = [
        'loan_amnt', 'annual_inc', 'int_rate', 'installment', 'dti',
        'fico_range_low', 'fico_range_high', 'revol_bal', 'revol_util',
        'open_acc', 'total_acc', 'delinq_2yrs'
    ]
    features = [col for col in candidate_features if col in resolved_df.columns]

    X = resolved_df[features].copy()
    y = resolved_df['target'].copy()

    # Train/test split (80/20), leakage-free
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Impute missing values using training-split median only
    medians = X_train.median()
    X_train_imputed = X_train.fillna(medians)
    X_test_imputed  = X_test.fillna(medians)

    # Standard scaling fitted on training split only
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_imputed)
    X_test_scaled  = scaler.transform(X_test_imputed)

    # Train Linear Regression model
    model = LinearRegression()
    model.fit(X_train_scaled, y_train)

    # Predictions
    y_pred       = model.predict(X_test_scaled)
    y_pred_class = (y_pred >= 0.5).astype(int)

    # Regression metrics
    mae  = mean_absolute_error(y_test, y_pred)
    mse  = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    r2   = r2_score(y_test, y_pred)

    # Classification metrics
    accuracy  = accuracy_score(y_test, y_pred_class)
    precision = precision_score(y_test, y_pred_class, zero_division=0)
    recall    = recall_score(y_test, y_pred_class, zero_division=0)
    f1        = f1_score(y_test, y_pred_class, zero_division=0)
    cm        = confusion_matrix(y_test, y_pred_class)

    print("\n--- Regression Metrics ---")
    print(f"MAE:  {mae:.6f}")
    print(f"MSE:  {mse:.6f}")
    print(f"RMSE: {rmse:.6f}")
    print(f"R2:   {r2:.6f}")

    print("\n--- Classification Metrics (Threshold = 0.5) ---")
    print(f"Accuracy:  {accuracy:.6f}")
    print(f"Precision: {precision:.6f}")
    print(f"Recall:    {recall:.6f}")
    print(f"F1-Score:  {f1:.6f}")
    print("\nConfusion Matrix:")
    print(cm)

    # ── Save diagnostic plots to assets/ ──────────────────────────────────────
    os.makedirs("assets", exist_ok=True)
    sns.set_theme(style="whitegrid", palette="muted")
    residuals = y_test - y_pred

    # Combined 3-panel figure
    fig, axes = plt.subplots(1, 3, figsize=(18, 5))

    sns.stripplot(x=y_test, y=y_pred, ax=axes[0], alpha=0.3, jitter=0.25, color='teal')
    axes[0].axhline(0.5, color='red', linestyle='--', label='Threshold (0.5)')
    axes[0].set_xlabel("Actual Target (0=Paid, 1=Charged Off)")
    axes[0].set_ylabel("Predicted Value (Continuous)")
    axes[0].set_title("Actual vs. Predicted (with Jitter)")
    axes[0].legend()

    axes[1].scatter(y_pred, residuals, alpha=0.1, color='purple')
    axes[1].axhline(0, color='black', linestyle='--')
    axes[1].set_xlabel("Predicted Value")
    axes[1].set_ylabel("Residual (Actual - Predicted)")
    axes[1].set_title("Residual Plot")

    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False, ax=axes[2],
                xticklabels=['Non-default (0)', 'Default (1)'],
                yticklabels=['Non-default (0)', 'Default (1)'])
    axes[2].set_xlabel("Predicted Label")
    axes[2].set_ylabel("True Label")
    axes[2].set_title("Confusion Matrix Heatmap")

    plt.tight_layout()
    combined = os.path.join("assets", "baseline_diagnostic_plots.png")
    plt.savefig(combined, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"\nSaved combined diagnostic plot -> {combined}")

    # Individual plots
    for name, fn in [
        ("actual_vs_predicted", lambda: (
            plt.figure(figsize=(6,5)),
            sns.stripplot(x=y_test, y=y_pred, alpha=0.3, jitter=0.25, color='teal'),
            plt.axhline(0.5, color='red', linestyle='--', label='Threshold (0.5)'),
            plt.xlabel("Actual Target (0=Paid, 1=Charged Off)"),
            plt.ylabel("Predicted Value (Continuous)"),
            plt.title("Actual vs. Predicted (with Jitter)"),
            plt.legend(),
            plt.tight_layout()
        )),
        ("residuals", lambda: (
            plt.figure(figsize=(6,5)),
            plt.scatter(y_pred, residuals, alpha=0.1, color='purple'),
            plt.axhline(0, color='black', linestyle='--'),
            plt.xlabel("Predicted Value"),
            plt.ylabel("Residual (Actual - Predicted)"),
            plt.title("Residual Plot"),
            plt.tight_layout()
        )),
        ("confusion_matrix", lambda: (
            plt.figure(figsize=(6,5)),
            sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False,
                        xticklabels=['Non-default (0)', 'Default (1)'],
                        yticklabels=['Non-default (0)', 'Default (1)']),
            plt.xlabel("Predicted Label"),
            plt.ylabel("True Label"),
            plt.title("Confusion Matrix Heatmap"),
            plt.tight_layout()
        )),
    ]:
        fn()
        path = os.path.join("assets", f"{name}.png")
        plt.savefig(path, dpi=150, bbox_inches='tight')
        plt.close()
        print(f"Saved {path}")

if __name__ == "__main__":
    main()
