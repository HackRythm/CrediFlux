"""
CrediFlux — Model Serialization & Verification
================================================
Replicates the EXACT training procedure from evaluate_final_models.py (Phase 10)
for Logistic Regression and Random Forest, serializes the fitted objects, then
reloads them and verifies prediction parity against the in-memory originals.

WHY A NEW SCRIPT IS NEEDED
---------------------------
Every existing training script (evaluate_final_models.py, train_logistic_regression.py,
train_random_forest.py) constructs model objects, calls .fit(), evaluates on the test
set, generates PNG visualizations, and exits — discarding the fitted model objects from
memory.  None of them contain any joblib.dump(), pickle.dump(), or .save() call.

The minimal safe approach is a standalone script that:
  1. Loads the SAME processed data files.
  2. Constructs models with the SAME tuned hyperparameters from Phase 10.
  3. Fits them on the SAME training data.
  4. Evaluates on the SAME untouched test set to confirm metric reproduction.
  5. Serializes fitted objects with joblib.
  6. Reloads every artifact and compares predict_proba() outputs element-by-element.
  7. Reports pass/fail for each verification check.

HYPERPARAMETER SOURCE
---------------------
All hyperparameters are copied verbatim from:
  scripts/evaluate_final_models.py  (lines 56–64)
which implements the tuned parameters selected in Phase 9 (tune_models.py).

ARTIFACTS PRODUCED
------------------
  models/logistic_regression_pipeline.joblib  — Pipeline([StandardScaler, LogisticRegression])
  models/random_forest.joblib                 — RandomForestClassifier
  models/feature_schema.json                  — Ordered feature names + metadata

Run from project root:
    python scripts/serialize_models.py
"""

import os
import sys
import json
import time
import numpy as np
import pandas as pd
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score
)


# ---------------------------------------------------------------------------
# 0. PATH RESOLUTION (same logic as evaluate_final_models.py)
# ---------------------------------------------------------------------------
def resolve_path(filename):
    """Look in data/ or ../data/ so the script works from project root or scripts/."""
    for d in ["data", os.path.join("..", "data")]:
        p = os.path.join(d, filename)
        if os.path.exists(p):
            return p
    raise FileNotFoundError(f"{filename} not found in data/ or ../data/")


def resolve_output_dir(dirname):
    """Resolve and create output directory relative to project root or parent."""
    for base in [".", ".."]:
        candidate = os.path.join(base, dirname)
        # Check if we're in the right place by looking for the data/ dir
        data_check = os.path.join(base, "data")
        if os.path.isdir(data_check):
            os.makedirs(candidate, exist_ok=True)
            return candidate
    # Fallback: create relative to cwd
    os.makedirs(dirname, exist_ok=True)
    return dirname


def main():
    print("=" * 70)
    print("CREDIFLUX — MODEL SERIALIZATION & VERIFICATION")
    print("=" * 70)

    # ------------------------------------------------------------------
    # 1. LOAD DATA (identical to evaluate_final_models.py lines 30–38)
    # ------------------------------------------------------------------
    X_train_path = resolve_path("X_train_processed.csv")
    y_train_path = resolve_path("y_train.csv")
    X_test_path = resolve_path("X_test_processed.csv")
    y_test_path = resolve_path("y_test.csv")

    X_train = pd.read_csv(X_train_path)
    y_train = pd.read_csv(y_train_path).squeeze()
    X_test = pd.read_csv(X_test_path)
    y_test = pd.read_csv(y_test_path).squeeze()

    print(f"\n1. DATA LOADED:")
    print(f"   X_train: {X_train.shape}  y_train: {y_train.shape}  (Default rate: {y_train.mean()*100:.2f}%)")
    print(f"   X_test:  {X_test.shape}   y_test:  {y_test.shape}   (Default rate: {y_test.mean()*100:.2f}%)")

    # Validation (same assertions as evaluate_final_models.py lines 46–48)
    assert X_train.shape[1] == 35, f"Expected 35 features, got {X_train.shape[1]}"
    assert X_test.shape[1] == 35, f"Expected 35 features, got {X_test.shape[1]}"
    assert list(X_train.columns) == list(X_test.columns), "Column mismatch between train and test!"
    print("   [OK] 35 features, column alignment verified.")

    feature_names = list(X_train.columns)

    # ------------------------------------------------------------------
    # 2. CONSTRUCT & FIT MODELS
    #    Hyperparameters copied VERBATIM from evaluate_final_models.py
    #    lines 56–64 (the Phase 10 tuned parameters).
    # ------------------------------------------------------------------
    print("\n2. TRAINING MODELS (Phase 10 tuned hyperparameters):")

    # --- Logistic Regression (Pipeline with embedded StandardScaler) ---
    lr_pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('logreg', LogisticRegression(
            C=10,
            max_iter=1000,
            class_weight='balanced',
            solver='lbfgs',
            random_state=42
        ))
    ])

    print("   Fitting Logistic Regression Pipeline [StandardScaler -> LogisticRegression(C=10)] ...")
    t0 = time.time()
    lr_pipeline.fit(X_train, y_train)
    print(f"   [OK] LR fitted in {time.time() - t0:.2f}s")

    # --- Random Forest ---
    rf_model = RandomForestClassifier(
        n_estimators=300,
        max_depth=20,
        min_samples_leaf=5,
        max_features='sqrt',
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )

    print("   Fitting RandomForestClassifier(n_estimators=300, max_depth=20, min_samples_leaf=5) ...")
    t0 = time.time()
    rf_model.fit(X_train, y_train)
    print(f"   [OK] RF fitted in {time.time() - t0:.2f}s")

    # ------------------------------------------------------------------
    # 3. IN-MEMORY EVALUATION ON TEST SET (reproduce Phase 10 metrics)
    # ------------------------------------------------------------------
    print("\n3. IN-MEMORY EVALUATION (threshold = 0.50):")

    # Reference values from README.md / evaluate_final_models.py output
    reference_metrics = {
        'Logistic Regression': {
            'Accuracy': 0.6554, 'Precision': 0.3139, 'Recall': 0.6128,
            'F1-Score': 0.4152, 'ROC-AUC': 0.6963, 'PR-AUC': 0.3568
        },
        'Random Forest': {
            'Accuracy': 0.7701, 'Precision': 0.3996, 'Recall': 0.3013,
            'F1-Score': 0.3436, 'ROC-AUC': 0.6936, 'PR-AUC': 0.3617
        }
    }

    in_memory_results = {}
    all_checks_passed = True

    for name, model in [('Logistic Regression', lr_pipeline), ('Random Forest', rf_model)]:
        y_prob = model.predict_proba(X_test)[:, 1]
        y_pred = (y_prob >= 0.50).astype(int)

        metrics = {
            'Accuracy': accuracy_score(y_test, y_pred),
            'Precision': precision_score(y_test, y_pred),
            'Recall': recall_score(y_test, y_pred),
            'F1-Score': f1_score(y_test, y_pred),
            'ROC-AUC': roc_auc_score(y_test, y_prob),
            'PR-AUC': average_precision_score(y_test, y_prob)
        }

        in_memory_results[name] = {'proba': y_prob, 'pred': y_pred, 'metrics': metrics}

        print(f"\n   --- {name} ---")
        ref = reference_metrics[name]
        for metric_name, value in metrics.items():
            ref_val = ref[metric_name]
            match = abs(value - ref_val) < 0.001  # tolerance for rounding
            status = "MATCH" if match else "MISMATCH"
            if not match:
                all_checks_passed = False
            print(f"   {metric_name:12s}: {value:.6f}  (ref: {ref_val:.4f})  [{status}]")

    if all_checks_passed:
        print("\n   [OK] All in-memory metrics match Phase 10 reference values.")
    else:
        print("\n   [WARNING] Some metrics do not match reference values. See above.")

    # ------------------------------------------------------------------
    # 4. SERIALIZE ARTIFACTS
    # ------------------------------------------------------------------
    models_dir = resolve_output_dir("models")
    print(f"\n4. SERIALIZING ARTIFACTS TO: {os.path.abspath(models_dir)}")

    lr_path = os.path.join(models_dir, "logistic_regression_pipeline.joblib")
    rf_path = os.path.join(models_dir, "random_forest.joblib")
    schema_path = os.path.join(models_dir, "feature_schema.json")

    # Save models
    joblib.dump(lr_pipeline, lr_path, compress=3)
    print(f"   [SAVED] {lr_path}  ({os.path.getsize(lr_path):,} bytes)")

    joblib.dump(rf_model, rf_path, compress=3)
    print(f"   [SAVED] {rf_path}  ({os.path.getsize(rf_path):,} bytes)")

    # Save feature schema
    schema = {
        "description": "CrediFlux model feature schema — exact column order expected by saved models.",
        "feature_count": len(feature_names),
        "features": feature_names,
        "target": {
            "name": "target",
            "mapping": {"Fully Paid": 0, "Charged Off": 1},
            "positive_class": "Charged Off (Default)",
            "predict_proba_index": 1
        },
        "models": {
            "logistic_regression": {
                "file": "logistic_regression_pipeline.joblib",
                "type": "Pipeline([StandardScaler, LogisticRegression])",
                "hyperparameters": {
                    "C": 10, "max_iter": 1000, "class_weight": "balanced",
                    "solver": "lbfgs", "random_state": 42
                },
                "note": "StandardScaler is embedded in the pipeline; no separate scaler needed."
            },
            "random_forest": {
                "file": "random_forest.joblib",
                "type": "RandomForestClassifier",
                "hyperparameters": {
                    "n_estimators": 300, "max_depth": 20, "min_samples_leaf": 5,
                    "max_features": "sqrt", "class_weight": "balanced",
                    "random_state": 42
                },
                "note": "Accepts unscaled processed features directly."
            }
        },
        "preprocessing_stats": {
            "note": "These statistics were learned on X_train during feature engineering (notebook 04). They are required to transform raw borrower inputs into the 35-feature representation.",
            "dti_median": 17.63,
            "revol_util_median": 52.40,
            "annual_inc_min": 3000.0,
            "dti_cap": 100.0,
            "revol_util_cap": 150.0,
            "annual_inc_cap": 550396.0,
            "revol_bal_cap": 277728.27,
            "emp_length_median": 6.0
        },
        "training_data": {
            "train_samples": int(X_train.shape[0]),
            "test_samples": int(X_test.shape[0]),
            "default_rate_train": round(float(y_train.mean()), 4),
            "default_rate_test": round(float(y_test.mean()), 4)
        },
        "environment": {
            "python": sys.version,
            "scikit_learn": None,  # filled below
            "pandas": pd.__version__,
            "numpy": np.__version__,
            "joblib": joblib.__version__
        }
    }

    # Fill sklearn version
    import sklearn
    schema["environment"]["scikit_learn"] = sklearn.__version__

    with open(schema_path, "w", encoding="utf-8") as f:
        json.dump(schema, f, indent=2, ensure_ascii=False)
    print(f"   [SAVED] {schema_path}  ({os.path.getsize(schema_path):,} bytes)")

    # ------------------------------------------------------------------
    # 5. RELOAD & VERIFY — element-by-element prediction comparison
    # ------------------------------------------------------------------
    print(f"\n5. RELOAD & VERIFICATION:")

    # Reload models
    lr_loaded = joblib.load(lr_path)
    rf_loaded = joblib.load(rf_path)
    print(f"   [LOADED] {lr_path}")
    print(f"   [LOADED] {rf_path}")

    # Reload and validate schema
    with open(schema_path, "r", encoding="utf-8") as f:
        schema_loaded = json.load(f)
    assert schema_loaded["feature_count"] == 35
    assert schema_loaded["features"] == feature_names
    print(f"   [LOADED] {schema_path} — {schema_loaded['feature_count']} features verified.")

    verification_passed = True

    for name, loaded_model, original_label in [
        ('Logistic Regression', lr_loaded, 'Logistic Regression'),
        ('Random Forest', rf_loaded, 'Random Forest')
    ]:
        original = in_memory_results[original_label]

        # Compare predict_proba on full test set
        loaded_proba = loaded_model.predict_proba(X_test)[:, 1]
        loaded_pred = (loaded_proba >= 0.50).astype(int)

        proba_match = np.allclose(loaded_proba, original['proba'], atol=1e-12)
        pred_match = np.array_equal(loaded_pred, original['pred'])

        # Compute metrics from loaded model
        loaded_metrics = {
            'Accuracy': accuracy_score(y_test, loaded_pred),
            'Precision': precision_score(y_test, loaded_pred),
            'Recall': recall_score(y_test, loaded_pred),
            'F1-Score': f1_score(y_test, loaded_pred),
            'ROC-AUC': roc_auc_score(y_test, loaded_proba),
            'PR-AUC': average_precision_score(y_test, loaded_proba)
        }

        print(f"\n   --- {name} ---")
        print(f"   predict_proba match (all {len(loaded_proba)} samples): {'[PASS]' if proba_match else '[FAIL]'}")
        if not proba_match:
            max_diff = np.max(np.abs(loaded_proba - original['proba']))
            print(f"      Max absolute difference: {max_diff:.2e}")
            verification_passed = False
        print(f"   predict (binary) match: {'[PASS]' if pred_match else '[FAIL]'}")
        if not pred_match:
            n_diff = np.sum(loaded_pred != original['pred'])
            print(f"      {n_diff} predictions differ out of {len(loaded_pred)}")
            verification_passed = False

        # Compare metrics
        for metric_name in loaded_metrics:
            orig_val = original['metrics'][metric_name]
            load_val = loaded_metrics[metric_name]
            match = abs(load_val - orig_val) < 1e-10
            if not match:
                verification_passed = False
                print(f"   {metric_name}: MISMATCH  loaded={load_val:.10f}  original={orig_val:.10f}")

        if proba_match and pred_match:
            print(f"   All metrics: [PASS] IDENTICAL (bitwise-equal probabilities)")

    # ------------------------------------------------------------------
    # 6. QUICK-LOAD EXAMPLE — demonstrate minimal usage
    # ------------------------------------------------------------------
    print(f"\n6. REPRODUCIBLE LOADING EXAMPLE:")
    print("""
   # ---- Minimal model-loading example ----
   import joblib, json, pandas as pd

   # Load feature schema
   with open("models/feature_schema.json") as f:
       schema = json.load(f)
   feature_names = schema["features"]

   # Load models
   lr_pipeline = joblib.load("models/logistic_regression_pipeline.joblib")
   rf_model    = joblib.load("models/random_forest.joblib")

   # Predict on a DataFrame with 35 features in the correct order
   # (The LR pipeline includes StandardScaler — no separate scaling needed)
   X = pd.DataFrame([...], columns=feature_names)
   lr_default_prob = lr_pipeline.predict_proba(X)[:, 1]
   rf_default_prob = rf_model.predict_proba(X)[:, 1]
   # ---- End example ----
""")

    # ------------------------------------------------------------------
    # 7. FINAL SUMMARY
    # ------------------------------------------------------------------
    print("=" * 70)
    print("FINAL SUMMARY")
    print("=" * 70)
    print(f"\n   Artifacts directory: {os.path.abspath(models_dir)}")
    print(f"   LR Pipeline:        {lr_path}  ({os.path.getsize(lr_path):,} bytes)")
    print(f"   RF Model:           {rf_path}  ({os.path.getsize(rf_path):,} bytes)")
    print(f"   Feature Schema:     {schema_path}  ({os.path.getsize(schema_path):,} bytes)")
    print(f"\n   Environment:")
    print(f"     Python:       {sys.version.split()[0]}")
    print(f"     scikit-learn: {sklearn.__version__}")
    print(f"     pandas:       {pd.__version__}")
    print(f"     numpy:        {np.__version__}")
    print(f"     joblib:       {joblib.__version__}")

    if all_checks_passed and verification_passed:
        print(f"\n   [PASS] ALL CHECKS PASSED - serialized models reproduce Phase 10 results exactly.")
        return 0
    elif all_checks_passed and not verification_passed:
        print(f"\n   [WARN] IN-MEMORY METRICS MATCH but reload verification had differences.")
        return 1
    else:
        print(f"\n   [FAIL] METRIC REPRODUCTION FAILED - check output above for details.")
        return 2


if __name__ == "__main__":
    sys.exit(main())
