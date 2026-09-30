"""
Explainability & Feature Attribution Layer for SIMS ML Early-Warning Intelligence.

Computes local feature attributions using SHAP TreeExplainer and translates raw
mathematical attributions into human-interpretable institutional explanations.
"""

import logging
from typing import Any, Dict, List, Optional, Union
import numpy as np

import shap

from intelligence.app.features.progress_features import ProgressFeatures
from intelligence.app.ml.preprocessing import MLPreprocessor

logger = logging.getLogger("sims.ml.explainer")


# Institutional labels and descriptions for ML features
FEATURE_METADATA: Dict[str, Dict[str, str]] = {
    "task_completion": {
        "label": "Task Completion",
        "unit": "%",
        "description": "Percentage of assigned milestone tasks completed to date.",
    },
    "report_submission": {
        "label": "Report Submission",
        "unit": "%",
        "description": "Percentage of expected weekly progress reports submitted.",
    },
    "mentor_feedback": {
        "label": "Mentor Evaluation",
        "unit": "/100",
        "description": "Average supervisor score across evaluated milestone submissions.",
    },
    "task_velocity": {
        "label": "Milestone Velocity",
        "unit": "tasks/wk",
        "description": "Average milestone tasks completed per elapsed internship week.",
    },
    "report_punctuality": {
        "label": "Report Punctuality",
        "unit": "%",
        "description": "Percentage of reports submitted on or before deadline.",
    },
    "days_since_last_activity": {
        "label": "Days Since Last Activity",
        "unit": "days",
        "description": "Calendar days elapsed since the student's last recorded action.",
    },
    "activity_consistency": {
        "label": "Cadence Consistency",
        "unit": "%",
        "description": "Temporal regularity of submissions and milestone completions.",
    },
    "days_remaining": {
        "label": "Days Remaining",
        "unit": "days",
        "description": "Scheduled days remaining until internship completion.",
    },
    "trend_declining": {
        "label": "Declining Trend",
        "unit": "",
        "description": "Recent performance indicators show a negative downward trajectory.",
    },
    "trend_improving": {
        "label": "Improving Trend",
        "unit": "",
        "description": "Recent performance indicators show an upward positive trajectory.",
    },
    "trend_stable": {
        "label": "Stable Trend",
        "unit": "",
        "description": "Progress velocity and reporting cadence remain steady.",
    },
    "trend_insufficient_data": {
        "label": "Insufficient Trend History",
        "unit": "",
        "description": "Insufficient elapsed weeks to evaluate trajectory.",
    },
}


class SHAPExplainer:
    """
    SHAP-based local explainer for tree models in SIMS.
    Translates raw SHAP tensors into structured top-risk/protective factors.
    """

    def __init__(self, model: Any, preprocessor: Optional[MLPreprocessor] = None):
        self.model = model
        self.preprocessor = preprocessor or MLPreprocessor()
        self.feature_names = self.preprocessor.get_feature_names()
        self.tree_explainer: Optional[shap.TreeExplainer] = None

        if self.model is not None:
            try:
                self.tree_explainer = shap.TreeExplainer(self.model)
                logger.info("Initialized SHAP TreeExplainer for early-warning model.")
            except Exception as e:
                logger.warning(f"Could not initialize SHAP TreeExplainer: {e}")
                self.tree_explainer = None

    def is_available(self) -> bool:
        return self.tree_explainer is not None

    def explain_prediction(
        self,
        features: Union[ProgressFeatures, Dict[str, Any]],
        top_k: int = 4,
    ) -> List[Dict[str, Any]]:
        """
        Computes the most influential features contributing to the student's risk score.

        Returns a list of structured factor explanations:
        [
            {
                "feature": "report_submission",
                "label": "Report Submission",
                "impact": "HIGH",
                "direction": "RISK",
                "value": 42.0,
                "unit": "%",
                "description": "..."
            },
            ...
        ]
        """
        if not self.is_available():
            return []

        try:
            # 1. Transform single feature row into input format
            if hasattr(self.preprocessor, "transform_single_df"):
                x_input = self.preprocessor.transform_single_df(features)
            else:
                x_vec = self.preprocessor.transform_single(features)
                x_input = x_vec.reshape(1, -1)

            # 2. Compute SHAP values
            shap_raw = self.tree_explainer.shap_values(x_input)

            # Extract SHAP values for class 1 (ATTENTION_RISK)
            # Depending on SHAP version, shap_values may be ndarray (1, n_feat, 2) or list of [c0, c1]
            if isinstance(shap_raw, list):
                # Binary classification list: [class_0_shap, class_1_shap]
                class_1_shap = shap_raw[1][0]
            elif isinstance(shap_raw, np.ndarray):
                if len(shap_raw.shape) == 3 and shap_raw.shape[2] == 2:
                    class_1_shap = shap_raw[0, :, 1]
                else:
                    class_1_shap = shap_raw[0]
            else:
                return []

            # 3. Associate each feature name with its SHAP attribution and student value
            raw_dict = features.to_dict() if isinstance(features, ProgressFeatures) else features
            factors: List[Dict[str, Any]] = []

            for idx, feat_name in enumerate(self.feature_names):
                sv = float(class_1_shap[idx])
                abs_sv = abs(sv)

                # Skip completely negligible attributions
                if abs_sv < 0.005:
                    continue

                meta = FEATURE_METADATA.get(feat_name, {
                    "label": feat_name.replace("_", " ").title(),
                    "unit": "",
                    "description": "",
                })

                # Direction: Positive SHAP pushes towards ATTENTION_RISK; Negative pulls towards LOW_RISK
                direction = "RISK" if sv > 0 else "PROTECTIVE"

                # Impact tier based on absolute magnitude
                if abs_sv >= 0.09:
                    impact = "HIGH"
                elif abs_sv >= 0.035:
                    impact = "MEDIUM"
                else:
                    impact = "LOW"

                # Determine the student's actual value for this feature
                if feat_name.startswith("trend_"):
                    # For one-hot trend features, report the categorical string
                    trend_val = raw_dict.get("progress_trend")
                    val_display = str(trend_val.value if hasattr(trend_val, "value") else trend_val)
                else:
                    raw_val = raw_dict.get(feat_name)
                    val_display = round(float(raw_val), 1) if raw_val is not None else None

                factors.append({
                    "feature": feat_name,
                    "label": meta["label"],
                    "impact": impact,
                    "direction": direction,
                    "value": val_display,
                    "unit": meta["unit"],
                    "attribution_weight": round(sv, 4),
                    "description": meta["description"],
                })

            # Sort factors by impact magnitude (highest absolute SHAP attribution first)
            factors.sort(key=lambda item: abs(item["attribution_weight"]), reverse=True)

            # Return top_k most influential factors
            return factors[:top_k]

        except Exception as e:
            logger.error(f"Error computing SHAP explanations: {e}")
            return []
