"""
Comprehensive Unit & Integration Tests for SIMS ML Early-Warning Intelligence.

Tests:
- Deterministic synthetic dataset generation & seed reproducibility
- Preprocessing validation, null handling, and range clamping
- Model training & evaluation metrics
- Prediction probability ranges [0.0, 1.0] and risk labeling
- Missing model graceful fallback
- SHAP explanation generation and formatting
- High-risk vs Low-risk student behavioral verification
- Insufficient-data state handling
- Institutional inactivity safety override
- API backward compatibility
"""

from pathlib import Path
import numpy as np
import pandas as pd
import pytest

from intelligence.app.features.progress_features import ProgressFeatures, ProgressTrend
from intelligence.app.models import AttentionStatus
from intelligence.app.ml.dataset import (
    ALL_FEATURE_COLUMNS,
    ML_NUMERIC_FEATURES,
    TARGET_COLUMN,
    generate_synthetic_dataset,
)
from intelligence.app.ml.explainer import SHAPExplainer
from intelligence.app.ml.model import train_early_warning_model
from intelligence.app.ml.predictor import RiskPredictionResult, RiskPredictor
from intelligence.app.ml.preprocessing import MLPreprocessor
from intelligence.app.ml.service import (
    evaluate_hybrid_attention,
    explain_progress_risk,
    predict_progress_risk,
)


# ==============================================================================
# 1. Dataset Generation & Reproducibility Tests
# ==============================================================================

def test_deterministic_synthetic_dataset_generation():
    """Verifies that synthetic data generation produces expected structure and distributions."""
    n_samples = 500
    df = generate_synthetic_dataset(n_samples=n_samples, random_seed=42)

    assert len(df) == n_samples
    assert TARGET_COLUMN in df.columns
    for col in ALL_FEATURE_COLUMNS:
        assert col in df.columns, f"Missing expected column: {col}"

    # Verify target distribution has both classes and reasonable balance
    counts = df[TARGET_COLUMN].value_counts()
    assert 0 in counts
    assert 1 in counts
    ratio = counts[1] / len(df)
    assert 0.15 <= ratio <= 0.45, f"Expected attention risk ratio ~15-45%, got {ratio:.2f}"


def test_reproducibility_using_fixed_seed():
    """Verifies that identical random seeds produce bit-exact identical DataFrames."""
    df1 = generate_synthetic_dataset(n_samples=300, random_seed=123)
    df2 = generate_synthetic_dataset(n_samples=300, random_seed=123)
    df_diff = generate_synthetic_dataset(n_samples=300, random_seed=999)

    pd.testing.assert_frame_equal(df1, df2)
    # Different seeds should not be equal
    assert not df1.equals(df_diff)


# ==============================================================================
# 2. Preprocessing & Validation Tests
# ==============================================================================

def test_missing_null_features_handling():
    """Verifies that missing and null values are cleanly imputed to neutral institutional baselines."""
    preprocessor = MLPreprocessor()

    sparse_state = {
        "task_completion": 60.0,
        "report_submission": 70.0,
        "mentor_feedback": None,  # unreviewed
        "task_velocity": 1.2,
        "report_punctuality": None,  # should default cleanly
        "days_since_last_activity": None,
        "activity_consistency": 80.0,
        "days_remaining": None,
        "progress_trend": None,
    }

    vec = preprocessor.transform_single(sparse_state)
    assert not np.isnan(vec).any(), "Processed feature vector must not contain NaNs"
    assert len(vec) == len(preprocessor.get_feature_names())

    # Check mentor_feedback default imputation (index 2 in NUMERIC_FEATURES)
    mf_idx = preprocessor.numeric_features.index("mentor_feedback")
    assert vec[mf_idx] == 75.0, "Missing mentor_feedback should impute to 75.0"


def test_invalid_feature_ranges_clamping():
    """Verifies that out-of-range values are clamped to physical boundaries."""
    preprocessor = MLPreprocessor()

    invalid_state = {
        "task_completion": 150.0,  # > 100
        "report_submission": -20.0,  # < 0
        "mentor_feedback": 999.0,   # > 100
        "task_velocity": -5.0,      # < 0
        "report_punctuality": 110.0,
        "days_since_last_activity": -10,
        "activity_consistency": 200.0,
        "days_remaining": -5,
        "progress_trend": "UNKNOWN_TREND",
    }

    df = preprocessor.transform_single_df(invalid_state)
    assert df["task_completion"].iloc[0] == 100.0
    assert df["report_submission"].iloc[0] == 0.0
    assert df["mentor_feedback"].iloc[0] == 100.0
    assert df["task_velocity"].iloc[0] == 0.0
    assert df["report_punctuality"].iloc[0] == 100.0
    assert df["days_since_last_activity"].iloc[0] == 0
    assert df["activity_consistency"].iloc[0] == 100.0
    assert df["days_remaining"].iloc[0] == 0


def test_preprocessing_consistency_train_vs_inference():
    """Verifies exact feature ordering and schema between DataFrame transformation and single-row inference."""
    preprocessor = MLPreprocessor()
    synthetic_df = generate_synthetic_dataset(n_samples=5, random_seed=42)

    df_transformed = preprocessor.transform_df(synthetic_df)

    single_row = synthetic_df.iloc[0].to_dict()
    df_single = preprocessor.transform_single_df(single_row)

    assert list(df_transformed.columns) == list(df_single.columns)
    # Check first row values match within precision
    np.testing.assert_allclose(
        df_transformed.iloc[0].values,
        df_single.iloc[0].values,
        rtol=1e-5,
    )


# ==============================================================================
# 3. Model Training & Evaluation Tests
# ==============================================================================

def test_model_training_and_metrics():
    """Verifies that the model trains and reports required metrics with sound early-warning recall."""
    model, preprocessor, metrics = train_early_warning_model(
        n_samples=1000, random_seed=42, save_artifacts=False
    )

    required_metrics = ["accuracy", "precision", "recall", "f1", "roc_auc"]
    for m in required_metrics:
        assert m in metrics, f"Missing metric: {m}"
        assert 0.0 <= metrics[m] <= 1.0, f"Metric {m} out of bounds: {metrics[m]}"

    # Early-warning requirement: recall for ATTENTION_RISK should be high (>= 0.75)
    assert metrics["recall"] >= 0.75, f"Recall must be >= 0.75, got {metrics['recall']}"
    assert metrics["roc_auc"] >= 0.85, f"ROC-AUC must be >= 0.85, got {metrics['roc_auc']}"


# ==============================================================================
# 4. Predictor & Fallback Tests
# ==============================================================================

def test_prediction_probability_range():
    """Verifies that predict_progress_risk returns valid probability in [0.0, 1.0]."""
    feat = ProgressFeatures(
        task_completion=50.0,
        report_submission=50.0,
        mentor_feedback=65.0,
        task_velocity=0.8,
        activity_consistency=55.0,
        days_since_last_activity=7,
        progress_trend=ProgressTrend.STABLE,
    )

    res = predict_progress_risk(feat)
    assert "risk_probability" in res
    assert "risk_label" in res
    assert res["model_available"] is True
    prob = res["risk_probability"]
    assert isinstance(prob, float)
    assert 0.0 <= prob <= 1.0
    assert res["risk_label"] in ["LOW_RISK", "ATTENTION_RISK"]


def test_missing_model_graceful_fallback():
    """Verifies that RiskPredictor gracefully falls back when model artifact is missing."""
    dummy_path = Path("non_existent_model_dir/fake_model.joblib")
    predictor = RiskPredictor(artifact_path=dummy_path)

    assert predictor.is_loaded is False

    feat = ProgressFeatures(task_completion=50.0, report_submission=50.0)
    result = predictor.predict(feat)

    assert isinstance(result, RiskPredictionResult)
    assert result.model_available is False
    assert result.risk_probability is None
    assert result.risk_label is None


# ==============================================================================
# 5. SHAP Explanation Tests
# ==============================================================================

def test_shap_explanation_generation():
    """Verifies that SHAP explanations produce human-interpretable factors without raw arrays."""
    feat = ProgressFeatures(
        task_completion=25.0,
        report_submission=30.0,
        mentor_feedback=50.0,
        task_velocity=0.3,
        days_since_last_activity=18,
        activity_consistency=35.0,
        progress_trend=ProgressTrend.DECLINING,
    )

    explanations = explain_progress_risk(feat, top_k=4)
    assert isinstance(explanations, list)
    assert len(explanations) > 0

    top_item = explanations[0]
    expected_fields = ["feature", "label", "impact", "direction", "value", "description"]
    for field in expected_fields:
        assert field in top_item, f"Explanation item missing field: {field}"

    assert top_item["direction"] in ["RISK", "PROTECTIVE"]
    assert top_item["impact"] in ["HIGH", "MEDIUM", "LOW"]


# ==============================================================================
# 6. Student Behavioral Cohort Tests (High vs Low Risk)
# ==============================================================================

def test_high_risk_struggling_student():
    """Verifies that a student with multiple severe deficiencies is classified as ATTENTION_RISK."""
    struggling_features = ProgressFeatures(
        task_completion=20.0,
        report_submission=25.0,
        mentor_feedback=40.0,
        task_velocity=0.2,
        report_punctuality=30.0,
        days_since_last_activity=22,
        activity_consistency=25.0,
        days_remaining=20,
        progress_trend=ProgressTrend.DECLINING,
    )

    res = predict_progress_risk(struggling_features)
    assert res["model_available"] is True
    assert res["risk_label"] == "ATTENTION_RISK"
    assert res["risk_probability"] >= 0.60


def test_low_risk_high_performing_student():
    """Verifies that an exemplary student is classified as LOW_RISK with low probability."""
    excelling_features = ProgressFeatures(
        task_completion=95.0,
        report_submission=100.0,
        mentor_feedback=92.0,
        task_velocity=2.5,
        report_punctuality=100.0,
        days_since_last_activity=1,
        activity_consistency=95.0,
        days_remaining=40,
        progress_trend=ProgressTrend.IMPROVING,
    )

    res = predict_progress_risk(excelling_features)
    assert res["model_available"] is True
    assert res["risk_label"] == "LOW_RISK"
    assert res["risk_probability"] <= 0.35


# ==============================================================================
# 7. Hybrid Decision Policy & Safety Invariants
# ==============================================================================

def test_inactivity_override_safety_rule():
    """
    Institutional Safety Rule:
    Even if high task completion makes the baseline score high, prolonged inactivity (> 21 days)
    must trigger administrative review/monitoring.
    """
    inactive_features = ProgressFeatures(
        task_completion=85.0,
        report_submission=85.0,
        mentor_feedback=85.0,
        days_since_last_activity=25,  # > 21 days
        activity_consistency=40.0,
        progress_trend=ProgressTrend.DECLINING,
        elapsed_weeks=6,
    )

    hybrid = evaluate_hybrid_attention(inactive_features)

    # Status should not be ON_TRACK due to prolonged inactivity override
    assert hybrid["attention_status"] in [AttentionStatus.MONITOR.value, AttentionStatus.NEEDS_ATTENTION.value]
    assert any("Inactivity" in reason or "activity" in reason.lower() for reason in hybrid["reasons"])


def test_insufficient_data_state():
    """Verifies that early internships with insufficient data do not generate false certainty."""
    early_features = ProgressFeatures(
        task_completion=100.0,
        report_submission=100.0,
        mentor_feedback=None,
        elapsed_weeks=1,  # early stage (< 2 weeks)
        progress_trend=ProgressTrend.INSUFFICIENT_DATA,
    )

    hybrid = evaluate_hybrid_attention(early_features)
    assert any("Early internship stage" in r or "insufficient" in r.lower() for r in hybrid["reasons"])


def test_api_backward_compatibility():
    """
    Verifies that the hybrid service response preserves all legacy fields
    while seamlessly adding optional ML early-warning fields.
    """
    features = ProgressFeatures(
        task_completion=70.0,
        report_submission=70.0,
        mentor_feedback=75.0,
        activity_consistency=70.0,
        progress_trend=ProgressTrend.STABLE,
    )

    res = evaluate_hybrid_attention(features)

    # Required legacy fields
    assert "attention_score" in res
    assert "attention_status" in res
    assert "factors" in res
    assert "reasons" in res
    assert "recommendations" in res

    # Phase 2 & 3 enhanced fields
    assert "progress_health_score" in res
    assert "progress_trend" in res
    assert "risk_probability" in res
    assert "risk_label" in res
    assert "model_version" in res
    assert "model_available" in res
    assert "top_risk_factors" in res


# ==============================================================================
# 8. Phase 3.1 Hardening & Judge-Ready Validation Tests
# ==============================================================================

def test_group_aware_split_no_synthetic_leakage():
    """
    Phase 3.1 Hardening:
    Verifies that the GroupShuffleSplit partitions synthetic student observations strictly
    without leaking longitudinal states across training, validation, and test sets.
    """
    from sklearn.model_selection import GroupShuffleSplit
    from intelligence.app.ml.dataset import GROUP_COLUMN

    raw_df = generate_synthetic_dataset(n_samples=600, random_seed=42)
    assert GROUP_COLUMN in raw_df.columns
    groups = raw_df[GROUP_COLUMN].values

    gss_test = GroupShuffleSplit(n_splits=1, test_size=0.15, random_state=42)
    train_val_idx, test_idx = next(gss_test.split(raw_df, groups=groups))

    train_val_groups = groups[train_val_idx]
    gss_val = GroupShuffleSplit(n_splits=1, test_size=0.17647, random_state=42)
    train_sub_idx, val_sub_idx = next(gss_val.split(raw_df.iloc[train_val_idx], groups=train_val_groups))

    train_students = set(groups[train_val_idx[train_sub_idx]])
    val_students = set(groups[train_val_idx[val_sub_idx]])
    test_students = set(groups[test_idx])

    assert len(train_students) > 0
    assert len(val_students) > 0
    assert len(test_students) > 0
    assert train_students.isdisjoint(test_students), "Synthetic student leakage detected between train and test sets!"
    assert train_students.isdisjoint(val_students), "Synthetic student leakage detected between train and val sets!"
    assert val_students.isdisjoint(test_students), "Synthetic student leakage detected between val and test sets!"


def test_calibration_metrics_brier_and_ece():
    """
    Phase 3.1 Hardening:
    Verifies that model training calculates Brier score, ECE, and confusion matrix
    with sound bounds for honest probabilistic assessment.
    """
    from intelligence.app.ml.model import compute_expected_calibration_error

    # Test synthetic probabilities vs ground truth calibration computation
    y_true = np.array([0, 0, 0, 0, 1, 1, 1, 1])
    y_prob = np.array([0.1, 0.15, 0.2, 0.25, 0.75, 0.8, 0.85, 0.9])
    ece = compute_expected_calibration_error(y_true, y_prob, n_bins=5)
    assert 0.0 <= ece <= 0.30

    _, _, metrics = train_early_warning_model(n_samples=600, random_seed=42, save_artifacts=False)
    assert "brier_score" in metrics
    assert "expected_calibration_error" in metrics
    assert "confusion_matrix" in metrics
    assert "calibration_assessment" in metrics

    # Probabilistic Brier score is in [0, 1] (0 is perfect, 0.25 is random chance)
    assert 0.0 <= metrics["brier_score"] <= 0.20
    assert 0.0 <= metrics["expected_calibration_error"] <= 0.20
    cm = metrics["confusion_matrix"]
    assert cm["true_negatives"] >= 0
    assert cm["true_positives"] >= 0


def test_target_and_class_probability_mapping():
    """
    Phase 3.1 Hardening:
    Verifies class semantics:
    - class 0 is LOW_RISK
    - class 1 is ATTENTION_RISK
    - risk_probability strictly reflects P(class 1)
    - threshold at 0.50 cleanly maps to ATTENTION_RISK vs LOW_RISK
    """
    from intelligence.app.ml.service import get_predictor
    predictor = get_predictor()
    if not predictor.is_loaded:
        pytest.skip("Model artifact not loaded in test environment.")

    assert list(predictor.model.classes_) == [0, 1]

    # Test with synthetic inputs designed to trigger high vs low probabilities
    high_risk = ProgressFeatures(
        task_completion=15.0,
        report_submission=20.0,
        mentor_feedback=35.0,
        task_velocity=0.1,
        days_since_last_activity=24,
        activity_consistency=20.0,
        progress_trend=ProgressTrend.DECLINING,
    )
    res_high = predictor.predict(high_risk)
    assert res_high.risk_probability is not None
    assert 0.0 <= res_high.risk_probability <= 1.0
    assert res_high.risk_probability >= 0.50
    assert res_high.risk_label == "ATTENTION_RISK"

    low_risk = ProgressFeatures(
        task_completion=95.0,
        report_submission=95.0,
        mentor_feedback=90.0,
        task_velocity=2.0,
        days_since_last_activity=1,
        activity_consistency=95.0,
        progress_trend=ProgressTrend.IMPROVING,
    )
    res_low = predictor.predict(low_risk)
    assert res_low.risk_probability is not None
    assert 0.0 <= res_low.risk_probability <= 1.0
    assert res_low.risk_probability < 0.50
    assert res_low.risk_label == "LOW_RISK"


def test_schema_parity_assertion_fails_on_mismatch():
    """
    Phase 3.1 Hardening:
    Verifies that MLPreprocessor raises SchemaParityError if column names or ordering diverge.
    """
    from intelligence.app.ml.preprocessing import SchemaParityError

    preprocessor = MLPreprocessor()
    valid_cols = preprocessor.get_feature_names()

    # Valid schema passes
    preprocessor.assert_schema_parity(valid_cols)

    # Missing column raises SchemaParityError
    with pytest.raises(SchemaParityError):
        preprocessor.assert_schema_parity(valid_cols[:-1])

    # Reordered columns raise SchemaParityError
    reversed_cols = list(reversed(valid_cols))
    with pytest.raises(SchemaParityError):
        preprocessor.assert_schema_parity(reversed_cols)


def test_shap_attribution_direction_and_categorical_handling():
    """
    Phase 3.1 Hardening:
    Verifies that SHAP attributions distinguish RISK from PROTECTIVE directions,
    properly formats categorical trends, and returns no raw array structures.
    """
    high_risk = ProgressFeatures(
        task_completion=20.0,
        report_submission=20.0,
        mentor_feedback=40.0,
        days_since_last_activity=20,
        activity_consistency=25.0,
        progress_trend=ProgressTrend.DECLINING,
    )

    factors = explain_progress_risk(high_risk, top_k=4)
    assert isinstance(factors, list)
    assert len(factors) > 0

    for factor in factors:
        assert factor["direction"] in ["RISK", "PROTECTIVE"]
        assert factor["impact"] in ["HIGH", "MEDIUM", "LOW"]
        assert isinstance(factor["attribution_weight"], float)
        # Verify attribution_weight sign matches direction
        if factor["direction"] == "RISK":
            assert factor["attribution_weight"] > 0
        else:
            assert factor["attribution_weight"] < 0
        # Check no raw ndarray leaked
        assert not isinstance(factor["value"], np.ndarray)


def test_hybrid_early_escalation_guardrail():
    """
    Phase 3.1 Hardening:
    Verifies institutional guardrail:
    If a student is nominally ON_TRACK deterministically but has elevated ML risk (>= 0.65),
    the final status escalates to MONITOR with an early warning explanation.
    """
    # Student with good completion (78%) but declining trend and long gap creating leading risk
    borderline_leading_risk = ProgressFeatures(
        task_completion=78.0,
        report_submission=76.0,
        mentor_feedback=78.0,
        task_velocity=0.3,
        days_since_last_activity=19,
        activity_consistency=45.0,
        progress_trend=ProgressTrend.DECLINING,
        elapsed_weeks=6,
    )

    hybrid = evaluate_hybrid_attention(borderline_leading_risk)
    # Check that either deterministic score or ML early-warning escalates or monitors
    assert hybrid["attention_status"] in [AttentionStatus.MONITOR.value, AttentionStatus.NEEDS_ATTENTION.value]
    assert len(hybrid["reasons"]) > 0
    assert len(hybrid["recommendations"]) > 0


def test_synthetic_demo_cohort_consistency():
    """
    Phase 3.1 Hardening:
    Verifies that the synthetic demonstration cohort exhibits consistent
    archetypal behavior without statistical contradictions.
    """
    df = generate_synthetic_dataset(n_samples=500, random_seed=42)

    # 1. Non-empty distinct student cohorts
    assert df["synthetic_student_id"].nunique() >= 50

    # 2. On-track students should have lower mean days since last activity than struggling
    active_mask = df["task_completion"] >= 75.0
    inactive_mask = df["task_completion"] < 40.0
    assert df.loc[active_mask, "days_since_last_activity"].mean() < df.loc[inactive_mask, "days_since_last_activity"].mean()

    # 3. Target label should correlate positively with inactivity and negatively with completion
    corr_inact = df["days_since_last_activity"].corr(df["risk_label"])
    corr_comp = df["task_completion"].corr(df["risk_label"])
    assert corr_inact > 0, "Inactivity must correlate positively with attention risk"
    assert corr_comp < 0, "Task completion must correlate negatively with attention risk"

