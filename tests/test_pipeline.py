"""
Unit tests for the CrediFlux baseline ML pipeline.

Run with:
    python -m unittest discover -s tests
or:
    python -m pytest tests/
"""

import os
import sys
import unittest
import pandas as pd
import numpy as np

# Allow imports from the project root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

DATASET_PATH = os.path.join("data", "crediflux_50k.csv")
EXPECTED_ROWS = 50_000
EXPECTED_COLS = 151


class TestDataset(unittest.TestCase):
    """Validate the sampled 50 K dataset."""

    @classmethod
    def setUpClass(cls):
        if not os.path.exists(DATASET_PATH):
            raise unittest.SkipTest(
                f"Dataset not found at {DATASET_PATH}. "
                "Run notebooks/01_create_50k_dataset.ipynb first."
            )
        cls.df = pd.read_csv(DATASET_PATH, low_memory=False)

    def test_row_count(self):
        """Dataset must contain exactly 50 000 rows."""
        self.assertEqual(len(self.df), EXPECTED_ROWS,
                         f"Expected {EXPECTED_ROWS} rows, got {len(self.df)}")

    def test_column_count(self):
        """Dataset must retain 151 columns (same as raw source)."""
        self.assertEqual(self.df.shape[1], EXPECTED_COLS,
                         f"Expected {EXPECTED_COLS} columns, got {self.df.shape[1]}")

    def test_loan_status_present(self):
        """Target column loan_status must exist."""
        self.assertIn("loan_status", self.df.columns)

    def test_stratified_distribution(self):
        """
        Class distribution should match the expected stratified proportions
        within a tolerance of 0.1 percentage points.
        """
        expected = {
            "Fully Paid":   47.628,
            "Current":      38.852,
            "Charged Off":  11.880,
        }
        dist = (self.df["loan_status"].value_counts(normalize=True) * 100).to_dict()
        for label, expected_pct in expected.items():
            actual_pct = dist.get(label, 0.0)
            self.assertAlmostEqual(
                actual_pct, expected_pct, delta=0.1,
                msg=f"'{label}' distribution mismatch: {actual_pct:.3f}% vs expected {expected_pct:.3f}%"
            )


class TestBaselinePipeline(unittest.TestCase):
    """End-to-end smoke test for the Linear Regression baseline pipeline."""

    @classmethod
    def setUpClass(cls):
        if not os.path.exists(DATASET_PATH):
            raise unittest.SkipTest(
                f"Dataset not found at {DATASET_PATH}."
            )

        from sklearn.model_selection import train_test_split
        from sklearn.preprocessing import StandardScaler
        from sklearn.linear_model import LinearRegression
        from sklearn.metrics import mean_absolute_error, r2_score, accuracy_score

        df = pd.read_csv(DATASET_PATH, low_memory=False)
        resolved = df[df["loan_status"].isin(["Fully Paid", "Charged Off"])].copy()
        resolved["target"] = resolved["loan_status"].map({"Fully Paid": 0, "Charged Off": 1})

        features = [
            "loan_amnt", "annual_inc", "int_rate", "installment", "dti",
            "fico_range_low", "fico_range_high", "revol_bal", "revol_util",
            "open_acc", "total_acc", "delinq_2yrs",
        ]
        features = [f for f in features if f in resolved.columns]

        X = resolved[features]
        y = resolved["target"]

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        medians = X_train.median()
        X_train_imp = X_train.fillna(medians)
        X_test_imp  = X_test.fillna(medians)

        scaler = StandardScaler()
        X_train_sc = scaler.fit_transform(X_train_imp)
        X_test_sc  = scaler.transform(X_test_imp)

        model = LinearRegression()
        model.fit(X_train_sc, y_train)

        cls.y_pred  = model.predict(X_test_sc)
        cls.y_test  = y_test.values
        cls.mae     = mean_absolute_error(cls.y_test, cls.y_pred)
        cls.r2      = r2_score(cls.y_test, cls.y_pred)
        cls.acc     = accuracy_score(cls.y_test, (cls.y_pred >= 0.5).astype(int))

    def test_model_produces_predictions(self):
        """Model should produce a non-empty array of predictions."""
        self.assertGreater(len(self.y_pred), 0)

    def test_mae_reasonable(self):
        """MAE should be below 0.5 for a linear probability model on this dataset."""
        self.assertLess(self.mae, 0.5,
                        f"MAE too high: {self.mae:.4f}")

    def test_r2_non_negative(self):
        """R² should be non-negative (model beats constant-mean baseline)."""
        self.assertGreaterEqual(self.r2, 0,
                                f"R2 is negative: {self.r2:.4f}")

    def test_accuracy_above_chance(self):
        """Accuracy should be above 50%."""
        self.assertGreater(self.acc, 0.50,
                           f"Accuracy below chance: {self.acc:.4f}")

    def test_predictions_in_range(self):
        """Most continuous predictions should lie in [-0.5, 1.5]."""
        in_range = np.sum((self.y_pred >= -0.5) & (self.y_pred <= 1.5))
        ratio = in_range / len(self.y_pred)
        self.assertGreater(ratio, 0.95,
                           f"Too many predictions outside [-0.5, 1.5]: {ratio:.2%}")


if __name__ == "__main__":
    unittest.main()
