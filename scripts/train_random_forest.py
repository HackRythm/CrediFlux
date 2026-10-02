import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score,
    confusion_matrix, classification_report,
    roc_curve, precision_recall_curve
)
from xgboost import XGBClassifier

def main():
    print("==================================================")
    print("CREDIFLUX — PHASE 6: RANDOM FOREST CLASSIFIER")
    print("==================================================")

    # 1. Resolve Data Paths
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

    print(f"Loading data from: {os.path.dirname(X_train_path)}")
    X_train = pd.read_csv(X_train_path)
    X_test  = pd.read_csv(X_test_path)
    y_train = pd.read_csv(y_train_path).squeeze()
    y_test  = pd.read_csv(y_test_path).squeeze()

    # 2. Data Validation
    assert X_train.shape[1] == 35, f"Expected 35 features, got {X_train.shape[1]}"
    assert X_test.shape[1] == 35, f"Expected 35 features, got {X_test.shape[1]}"
    assert list(X_train.columns) == list(X_test.columns), "Feature column names/ordering mismatch!"
    assert "target" not in X_train.columns and "target" not in X_test.columns, "Target column in X!"

    print(f"Validation Passed:")
    print(f"  X_train: {X_train.shape} | y_train: {y_train.shape} (Default rate: {y_train.mean()*100:.2f}%)")
    print(f"  X_test:  {X_test.shape}  | y_test:  {y_test.shape}  (Default rate: {y_test.mean()*100:.2f}%)")

    # 3. Model Configuration & Training
    rf_model = RandomForestClassifier(
        n_estimators=300,
        max_depth=None,
        min_samples_split=2,
        min_samples_leaf=1,
        max_features="sqrt",
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )

    print("\nTraining RandomForestClassifier(n_estimators=300, class_weight='balanced', random_state=42)...")
    rf_model.fit(X_train, y_train)
    print("Training complete.")

    # 4. Predictions & Standard Evaluation (Threshold = 0.50)
    y_proba = rf_model.predict_proba(X_test)[:, 1]
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

    # 5. Output Assets Directory Setup
    assets_dir = "assets" if os.path.exists("assets") else os.path.join("..", "assets")
    os.makedirs(assets_dir, exist_ok=True)
    sns.set_theme(style="whitegrid", palette="muted")
    plt.rcParams['figure.dpi'] = 120

    # Asset 1: Confusion Matrix
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False,
                xticklabels=['Fully Paid (0)', 'Charged Off (1)'],
                yticklabels=['Fully Paid (0)', 'Charged Off (1)'])
    plt.title("Random Forest Confusion Matrix (Threshold = 0.50)", fontsize=12, fontweight='bold', pad=12)
    plt.xlabel("Predicted Label")
    plt.ylabel("True Label")
    plt.tight_layout()
    cm_path = os.path.join(assets_dir, "rf_confusion_matrix.png")
    plt.savefig(cm_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved asset -> {cm_path}")

    # Asset 2: ROC Curve
    fpr, tpr, _ = roc_curve(y_test, y_proba)
    plt.figure(figsize=(7, 5))
    plt.plot(fpr, tpr, color='#2b5c8f', linewidth=2, label=f'Random Forest (ROC-AUC = {roc:.4f})')
    plt.plot([0, 1], [0, 1], 'k--', alpha=0.5, label='Random Baseline (AUC = 0.50)')
    plt.xlabel('False Positive Rate', fontsize=11)
    plt.ylabel('True Positive Rate (Recall)', fontsize=11)
    plt.title('Random Forest ROC Curve', fontsize=12, fontweight='bold')
    plt.legend(loc='lower right', fontsize=10)
    plt.xlim([-0.01, 1.01])
    plt.ylim([-0.01, 1.01])
    plt.tight_layout()
    roc_path = os.path.join(assets_dir, "rf_roc_curve.png")
    plt.savefig(roc_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved asset -> {roc_path}")

    # Asset 3: Precision-Recall Curve
    precision_vals, recall_vals, _ = precision_recall_curve(y_test, y_proba)
    plt.figure(figsize=(7, 5))
    plt.plot(recall_vals, precision_vals, color='#d95f02', linewidth=2, label=f'Random Forest (PR-AUC = {pr_auc:.4f})')
    plt.axhline(y_test.mean(), color='grey', linestyle='--', alpha=0.6, label=f'No-Skill Baseline ({y_test.mean():.2f})')
    plt.xlabel('Recall', fontsize=11)
    plt.ylabel('Precision', fontsize=11)
    plt.title('Random Forest Precision-Recall Curve', fontsize=12, fontweight='bold')
    plt.legend(loc='upper right', fontsize=10)
    plt.xlim([-0.01, 1.01])
    plt.ylim([0, 1.05])
    plt.tight_layout()
    pr_path = os.path.join(assets_dir, "rf_pr_curve.png")
    plt.savefig(pr_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved asset -> {pr_path}")

    # Asset 4: Diagnostic Threshold Analysis Plot
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
    plt.title('Random Forest Diagnostic Threshold Analysis (Test Set Diagnostics)', fontsize=12, fontweight='bold')
    plt.legend(fontsize=10)
    plt.xlim([0.08, 0.92])
    plt.ylim([0, 1.05])
    plt.tight_layout()
    thresh_path = os.path.join(assets_dir, "rf_threshold_analysis.png")
    plt.savefig(thresh_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved asset -> {thresh_path}")

    # Asset 5: Feature Importance Plot (Top 20)
    imp_df = pd.DataFrame({
        'Feature': X_train.columns,
        'Importance': rf_model.feature_importances_
    }).sort_values(by='Importance', ascending=True)

    top20 = imp_df.tail(20)

    plt.figure(figsize=(10, 8))
    bars = plt.barh(top20['Feature'], top20['Importance'], color='#2b5c8f', edgecolor='black', height=0.6)
    for bar in bars[-5:]:
        bar.set_color('#d95f02')
        bar.set_edgecolor('black')
    plt.title('Random Forest Feature Importance (MDI / Gini - Top 20 Features)', fontsize=12, fontweight='bold', pad=12)
    plt.xlabel('Mean Decrease in Impurity (MDI)', fontsize=11)
    plt.tight_layout()
    fi_path = os.path.join(assets_dir, "rf_feature_importance.png")
    plt.savefig(fi_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved asset -> {fi_path}")

    # 6. Compare with XGBoost on Identical Stratified Test Set
    neg_count = (y_train == 0).sum()
    pos_count = (y_train == 1).sum()
    spw = neg_count / pos_count

    xgb_model = XGBClassifier(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.1,
        scale_pos_weight=spw,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric='logloss',
        use_label_encoder=False,
        random_state=42,
        n_jobs=-1
    )
    xgb_model.fit(X_train, y_train)
    xgb_proba = xgb_model.predict_proba(X_test)[:, 1]
    xgb_pred_05 = (xgb_proba >= 0.50).astype(int)

    comp_df = pd.DataFrame({
        'Metric': ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'ROC-AUC', 'PR-AUC'],
        'XGBoost (t=0.50)': [
            accuracy_score(y_test, xgb_pred_05),
            precision_score(y_test, xgb_pred_05, zero_division=0),
            recall_score(y_test, xgb_pred_05, zero_division=0),
            f1_score(y_test, xgb_pred_05, zero_division=0),
            roc_auc_score(y_test, xgb_proba),
            average_precision_score(y_test, xgb_proba)
        ],
        'Random Forest (t=0.50)': [
            acc, prec, rec, f1, roc, pr_auc
        ]
    })

    print("\n--- Model Comparison (Evaluated on Identical Phase 4 Stratified Test Set) ---")
    print(comp_df.to_string(index=False))
    print("\nPhase 6 Random Forest execution successfully finished!")

if __name__ == "__main__":
    main()
