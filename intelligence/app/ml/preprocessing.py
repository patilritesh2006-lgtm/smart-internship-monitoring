"""
Feature Preprocessing & Validation Pipeline for SIMS ML Early-Warning Intelligence.

Ensures strict parity between synthetic training data and live inference features.
Handles null values, validates numeric ranges, and encodes categorical trend states.
"""

from typing import Any, Dict, List, Optional, Union
import numpy as np
import pandas as pd

from intelligence.app.features.progress_features import ProgressFeatures, ProgressTrend


# Canonical feature ordering expected by ML models
NUMERIC_FEATURES = [
    "task_completion",
    "report_submission",
    "mentor_feedback",
    "task_velocity",
    "report_punctuality",
    "days_since_last_activity",
    "activity_consistency",
    "days_remaining",
]

CATEGORICAL_FEATURES = ["progress_trend"]

CATEGORICAL_TREND_VALUES = ["DECLINING", "IMPROVING", "INSUFFICIENT_DATA", "STABLE"]

# Default imputation values for missing / unobserved student states
IMPUTATION_DEFAULTS = {
    "mentor_feedback": 75.0,  # Neutral satisfactory default for unreviewed work
    "report_punctuality": 100.0,
    "days_since_last_activity": 14,
    "days_remaining": 30,
}

# Physical bounds for validation
NUMERIC_BOUNDS = {
    "task_completion": (0.0, 100.0),
    "report_submission": (0.0, 100.0),
    "mentor_feedback": (0.0, 100.0),
    "task_velocity": (0.0, 10.0),
    "report_punctuality": (0.0, 100.0),
    "days_since_last_activity": (0, 365),
    "activity_consistency": (0.0, 100.0),
    "days_remaining": (0, 365),
}


class SchemaParityError(ValueError):
    """Raised when training and inference schemas differ in column names, ordering, or encoding."""
    pass


class MLPreprocessor:
    """
    Stateful preprocessor for converting raw ProgressFeatures or DataFrames
    into model-ready numeric arrays.
    Guarantees strict schema parity between training and inference pipelines.
    """

    def __init__(self):
        self.numeric_features = NUMERIC_FEATURES
        self.trend_categories = CATEGORICAL_TREND_VALUES
        self.encoded_feature_names = self._build_feature_names()

    def _build_feature_names(self) -> List[str]:
        names = list(self.numeric_features)
        for cat in self.trend_categories:
            names.append(f"trend_{cat.lower()}")
        return names

    def get_feature_names(self) -> List[str]:
        return list(self.encoded_feature_names)

    def assert_schema_parity(self, df_or_cols: Union[pd.DataFrame, List[str]]) -> None:
        """
        Validates that a feature DataFrame or column list strictly matches the canonical schema.
        Raises SchemaParityError if column names, lengths, or ordering diverge.
        """
        if isinstance(df_or_cols, pd.DataFrame):
            actual_cols = list(df_or_cols.columns)
        else:
            actual_cols = list(df_or_cols)

        if actual_cols != self.encoded_feature_names:
            raise SchemaParityError(
                f"Feature schema mismatch!\n"
                f"Expected ({len(self.encoded_feature_names)}): {self.encoded_feature_names}\n"
                f"Actual   ({len(actual_cols)}): {actual_cols}"
            )

    def validate_numeric(self, name: str, val: Optional[Union[int, float]]) -> float:
        """Validates and clamps numeric feature to realistic bounds, applying imputation if None."""
        if val is None or (isinstance(val, float) and np.isnan(val)):
            return float(IMPUTATION_DEFAULTS.get(name, 0.0))

        min_val, max_val = NUMERIC_BOUNDS.get(name, (0.0, 100.0))
        clamped = max(float(min_val), min(float(max_val), float(val)))
        return clamped

    def transform_single(self, features: Union[ProgressFeatures, Dict[str, Any]]) -> np.ndarray:
        """
        Transforms a single student state (ProgressFeatures or dict) into a 1D numpy array of shape (n_features,).
        """
        df = self.transform_single_df(features)
        return df.to_numpy(dtype=np.float32)[0]

    def transform_single_df(self, features: Union[ProgressFeatures, Dict[str, Any]]) -> pd.DataFrame:
        """
        Transforms a single student state into a 1-row DataFrame preserving feature names.
        """
        if isinstance(features, ProgressFeatures):
            feat_dict = features.to_dict()
        else:
            feat_dict = dict(features)

        row_values: List[float] = []

        # 1. Process numeric features in canonical order
        for col in self.numeric_features:
            val = feat_dict.get(col)
            # Special case: report_punctuality defaults to report_submission if punctuality not tracked
            if col == "report_punctuality" and val is None:
                val = feat_dict.get("report_submission", 100.0)
            cleaned = self.validate_numeric(col, val)
            row_values.append(cleaned)

        # 2. One-hot encode progress_trend
        trend_raw = feat_dict.get("progress_trend", "INSUFFICIENT_DATA")
        if isinstance(trend_raw, ProgressTrend):
            trend_str = trend_raw.value
        else:
            trend_str = str(trend_raw).upper() if trend_raw else "INSUFFICIENT_DATA"

        for cat in self.trend_categories:
            row_values.append(1.0 if trend_str == cat else 0.0)

        result_df = pd.DataFrame([row_values], columns=self.encoded_feature_names)
        self.assert_schema_parity(result_df)
        return result_df

    def transform_df(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Transforms a DataFrame (e.g., from synthetic dataset generator)
        into a DataFrame with identical encoded columns and ordering.
        """
        processed_df = pd.DataFrame(index=df.index)

        # Numeric features with imputation and clamping
        for col in self.numeric_features:
            if col in df.columns:
                series = df[col].copy()
                impute_val = IMPUTATION_DEFAULTS.get(col, 0.0)
                series = series.fillna(impute_val)
                min_val, max_val = NUMERIC_BOUNDS.get(col, (0.0, 100.0))
                processed_df[col] = series.clip(min_val, max_val).astype(float)
            else:
                processed_df[col] = float(IMPUTATION_DEFAULTS.get(col, 0.0))

        # Categorical one-hot encoding
        trend_series = df["progress_trend"].astype(str).str.upper() if "progress_trend" in df.columns else pd.Series("INSUFFICIENT_DATA", index=df.index)
        for cat in self.trend_categories:
            processed_df[f"trend_{cat.lower()}"] = (trend_series == cat).astype(float)

        result_df = processed_df[self.encoded_feature_names]
        self.assert_schema_parity(result_df)
        return result_df
