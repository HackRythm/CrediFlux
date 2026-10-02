import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, confusion_matrix,
    roc_curve, precision_recall_curve
)

def resolve_path(filename):
    for d in ["data", os.path.join("..", "data")]:
        p = os.path.join(d, filename)
        if os.path.exists(p):
            return p
    raise FileNotFoundError(f"{filename} not found in data/ or ../data/")

def main():
    print("==================================================")
    print("CREDIFLUX - PHASE 10: FINAL UNTOUCHED TEST SET EVALUATION")
    print("==================================================")

    # 1. Load Data
    X_train_path = resolve_path("X_train_processed.csv")
    y_train_path = resolve_path("y_train.csv")
    X_test_path = resolve_path("X_test_processed.csv")
    y_test_path = resolve_path("y_test.csv")

    X_train = pd.read_csv(X_train_path)
    y_train = pd.read_csv(y_train_path).squeeze()
    X_test = pd.read_csv(X_test_path)
    y_test = pd.read_csv(y_test_path).squeeze()

    print(f"\n1. DATASET VALIDATION:")
    print(f"   Training features X_train: {X_train.shape}")
    print(f"   Training target   y_train: {y_train.shape} (Default rate: {y_train.mean()*100:.2f}%)")
    print(f"   Test features     X_test:  {X_test.shape}")
    print(f"   Test target       y_test:  {y_test.shape} (Default rate: {y_test.mean()*100:.2f}%)")

    assert X_train.shape[1] == 35, f"Expected 35 features, got {X_train.shape[1]}"
    assert X_test.shape[1] == 35, f"Expected 35 features, got {X_test.shape[1]}"
    assert list(X_train.columns) == list(X_test.columns), "Train and Test column names or order do not match!"
    print("   [OK] Dataset validation passed: 35 features, column alignment verified, untouched test set ready.")

    # 2. Define Best Tuned Models
    neg_cnt = (y_train == 0).sum()
    pos_cnt = (y_train == 1).sum()
    spw = neg_cnt / pos_cnt

    models = {
        'Logistic Regression': Pipeline([
            ('scaler', StandardScaler()),
            ('logreg', LogisticRegression(C=10, max_iter=1000, class_weight='balanced', solver='lbfgs', random_state=42))
        ]),
        'Random Forest': RandomForestClassifier(
            n_estimators=300, max_depth=20, min_samples_leaf=5,
            max_features='sqrt', class_weight='balanced', random_state=42, n_jobs=-1
        ),
        'XGBoost': XGBClassifier(
            n_estimators=200, max_depth=3, learning_rate=0.05,
            subsample=0.8, scale_pos_weight=spw, colsample_bytree=0.8,
            eval_metric='logloss', random_state=42, n_jobs=-1
        )
    }

    # 3. Train Models and Evaluate on Test Set
    results = []
    test_predictions = {}
    
    assets_dir = "assets" if os.path.exists("assets") else os.path.join("..", "assets")
    os.makedirs(assets_dir, exist_ok=True)
    sns.set_theme(style="whitegrid", palette="muted")

    print("\n2. TRAINING FINAL MODELS & PREDICTING ON UNTOUCHED TEST SET:")
    for name, model in models.items():
        print(f"   Fitting {name} on full training set...")
        model.fit(X_train, y_train)
        
        y_prob = model.predict_proba(X_test)[:, 1]
        y_pred = (y_prob >= 0.50).astype(int)
        
        test_predictions[name] = {'prob': y_prob, 'pred': y_pred}

        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred)
        rec = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        roc_auc = roc_auc_score(y_test, y_prob)
        pr_auc = average_precision_score(y_test, y_prob)

        results.append({
            'Model': name,
            'Accuracy': acc,
            'Precision (0.50)': prec,
            'Recall (0.50)': rec,
            'F1-Score (0.50)': f1,
            'ROC-AUC': roc_auc,
            'PR-AUC': pr_auc
        })

        # Save individual confusion matrix
        cm = confusion_matrix(y_test, y_pred)
        plt.figure(figsize=(6, 5))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False,
                    xticklabels=['Fully Paid (0)', 'Charged Off (1)'],
                    yticklabels=['Fully Paid (0)', 'Charged Off (1)'])
        plt.title(f'Final Test Confusion Matrix - {name}', fontsize=12, fontweight='bold', pad=12)
        plt.xlabel('Predicted Label', fontsize=10)
        plt.ylabel('True Label', fontsize=10)
        plt.tight_layout()
        
        fname_map = {
            'Logistic Regression': 'final_logreg_confusion_matrix.png',
            'Random Forest': 'final_rf_confusion_matrix.png',
            'XGBoost': 'final_xgb_confusion_matrix.png'
        }
        cm_path = os.path.join(assets_dir, fname_map[name])
        plt.savefig(cm_path, dpi=150, bbox_inches='tight')
        plt.close()
        print(f"   [OK] Saved Confusion Matrix -> {cm_path}")

    # 4. Results Summary Table
    df_results = pd.DataFrame(results)
    print("\n" + "="*90)
    print("FINAL TEST SET EVALUATION METRICS SUMMARY (Threshold = 0.50)")
    print("="*90)
    print(df_results.to_string(index=False, float_format=lambda x: f"{x:.4f}"))

    # 5. Generate Final Model Comparison Plot
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    # Bar chart of ROC-AUC and PR-AUC
    x = np.arange(len(df_results))
    width = 0.35

    axes[0].bar(x - width/2, df_results['ROC-AUC'], width, label='ROC-AUC', color='#1f77b4', edgecolor='black')
    axes[0].bar(x + width/2, df_results['PR-AUC'], width, label='PR-AUC', color='#ff7f0e', edgecolor='black')
    axes[0].set_ylabel('Score', fontsize=11)
    axes[0].set_title('Final Test Performance: ROC-AUC vs PR-AUC', fontsize=12, fontweight='bold', pad=12)
    axes[0].set_xticks(x)
    axes[0].set_xticklabels(df_results['Model'], fontsize=10)
    axes[0].set_ylim(0.2, 0.8)
    axes[0].legend(fontsize=10)

    for i in range(len(df_results)):
        axes[0].text(x[i] - width/2, df_results['ROC-AUC'].iloc[i] + 0.01, f"{df_results['ROC-AUC'].iloc[i]:.4f}", ha='center', va='bottom', fontsize=9)
        axes[0].text(x[i] + width/2, df_results['PR-AUC'].iloc[i] + 0.01, f"{df_results['PR-AUC'].iloc[i]:.4f}", ha='center', va='bottom', fontsize=9, fontweight='bold')

    # ROC Curves side by side
    colors = {'Logistic Regression': '#2ca02c', 'Random Forest': '#d62728', 'XGBoost': '#9467bd'}
    for name in models.keys():
        fpr, tpr, _ = roc_curve(y_test, test_predictions[name]['prob'])
        auc_val = roc_auc_score(y_test, test_predictions[name]['prob'])
        axes[1].plot(fpr, tpr, label=f"{name} (AUC = {auc_val:.4f})", color=colors[name], linewidth=2)

    axes[1].plot([0, 1], [0, 1], 'k--', label='Random Chance (AUC = 0.5000)')
    axes[1].set_xlabel('False Positive Rate', fontsize=10)
    axes[1].set_ylabel('True Positive Rate', fontsize=10)
    axes[1].set_title('Final Test Set ROC Curves', fontsize=12, fontweight='bold', pad=12)
    axes[1].legend(fontsize=10, loc='lower right')

    plt.tight_layout()
    comp_path = os.path.join(assets_dir, "final_model_comparison.png")
    plt.savefig(comp_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"\nSaved Combined Model Comparison Plot -> {comp_path}")
    print("\nPhase 10 Final Model Evaluation Complete.")

if __name__ == "__main__":
    main()
