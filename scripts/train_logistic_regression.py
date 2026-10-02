import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score,
    confusion_matrix, classification_report,
    roc_curve, precision_recall_curve
)

def main():
    print("==================================================")
    print("CREDIFLUX — PHASE 7: LOGISTIC REGRESSION CLASSIFIER")
    print("==================================================")

    # 1. Resolve Paths
    def resolve_path(filename):
        for d in ["data", os.path.join("..", "data")]:
            p = os.path.join(d, filename)
            if os.path.exists(p):
                return p
        raise FileNotFoundError(f"{filename} not found in data/ or ../data/")

    X_train_path = resolve_path("X_train_processed.csv")
    X_test_path  = resolve_path("X_test_processed.csv")
    y_train_path = resolve_path("y_train.csv")
    y_test_path  = resolve_path("y_test.csv")

    X_train = pd.read_csv(X_train_path)
    X_test  = pd.read_csv(X_test_path)
    y_train = pd.read_csv(y_train_path).squeeze()
    y_test  = pd.read_csv(y_test_path).squeeze()

    # 2. Validation
    assert X_train.shape[1] == 35, f"Expected 35 features, got {X_train.shape[1]}"
    assert X_test.shape[1] == 35, f"Expected 35 features, got {X_test.shape[1]}"
    assert list(X_train.columns) == list(X_test.columns), "Feature ordering mismatch!"
    assert "target" not in X_train.columns and "target" not in X_test.columns, "Target in X!"

    print(f"Dataset Validation Passed:")
    print(f"  X_train: {X_train.shape} | y_train: {y_train.shape} (Default rate: {y_train.mean()*100:.2f}%)")
    print(f"  X_test:  {X_test.shape}  | y_test:  {y_test.shape}  (Default rate: {y_test.mean()*100:.2f}%)")

    # 3. Preprocessing (StandardScaler fitted ONLY on X_train)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled  = scaler.transform(X_test)

    X_train_scaled_df = pd.DataFrame(X_train_scaled, columns=X_train.columns)
    X_test_scaled_df  = pd.DataFrame(X_test_scaled, columns=X_test.columns)

    # 4. Model Training
    logreg = LogisticRegression(
        C=1.0,
        max_iter=1000,
        class_weight="balanced",
        solver="lbfgs",
        random_state=42
    )

    print("\nFitting LogisticRegression(C=1.0, class_weight='balanced', solver='lbfgs', random_state=42)...")
    logreg.fit(X_train_scaled_df, y_train)
    print("Training complete.")

    # 5. Predictions & Standard Evaluation (t=0.50)
    y_proba = logreg.predict_proba(X_test_scaled_df)[:, 1]
    y_pred_05 = (y_proba >= 0.50).astype(int)

    acc  = accuracy_score(y_test, y_pred_05)
    prec = precision_score(y_test, y_pred_05, zero_division=0)
    rec  = recall_score(y_test, y_pred_05, zero_division=0)
    f1   = f1_score(y_test, y_pred_05, zero_division=0)
    roc  = roc_auc_score(y_test, y_proba)
    pr_auc = average_precision_score(y_test, y_proba)

    cm = confusion_matrix(y_test, y_pred_05)
    tn, fp, fn, tp = cm.ravel()

    print("\n--- Evaluation Metrics (Threshold = 0.50) ---")
    print(f"  Accuracy:  {acc:.6f}")
    print(f"  Precision: {prec:.6f}")
    print(f"  Recall:    {rec:.6f}")
    print(f"  F1-Score:  {f1:.6f}")
    print(f"  ROC-AUC:   {roc:.6f}")
    print(f"  PR-AUC:    {pr_auc:.6f}")
    print(f"\nConfusion Matrix (t=0.50):")
    print(f"  TN = {tn:,} | FP = {fp:,}")
    print(f"  FN = {fn:,} | TP = {tp:,}")

    # 6. Assets Setup
    assets_dir = "assets" if os.path.exists("assets") else os.path.join("..", "assets")
    os.makedirs(assets_dir, exist_ok=True)
    sns.set_theme(style="whitegrid", palette="muted")
    plt.rcParams['figure.dpi'] = 120

    # Asset 1: Confusion Matrix
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False,
                xticklabels=['Fully Paid (0)', 'Charged Off (1)'],
                yticklabels=['Fully Paid (0)', 'Charged Off (1)'])
    plt.title("Logistic Regression Confusion Matrix (Threshold = 0.50)", fontsize=12, fontweight='bold', pad=12)
    plt.xlabel("Predicted Label")
    plt.ylabel("True Label")
    plt.tight_layout()
    cm_path = os.path.join(assets_dir, "logreg_confusion_matrix.png")
    plt.savefig(cm_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved asset -> {cm_path}")

    # Asset 2: ROC Curve
    fpr, tpr, _ = roc_curve(y_test, y_proba)
    plt.figure(figsize=(7, 5))
    plt.plot(fpr, tpr, color='#2b5c8f', linewidth=2, label=f'Logistic Regression (ROC-AUC = {roc:.4f})')
    plt.plot([0, 1], [0, 1], 'k--', alpha=0.5, label='Random Baseline (AUC = 0.50)')
    plt.xlabel('False Positive Rate', fontsize=11)
    plt.ylabel('True Positive Rate (Recall)', fontsize=11)
    plt.title('Logistic Regression ROC Curve', fontsize=12, fontweight='bold')
    plt.legend(loc='lower right', fontsize=10)
    plt.xlim([-0.01, 1.01])
    plt.ylim([-0.01, 1.01])
    plt.tight_layout()
    roc_path = os.path.join(assets_dir, "logreg_roc_curve.png")
    plt.savefig(roc_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved asset -> {roc_path}")

    # Asset 3: Precision-Recall Curve
    precision_vals, recall_vals, _ = precision_recall_curve(y_test, y_proba)
    plt.figure(figsize=(7, 5))
    plt.plot(recall_vals, precision_vals, color='#d95f02', linewidth=2, label=f'Logistic Regression (PR-AUC = {pr_auc:.4f})')
    plt.axhline(y_test.mean(), color='grey', linestyle='--', alpha=0.6, label=f'No-Skill Baseline ({y_test.mean():.2f})')
    plt.xlabel('Recall', fontsize=11)
    plt.ylabel('Precision', fontsize=11)
    plt.title('Logistic Regression Precision-Recall Curve', fontsize=12, fontweight='bold')
    plt.legend(loc='upper right', fontsize=10)
    plt.xlim([-0.01, 1.01])
    plt.ylim([0, 1.05])
    plt.tight_layout()
    pr_path = os.path.join(assets_dir, "logreg_pr_curve.png")
    plt.savefig(pr_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved asset -> {pr_path}")

    # Asset 4: Diagnostic Threshold Analysis
    thresholds = np.arange(0.10, 0.95, 0.05)
    ts_rows = []
    for t in thresholds:
        yp = (y_proba >= t).astype(int)
        ts_rows.append({
            'Threshold': t,
            'Accuracy': accuracy_score(y_test, yp),
            'Precision': precision_score(y_test, yp, zero_division=0),
            'Recall': recall_score(y_test, yp, zero_division=0),
            'F1': f1_score(y_test, yp, zero_division=0)
        })
    thresh_df = pd.DataFrame(ts_rows)

    plt.figure(figsize=(9, 5))
    plt.plot(thresh_df['Threshold'], thresh_df['Precision'], 'o-', color='#2b5c8f', label='Precision', linewidth=2)
    plt.plot(thresh_df['Threshold'], thresh_df['Recall'], 's-', color='#d95f02', label='Recall', linewidth=2)
    plt.plot(thresh_df['Threshold'], thresh_df['F1'], '^-', color='#7570b3', label='F1-Score', linewidth=2)
    plt.axvline(0.50, color='gray', linestyle='--', alpha=0.7, label='Standard Threshold (0.50)')
    plt.xlabel('Decision Threshold', fontsize=11)
    plt.ylabel('Score', fontsize=11)
    plt.title('Logistic Regression Diagnostic Threshold Analysis (Test Set Diagnostics)', fontsize=12, fontweight='bold')
    plt.legend(fontsize=10)
    plt.xlim([0.08, 0.92])
    plt.ylim([0, 1.05])
    plt.tight_layout()
    thresh_path = os.path.join(assets_dir, "logreg_threshold_analysis.png")
    plt.savefig(thresh_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved asset -> {thresh_path}")

    # Asset 5: Coefficient Importance Plot (Top 10 Positive & Top 10 Negative)
    coef_df = pd.DataFrame({
        'Feature': X_train.columns,
        'Coefficient': logreg.coef_[0],
        'Abs_Magnitude': np.abs(logreg.coef_[0]),
        'Odds_Ratio': np.exp(logreg.coef_[0])
    }).sort_values(by='Coefficient', ascending=True)

    top_pos_neg = pd.concat([coef_df.head(10), coef_df.tail(10)])

    plt.figure(figsize=(10, 8))
    colors = ['#2b5c8f' if c < 0 else '#d95f02' for c in top_pos_neg['Coefficient']]
    plt.barh(top_pos_neg['Feature'], top_pos_neg['Coefficient'], color=colors, edgecolor='black', height=0.6)
    plt.axvline(0, color='black', linestyle='--', linewidth=0.8)
    plt.title('Logistic Regression Standardized Coefficients (Top Positive & Negative Drivers)', fontsize=12, fontweight='bold', pad=12)
    plt.xlabel('Standardized Coefficient (Log-Odds Impact)', fontsize=11)
    plt.tight_layout()
    coef_path = os.path.join(assets_dir, "logreg_coefficients.png")
    plt.savefig(coef_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved asset -> {coef_path}")

    # 7. Comparison Table across 3 models
    comp_df = pd.DataFrame({
        'Metric': ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'ROC-AUC', 'PR-AUC'],
        'Logistic Regression (t=0.50)': [acc, prec, rec, f1, roc, pr_auc],
        'Random Forest (t=0.50)': [0.802218, 0.548673, 0.052189, 0.095311, 0.686592, 0.352213],
        'XGBoost (t=0.50)': [0.681566, 0.315018, 0.506734, 0.388512, 0.677514, 0.344704]
    })

    print("\n--- 3-Model Comparison Table (Identical Phase 4 Stratified Test Set) ---")
    print(comp_df.to_string(index=False))
    print("\nPhase 7 Logistic Regression execution successfully finished!")

if __name__ == "__main__":
    main()
