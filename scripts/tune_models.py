import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import StratifiedKFold, GridSearchCV
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
    print("CREDIFLUX — PHASE 9: HYPERPARAMETER TUNING")
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

    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    # --- 1. LOGISTIC REGRESSION TUNING ---
    print("\n1. Tuning Logistic Regression (C in [0.01, 0.1, 1, 10, 100])...")
    logreg_pipe = Pipeline([
        ('scaler', StandardScaler()),
        ('logreg', LogisticRegression(max_iter=1000, class_weight='balanced', solver='lbfgs', random_state=42))
    ])
    logreg_grid = {'logreg__C': [0.01, 0.1, 1, 10, 100]}
    grid_lr = GridSearchCV(logreg_pipe, logreg_grid, scoring='roc_auc', cv=skf, n_jobs=-1)
    grid_lr.fit(X_train, y_train)

    lr_base_auc = grid_lr.cv_results_['mean_test_score'][2]  # C=1 is index 2
    lr_best_auc = grid_lr.best_score_
    lr_best_params = grid_lr.best_params_
    print(f"   Baseline ROC-AUC (C=1.0): {lr_base_auc:.6f}")
    print(f"   Tuned ROC-AUC:            {lr_best_auc:.6f}")
    print(f"   Best Parameters:          {lr_best_params}")

    # --- 2. RANDOM FOREST TUNING ---
    print("\n2. Tuning Random Forest...")
    rf_base = RandomForestClassifier(
        n_estimators=300, max_depth=None, min_samples_split=2, min_samples_leaf=1,
        max_features='sqrt', class_weight='balanced', random_state=42, n_jobs=-1
    )
    rf_grid = {
        'n_estimators': [200, 300],
        'max_depth': [None, 10, 20],
        'min_samples_leaf': [1, 2, 5],
        'max_features': ['sqrt']
    }
    grid_rf = GridSearchCV(rf_base, rf_grid, scoring='roc_auc', cv=skf, n_jobs=-1)
    grid_rf.fit(X_train, y_train)

    rf_best_auc = grid_rf.best_score_
    rf_best_params = grid_rf.best_params_
    rf_base_idx = next(i for i, p in enumerate(grid_rf.cv_results_['params'])
                       if p['n_estimators'] == 300 and p['max_depth'] is None and p['min_samples_leaf'] == 1)
    rf_base_auc = grid_rf.cv_results_['mean_test_score'][rf_base_idx]
    print(f"   Baseline ROC-AUC (n_est=300, depth=None, leaf=1): {rf_base_auc:.6f}")
    print(f"   Tuned ROC-AUC:                                    {rf_best_auc:.6f}")
    print(f"   Best Parameters:                                  {rf_best_params}")

    # --- 3. XGBOOST TUNING ---
    print("\n3. Tuning XGBoost...")
    neg_cnt = (y_train == 0).sum()
    pos_cnt = (y_train == 1).sum()
    spw = neg_cnt / pos_cnt

    xgb_base = XGBClassifier(
        scale_pos_weight=spw, colsample_bytree=0.8, eval_metric='logloss',
        use_label_encoder=False, random_state=42, n_jobs=-1
    )
    xgb_grid = {
        'n_estimators': [200, 300],
        'max_depth': [3, 5, 7],
        'learning_rate': [0.05, 0.1],
        'subsample': [0.8, 1.0]
    }
    grid_xgb = GridSearchCV(xgb_base, xgb_grid, scoring='roc_auc', cv=skf, n_jobs=-1)
    grid_xgb.fit(X_train, y_train)

    xgb_best_auc = grid_xgb.best_score_
    xgb_best_params = grid_xgb.best_params_
    xgb_base_idx = next(i for i, p in enumerate(grid_xgb.cv_results_['params'])
                        if p['n_estimators'] == 300 and p['max_depth'] == 5 and p['learning_rate'] == 0.1 and p['subsample'] == 0.8)
    xgb_base_auc = grid_xgb.cv_results_['mean_test_score'][xgb_base_idx]
    print(f"   Baseline ROC-AUC (n_est=300, depth=5, lr=0.1, sub=0.8): {xgb_base_auc:.6f}")
    print(f"   Tuned ROC-AUC:                                          {xgb_best_auc:.6f}")
    print(f"   Best Parameters:                                        {xgb_best_params}")

    # 4. Summary Table
    print("\n" + "="*80)
    print("HYPERPARAMETER TUNING SUMMARY TABLE")
    print("="*80)
    summary_df = pd.DataFrame([
        {
            'Model': 'Logistic Regression',
            'Baseline ROC-AUC': f"{lr_base_auc:.6f}",
            'Tuned ROC-AUC': f"{lr_best_auc:.6f}",
            'Improvement': f"{lr_best_auc - lr_base_auc:+.6f}",
            'Best Parameters': str(lr_best_params)
        },
        {
            'Model': 'Random Forest',
            'Baseline ROC-AUC': f"{rf_base_auc:.6f}",
            'Tuned ROC-AUC': f"{rf_best_auc:.6f}",
            'Improvement': f"{rf_best_auc - rf_base_auc:+.6f}",
            'Best Parameters': str(rf_best_params)
        },
        {
            'Model': 'XGBoost',
            'Baseline ROC-AUC': f"{xgb_base_auc:.6f}",
            'Tuned ROC-AUC': f"{xgb_best_auc:.6f}",
            'Improvement': f"{xgb_best_auc - xgb_base_auc:+.6f}",
            'Best Parameters': str(xgb_best_params)
        }
    ])
    print(summary_df.to_string(index=False))

    # 5. Save Comparison Plot
    assets_dir = "assets" if os.path.exists("assets") else os.path.join("..", "assets")
    os.makedirs(assets_dir, exist_ok=True)
    sns.set_theme(style="whitegrid", palette="muted")

    plt.figure(figsize=(9, 5))
    models_list = ['Logistic Regression', 'Random Forest', 'XGBoost']
    base_aucs = [lr_base_auc, rf_base_auc, xgb_base_auc]
    tuned_aucs = [lr_best_auc, rf_best_auc, xgb_best_auc]

    x = np.arange(len(models_list))
    width = 0.35

    plt.bar(x - width/2, base_aucs, width, label='Baseline ROC-AUC', color='#2b5c8f', edgecolor='black')
    plt.bar(x + width/2, tuned_aucs, width, label='Tuned ROC-AUC', color='#d95f02', edgecolor='black')

    plt.ylabel('Mean 5-Fold CV ROC-AUC', fontsize=11)
    plt.title('Baseline vs Tuned Mean CV ROC-AUC Comparison', fontsize=12, fontweight='bold', pad=12)
    plt.xticks(x, models_list, fontsize=10)
    plt.ylim(0.65, 0.74)
    plt.legend(fontsize=10)

    for i in range(len(models_list)):
        plt.text(x[i] - width/2, base_aucs[i] + 0.002, f"{base_aucs[i]:.4f}", ha='center', va='bottom', fontsize=9)
        plt.text(x[i] + width/2, tuned_aucs[i] + 0.002, f"{tuned_aucs[i]:.4f}", ha='center', va='bottom', fontsize=9, fontweight='bold')

    plt.tight_layout()
    plot_path = os.path.join(assets_dir, "hyperparameter_tuning_comparison.png")
    plt.savefig(plot_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"\nSaved visualization -> {plot_path}")
    print("Phase 9 Hyperparameter Tuning complete.")

if __name__ == "__main__":
    main()
