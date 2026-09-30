"""
Inference Predictor for SIMS ML Early-Warning Intelligence.

Loads trained model artifact with graceful fallback if the artifact is missing or corrupted.
Computes risk probability [0.0, 1.0] and risk classification.
"""

from dataclasses import dataclass
import logging
from pathlib import Path
from typing import Any, Dict, Optional, Tuple, Union

import joblib
import numpy as np

from intelligence.app.features.progress_features import ProgressFeatures
from intelligence.app.ml.preprocessing import MLPreprocessor

logger = logging.getLogger("sims.ml.predictor")

ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
MODEL_FILENAME = "risk_model_v1.joblib"


@dataclass
class RiskPredictionResult:
    """Standard output schema for ML risk prediction."""
    risk_probability: Optional[float]
    risk_label: Optional[str]
    model_version: Optional[str]
    model_available: bool

    def to_dict(self) -> Dict[str, Any]:
        return {
            "risk_probability": self.risk_probability,
            "risk_label": self.risk_label,
            "model_version": self.model_version,
            "model_available": self.model_available,
        }


class RiskPredictor:
    """
    Thread-safe model loader and inference engine.
    """

    def __init__(self, artifact_path: Optional[Path] = None):
        self.artifact_path = artifact_path or (ARTIFACTS_DIR / MODEL_FILENAME)
        self.model = None
        self.preprocessor = None
        self.model_version: Optional[str] = None
        self.is_loaded = False
        self._load_model()

    def _load_model(self) -> None:
        """Attempts to load the joblib model artifact."""
        if not self.artifact_path.exists():
            logger.warning(
                f"ML model artifact not found at {self.artifact_path}. Graceful fallback to deterministic mode active."
            )
            self.is_loaded = False
            return

        try:
            payload = joblib.load(self.artifact_path)
            self.model = payload["model"]
            self.preprocessor = payload.get("preprocessor") or MLPreprocessor()
            self.model_version = payload.get("model_version", "synthetic-v1")
            self.is_loaded = True
            logger.info(f"Loaded ML Early-Warning model version {self.model_version}")
        except Exception as e:
            logger.error(f"Failed to load ML model artifact: {e}. Fallback active.")
            self.is_loaded = False
            self.model = None
            self.preprocessor = None

    def predict(
        self, features: Union[ProgressFeatures, Dict[str, Any]]
    ) -> RiskPredictionResult:
        """
        Runs ML risk prediction on student progress features.
        Returns RiskPredictionResult with probability, label, and availability.
        """
        if not self.is_loaded or self.model is None or self.preprocessor is None:
            return RiskPredictionResult(
                risk_probability=None,
                risk_label=None,
                model_version=None,
                model_available=False,
            )

        try:
            # Transform features preserving column names to eliminate sklearn feature name warnings
            if hasattr(self.preprocessor, "transform_single_df"):
                x_input = self.preprocessor.transform_single_df(features)
            else:
                x_vec = self.preprocessor.transform_single(features)
                x_input = x_vec.reshape(1, -1)

            # Predict probabilities [p(0), p(1)]
            prob_attention = float(self.model.predict_proba(x_input)[0][1])
            prob_clamped = max(0.0, min(1.0, round(prob_attention, 4)))

            risk_label = "ATTENTION_RISK" if prob_clamped >= 0.50 else "LOW_RISK"

            return RiskPredictionResult(
                risk_probability=prob_clamped,
                risk_label=risk_label,
                model_version=self.model_version,
                model_available=True,
            )
        except Exception as e:
            logger.error(f"Inference error during ML prediction: {e}. Falling back.")
            return RiskPredictionResult(
                risk_probability=None,
                risk_label=None,
                model_version=self.model_version,
                model_available=False,
            )
