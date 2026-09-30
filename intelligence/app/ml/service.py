"""
Early-Warning Intelligence Service & Hybrid Decision Layer.

Orchestrates:
1. Deterministic Progress Health (from ProgressAttentionEngine)
2. ML Risk Probability & Classification (from RiskPredictor)
3. Explainable Feature Attribution (from SHAPExplainer)
4. Institutional Guardrails & Fallbacks (e.g., severe inactivity override)
"""

import logging
from typing import Any, Dict, List, Optional, Union

from intelligence.app.features.progress_features import ProgressFeatures
from intelligence.app.models import AttentionStatus, ProgressAttentionEngineResult
from intelligence.app.progress_analysis import ProgressAttentionEngine
from intelligence.app.ml.explainer import SHAPExplainer
from intelligence.app.ml.predictor import RiskPredictor

logger = logging.getLogger("sims.ml.service")

_PREDICTOR_INSTANCE: Optional[RiskPredictor] = None
_EXPLAINER_INSTANCE: Optional[SHAPExplainer] = None


def get_predictor() -> RiskPredictor:
    """Returns singleton RiskPredictor instance."""
    global _PREDICTOR_INSTANCE
    if _PREDICTOR_INSTANCE is None:
        _PREDICTOR_INSTANCE = RiskPredictor()
    return _PREDICTOR_INSTANCE


def get_explainer() -> SHAPExplainer:
    """Returns singleton SHAPExplainer instance."""
    global _EXPLAINER_INSTANCE
    if _EXPLAINER_INSTANCE is None:
        predictor = get_predictor()
        _EXPLAINER_INSTANCE = SHAPExplainer(predictor.model, predictor.preprocessor)
    return _EXPLAINER_INSTANCE


def predict_progress_risk(
    features: Union[ProgressFeatures, Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Public prediction API: predicts whether student requires early intervention.

    Returns:
      {
        "risk_probability": 0.78,
        "risk_label": "ATTENTION_RISK",
        "model_version": "synthetic-v1.1",
        "model_available": true
      }
    """
    predictor = get_predictor()
    res = predictor.predict(features)
    return res.to_dict()


def explain_progress_risk(
    features: Union[ProgressFeatures, Dict[str, Any]],
    top_k: int = 4,
) -> List[Dict[str, Any]]:
    """
    Computes top influential feature attributions using SHAP.
    Returns institutional explanation objects.
    """
    explainer = get_explainer()
    return explainer.explain_prediction(features, top_k=top_k)


def evaluate_hybrid_attention(
    features: ProgressFeatures,
) -> Dict[str, Any]:
    """
    Hybrid Decision Policy:
    Combines deterministic institutional evaluation with predictive ML early-warning signals.

    Institutional Rules & Invariants:
    1. Deterministic Engine is Ground Truth for completed work:
       Task completion, report submission, and mentor evaluation form the baseline health score.
    2. Severe Inactivity Safety Override:
       If days_since_last_activity > 21, student MUST receive attention/monitoring,
       regardless of how favorable the ML probability is.
    3. Early-Warning ML Escalation:
       If deterministic status is ON_TRACK but ML risk probability is high (>= 0.65),
       flag as predicted early risk so faculty can intervene before deadlines are missed.
    4. Graceful Fallback:
       If ML model artifact is missing or corrupted, transparently return deterministic results
       with model_available=False.
    5. Insufficient Data Caution:
       If student has less than 2 weeks of history, avoid false confidence.
    """
    # 1. Deterministic Progress Health (always computed)
    det_result: ProgressAttentionEngineResult = ProgressAttentionEngine.evaluate(features)

    # 2. Predictive ML Early-Warning Risk
    ml_prediction = predict_progress_risk(features)
    model_available = ml_prediction.get("model_available", False)
    risk_prob = ml_prediction.get("risk_probability")
    risk_label = ml_prediction.get("risk_label")
    model_version = ml_prediction.get("model_version")

    # 3. SHAP Explanations (only when model is available)
    top_factors: List[Dict[str, Any]] = []
    if model_available:
        top_factors = explain_progress_risk(features, top_k=4)

    # 4. Hybrid Synthesis & Guardrail Evaluation
    final_status = det_result.status
    reasons = list(det_result.reasons)
    recommendations = list(det_result.recommendations)

    inactivity_days = features.days_since_last_activity

    # Rule A: Inactivity Hard Override (> 21 days forces attention/monitor)
    if inactivity_days is not None and inactivity_days > 21:
        if final_status == AttentionStatus.ON_TRACK.value:
            final_status = AttentionStatus.MONITOR.value
        inactivity_note = f"Institutional policy: Inactivity of {inactivity_days} days requires administrative review."
        if inactivity_note not in reasons:
            reasons.append(inactivity_note)

    # Rule B: ML Early-Warning Escalation
    if model_available and risk_prob is not None:
        # If deterministic looks ON_TRACK but ML detects strong leading risk signals
        if final_status == AttentionStatus.ON_TRACK.value and risk_prob >= 0.65:
            final_status = AttentionStatus.MONITOR.value
            reasons.append(
                f"Early-warning indicator: Predicted attention risk is elevated ({round(risk_prob * 100, 1)}%)."
            )
            recommendations.append("Proactively check in with the student before upcoming milestone deadlines.")

    # Rule C: Insufficient Data Awareness
    if features.elapsed_weeks < 2:
        reasons.append("Early internship stage: limited historical observations available.")

    return {
        # Canonical legacy fields (strict backward compatibility)
        "attention_score": det_result.score,
        "attention_status": final_status,
        "factors": det_result.factors,
        "reasons": reasons,
        "recommendations": recommendations,
        # Enhanced progress fields
        "progress_health_score": det_result.progress_health_score or det_result.score,
        "progress_trend": features.progress_trend.value if hasattr(features.progress_trend, "value") else str(features.progress_trend),
        # Phase 3 ML Early-Warning fields
        "risk_probability": risk_prob,
        "risk_label": risk_label,
        "model_version": model_version,
        "model_available": model_available,
        "top_risk_factors": top_factors,
    }
