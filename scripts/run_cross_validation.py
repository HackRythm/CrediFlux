import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score
)

def main():
    print("==================================================")
    print("CREDIFLUX — PHASE 8: 5-FOLD STRATIFIED CROSS-VALIDATION")
    print("==================================================")

    # 1. Resolve Data Path (Training Data ONLY - Test Set is NOT touched!)
    def resolve_path(filename):
        for d in ["data", os.path.join("..", "data")]:
            p = os.path.join(d, filename)
            if os.path.exists(p):
                return p
        raise FileNotFoundError(f"{filename} not found in data/ or ../data/")

    X_train_path = resolve_path("X_train_processed.csv")
    y_train_path = resolve_path("y_train.csv")

    X_train = pd.read_csv(X_train_path)
    y_train = pd.read_csv(y_train_path).squeeze()

    print(f"Data Loaded (X_test & y_test ARE NOT TOUCHED):")
    print(f"  X_train: {X_train.shape} | y_train: {y_train.shape} (Default rate: {y_train.mean()*100:.2f}%)")

    # 2. Setup 5-Fold Stratified CV
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    # Define Models
    models = {}

    # Logistic Regression Pipeline (scaling learned within each fold)
    models['Logistic Regression'] = Pipeline([
        ('scaler', StandardScaler()),
        ('logreg', LogisticRegression(C=1.0, max_iter=1000, class_weight='balanced', solver='lbfgs', random_state=42))
    ])

    # Random Forest Classifier
    models['Random Forest'] = RandomForestClassifier(
        n_estimators=300, max_depth=None, min_samples_split=2, min_samples_leaf=1,
        max_features='sqrt', class_weight='balanced', random_state=42, n_jobs=-1
    )

    # XGBoost Classifier
    neg_cnt = (y_train == 0).sum()
    pos_cnt = (y_train == 1).sum()
    spw = neg_cnt / pos_cnt

    models['XGBoost'] = XGBClassifier(
        n_estimators=300, max_depth=5, learning_rate=0.1, scale_pos_weight=spw,
        subsample=0.8, colsample_bytree=0.8, eval_metric='logloss',
        use_label_encoder=False, random_state=42, n_jobs=-1
    )

    # 3. Perform 5-Fold CV
    cv_results = {}

    for name, model in models.items():
        print(f"\nEvaluating {name} across 5 validation folds...")
        acc_list, prec_list, rec_list, f1_list, roc_list, pr_list = [], [], [], [], [], []

        for fold, (train_idx, val_idx) in enumerate(skf.split(X_train, y_train), 1):
            X_tr, y_tr = X_train.iloc[train_idx], y_train.iloc[train_idx]
            X_val, y_val = X_train.iloc[val_idx], y_train.iloc[val_idx]

            model.fit(X_tr, y_tr)
            y_proba_val = model.predict_proba(X_val)[:, 1]
            y_pred_val  = (y_proba_val >= 0.50).astype(int)

            acc_list.append(accuracy_score(y_val, y_pred_val))
            prec_list.append(precision_score(y_val, y_pred_val, zero_division=0))
            rec_list.append(recall_score(y_val, y_pred_val, zero_division=0))
            f1_list.append(f1_score(y_val, y_pred_val, zero_division=0))
            roc_list.append(roc_auc_score(y_val, y_proba_val))
            pr_list.append(average_precision_score(y_val, y_proba_val))

            print(f"  Fold {fold}: Acc={acc_list[-1]:.4f}, Rec={rec_list[-1]:.4f}, F1={f1_list[-1]:.4f}, ROC-AUC={roc_list[-1]:.4f}")

        cv_results[name] = {
            'Accuracy': (np.mean(acc_list), np.std(acc_list)),
            'Precision': (np.mean(prec_list), np.std(prec_list)),
            'Recall': (np.mean(rec_list), np.std(rec_list)),
            'F1': (np.mean(f1_list), np.std(f1_list)),
            'ROC-AUC': (np.mean(roc_list), np.std(roc_list)),
            'PR-AUC': (np.mean(pr_list), np.std(pr_list))
        }

    # 4. Summary Table
    print("\n" + "="*80)
    print("5-FOLD CROSS-VALIDATION SUMMARY TABLE (Mean ± Std)")
    print("="*80)

    summary_rows = []
    for name in models.keys():
        res = cv_results[name]
        summary_rows.append({
            'Model': name,
            'Accuracy': f"{res['Accuracy'][0]:.4f} ± {res['Accuracy'][1]:.4f}",
            'Precision': f"{res['Precision'][0]:.4f} ± {res['Precision'][1]:.4f}",
            'Recall': f"{res['Recall'][0]:.4f} ± {res['Recall'][1]:.4f}",
            'F1': f"{res['F1'][0]:.4f} ± {res['F1'][1]:.4f}",
            'ROC-AUC': f"{res['ROC-AUC'][0]:.4f} ± {res['ROC-AUC'][1]:.4f}",
            'PR-AUC': f"{res['PR-AUC'][0]:.4f} ± {res['PR-AUC'][1]:.4f}"
        })

    summary_df = pd.DataFrame(summary_rows)
    print(summary_df.to_string(index=False))

    # 5. Save Visualization
    assets_dir = "assets" if os.path.exists("assets") else os.path.join("..", "assets")
    os.makedirs(assets_dir, exist_ok=True)
    sns.set_theme(style="whitegrid", palette="muted")

    plt.figure(figsize=(8, 5))
    names = list(models.keys())
    means = [cv_results[m]['ROC-AUC'][0] for m in names]
    stds  = [cv_results[m]['ROC-AUC'][1] for m in names]

    bars = plt.bar(names, means, yerr=stds, capsize=5, color=['#2b5c8f', '#d95f02', '#7570b3'], edgecolor='black', width=0.5)
    plt.title("5-Fold Cross-Validation: Mean ROC-AUC Comparison", fontsize=12, fontweight='bold', pad=12)
    plt.ylabel("Mean ROC-AUC Score", fontsize=11)
    plt.ylim(0.50, 0.75)
    for bar in bars:
        yval = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2.0, yval + 0.01, f"{yval:.4f}", ha='center', va='bottom', fontweight='bold')

    plt.tight_layout()
    cv_plot_path = os.path.join(assets_dir, "cv_roc_auc_comparison.png")
    plt.savefig(cv_plot_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"\nSaved visualization -> {cv_plot_path}")
    print("Phase 8 Cross-Validation complete.")

if __name__ == "__main__":
    main()
