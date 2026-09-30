"""
SIMS Explainable ML Early-Warning Intelligence Package.

Provides local, reproducible early-warning predictions with SHAP feature attributions
and institutional hybrid safeguards.
"""

from intelligence.app.ml.dataset import (
    generate_synthetic_dataset,
    ML_NUMERIC_FEATURES,
    ML_CATEGORICAL_FEATURES,
    ALL_FEATURE_COLUMNS,
    TARGET_COLUMN,
)
from intelligence.app.ml.preprocessing import MLPreprocessor
from intelligence.app.ml.model import train_early_warning_model
from intelligence.app.ml.predictor import RiskPredictor, RiskPredictionResult
from intelligence.app.ml.explainer import SHAPExplainer
from intelligence.app.ml.service import (
    predict_progress_risk,
    explain_progress_risk,
    evaluate_hybrid_attention,
    get_predictor,
    get_explainer,
)

__all__ = [
    "generate_synthetic_dataset",
    "ML_NUMERIC_FEATURES",
    "ML_CATEGORICAL_FEATURES",
    "ALL_FEATURE_COLUMNS",
    "TARGET_COLUMN",
    "MLPreprocessor",
    "train_early_warning_model",
    "RiskPredictor",
    "RiskPredictionResult",
    "SHAPExplainer",
    "predict_progress_risk",
    "explain_progress_risk",
    "evaluate_hybrid_attention",
    "get_predictor",
    "get_explainer",
]
