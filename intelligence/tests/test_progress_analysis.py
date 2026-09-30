"""
Unit tests for SIMS Progress Intelligence Engine & Feature Engineering Layer.
Tests feature extraction, consistency calculations, trend determinations,
evidence-based explanations, actionable recommendations, and edge cases.
"""

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
import pytest

from intelligence.app.features import (
    ProgressFeatures,
    ProgressTrend,
    extract_progress_features,
)
from intelligence.app.models import (
    AttentionStatus,
    ProgressAttentionEngineResult,
    ProgressHealthResult,
)
from intelligence.app.progress_analysis import (
    MONITOR_THRESHOLD_SCORE,
    ON_TRACK_THRESHOLD,
    ProgressAttentionEngine,
    ProgressValidationError,
    evaluate_progress_attention,
)


# ==============================================================================
# 1. Feature Engineering Unit Tests (Tasks 2, 3, 4)
# ==============================================================================

def test_feature_extraction_complete_data():
    """Verifies complete feature extraction from mock ORM objects."""
    now = datetime(2026, 9, 28, 12, 0, 0, tzinfo=timezone.utc)
    start_date = now - timedelta(days=21)  # 4 weeks elapsed (21 // 7 + 1 = 4)
    end_date = now + timedelta(days=35)    # remaining weeks

    mock_internship = SimpleNamespace(
        start_date=start_date,
        end_date=end_date,
        duration_weeks=8,
    )

    mock_tasks = [
        SimpleNamespace(is_completed=True, title="Task 1", completed_at=now - timedelta(days=20)),
        SimpleNamespace(is_completed=True, title="Task 2", completed_at=now - timedelta(days=10)),
        SimpleNamespace(is_completed=True, title="Task 3", completed_at=now - timedelta(days=2)),
        SimpleNamespace(is_completed=False, title="Task 4", completed_at=None),
        SimpleNamespace(is_completed=False, title="Task 5", completed_at=None),
    ]

    mock_reports = [
        SimpleNamespace(week_number=1, mentor_score=85.0, submitted_at=start_date + timedelta(days=6)),
        SimpleNamespace(week_number=2, mentor_score=88.0, submitted_at=start_date + timedelta(days=13)),
        SimpleNamespace(week_number=3, mentor_score=92.0, submitted_at=start_date + timedelta(days=20)),
        SimpleNamespace(week_number=4, mentor_score=95.0, submitted_at=now - timedelta(days=1)),
    ]

    features = extract_progress_features(
        tasks=mock_tasks,
        reports=mock_reports,
        internship=mock_internship,
        now=now,
    )

    assert isinstance(features, ProgressFeatures)
    assert features.task_completion == 60.0  # 3 of 5
    assert features.report_submission == 100.0  # 4 of 4 elapsed weeks
    assert features.mentor_feedback == 90.0  # avg(85, 88, 92, 95)
    assert features.attendance_rate is None  # Documented schema limitation
    assert features.task_velocity > 0.0
    assert features.days_since_last_activity == 1  # Last report was 1 day ago
    assert features.days_remaining == 35
    assert features.activity_consistency >= 80.0
    assert features.progress_trend == ProgressTrend.IMPROVING  # 85,88 vs 92,95 (+7 delta)
    assert features.next_task_title == "Task 4"


def test_feature_extraction_direct_factors():
    """Verifies fast path extraction when direct metrics are provided."""
    features = extract_progress_features(
        task_completion=80.0,
        report_submission=90.0,
        mentor_feedback=85.0,
        progress_consistency=85.0,
    )
    assert features.task_completion == 80.0
    assert features.report_submission == 90.0
    assert features.mentor_feedback == 85.0
    assert features.activity_consistency == 85.0


# ==============================================================================
# 2. Required Scenario Tests (Task 11)
# ==============================================================================

def test_scenario_zero_tasks():
    """Scenario 1: Zero tasks assigned handles gracefully without division by zero."""
    now = datetime(2026, 9, 28, 12, 0, 0, tzinfo=timezone.utc)
    features = extract_progress_features(
        tasks=[],
        reports=[SimpleNamespace(week_number=1, mentor_score=80.0, submitted_at=now)],
        internship=SimpleNamespace(start_date=now - timedelta(days=7), duration_weeks=8),
        now=now,
    )
    assert features.task_completion == 100.0  # Safe neutral baseline
    res = evaluate_progress_attention(features)
    assert res.score >= 50.0


def test_scenario_zero_reports():
    """Scenario 2: Zero reports submitted in active term flags missing reports."""
    now = datetime(2026, 9, 28, 12, 0, 0, tzinfo=timezone.utc)
    start_date = now - timedelta(days=21)  # 3 weeks active
    mock_internship = SimpleNamespace(start_date=start_date, duration_weeks=8)

    features = extract_progress_features(
        tasks=[SimpleNamespace(is_completed=True, title="T1", completed_at=now - timedelta(days=20))],
        reports=[],
        internship=mock_internship,
        now=now,
    )
    assert features.report_submission == 0.0
    assert features.missing_reports >= 3

    res = evaluate_progress_attention(features)
    assert any("expected weekly report" in r for r in res.reasons)
    assert any("outstanding weekly progress report" in rec for rec in res.recommendations)


def test_scenario_all_tasks_completed():
    """Scenario 3: All tasks completed achieves 100% task completion."""
    now = datetime(2026, 9, 28, 12, 0, 0, tzinfo=timezone.utc)
    mock_tasks = [
        SimpleNamespace(is_completed=True, title="T1", completed_at=now - timedelta(days=5)),
        SimpleNamespace(is_completed=True, title="T2", completed_at=now - timedelta(days=2)),
    ]
    features = extract_progress_features(
        tasks=mock_tasks,
        reports=[SimpleNamespace(week_number=1, mentor_score=95.0, submitted_at=now - timedelta(days=1))],
        internship=SimpleNamespace(start_date=now - timedelta(days=7), duration_weeks=8),
        now=now,
    )
    assert features.task_completion == 100.0
    assert features.completed_tasks == 2
    assert features.incomplete_tasks == 0

    res = evaluate_progress_attention(features)
    assert res.status == AttentionStatus.ON_TRACK.value


def test_scenario_no_recent_activity():
    """Scenario 4: Inactivity exceeding 21 days flags recency explanation and intervention."""
    now = datetime(2026, 9, 28, 12, 0, 0, tzinfo=timezone.utc)
    stale_date = now - timedelta(days=25)  # 25 days inactive

    mock_tasks = [
        SimpleNamespace(is_completed=True, title="T1", completed_at=stale_date),
    ]
    mock_reports = [
        SimpleNamespace(week_number=1, mentor_score=80.0, submitted_at=stale_date),
    ]
    mock_internship = SimpleNamespace(start_date=now - timedelta(days=35), duration_weeks=8)

    features = extract_progress_features(
        tasks=mock_tasks,
        reports=mock_reports,
        internship=mock_internship,
        now=now,
    )

    assert features.days_since_last_activity >= 25
    res = evaluate_progress_attention(features)
    assert any("No internship activity recorded in the last" in r for r in res.reasons)


def test_scenario_missing_reports():
    """Scenario 5: Evidence-based explanation details exact missing report count."""
    now = datetime(2026, 9, 28, 12, 0, 0, tzinfo=timezone.utc)
    # 4 weeks active, only 1 report submitted => 3 missing
    features = extract_progress_features(
        tasks=[SimpleNamespace(is_completed=True, title="T1", completed_at=now)],
        reports=[SimpleNamespace(week_number=1, mentor_score=75.0, submitted_at=now - timedelta(days=20))],
        internship=SimpleNamespace(start_date=now - timedelta(days=28), duration_weeks=8),
        now=now,
    )
    res = evaluate_progress_attention(features)
    assert any("expected weekly reports have not been submitted" in r for r in res.reasons)


def test_scenario_declining_progress():
    """Scenario 6: Declining mentor ratings trigger DECLINING trend."""
    now = datetime(2026, 9, 28, 12, 0, 0, tzinfo=timezone.utc)
    reports = [
        SimpleNamespace(week_number=1, mentor_score=90.0, submitted_at=now - timedelta(days=21)),
        SimpleNamespace(week_number=2, mentor_score=85.0, submitted_at=now - timedelta(days=14)),
        SimpleNamespace(week_number=3, mentor_score=60.0, submitted_at=now - timedelta(days=7)),
        SimpleNamespace(week_number=4, mentor_score=50.0, submitted_at=now - timedelta(days=1)),
    ]
    features = extract_progress_features(
        tasks=[],
        reports=reports,
        internship=SimpleNamespace(start_date=now - timedelta(days=28), duration_weeks=8),
        now=now,
    )
    assert features.progress_trend == ProgressTrend.DECLINING


def test_scenario_improving_progress():
    """Scenario 7: Rising mentor scores evaluate to IMPROVING trend."""
    now = datetime(2026, 9, 28, 12, 0, 0, tzinfo=timezone.utc)
    reports = [
        SimpleNamespace(week_number=1, mentor_score=60.0, submitted_at=now - timedelta(days=21)),
        SimpleNamespace(week_number=2, mentor_score=65.0, submitted_at=now - timedelta(days=14)),
        SimpleNamespace(week_number=3, mentor_score=88.0, submitted_at=now - timedelta(days=7)),
        SimpleNamespace(week_number=4, mentor_score=94.0, submitted_at=now - timedelta(days=1)),
    ]
    features = extract_progress_features(
        tasks=[],
        reports=reports,
        internship=SimpleNamespace(start_date=now - timedelta(days=28), duration_weeks=8),
        now=now,
    )
    assert features.progress_trend == ProgressTrend.IMPROVING


def test_scenario_insufficient_historical_data():
    """Scenario 8: Only 1 report on term start yields INSUFFICIENT_DATA trend."""
    now = datetime(2026, 9, 28, 12, 0, 0, tzinfo=timezone.utc)
    reports = [
        SimpleNamespace(week_number=1, mentor_score=80.0, submitted_at=now),
    ]
    features = extract_progress_features(
        tasks=[],
        reports=reports,
        internship=SimpleNamespace(start_date=now - timedelta(days=3), duration_weeks=8),
        now=now,
    )
    assert features.progress_trend == ProgressTrend.INSUFFICIENT_DATA


def test_scenario_low_mentor_feedback():
    """Scenario 9: Mentor feedback below 75 flags explicit percentage explanation."""
    res = evaluate_progress_attention(
        progress_consistency=80,
        task_completion=80,
        report_submission=80,
        mentor_feedback=40,
    )
    assert "Mentor feedback is pending." in res.reasons or any("40" in r for r in res.reasons)
    assert "Request mentor feedback." in res.recommendations or any("mentor" in rec.lower() for rec in res.recommendations)


def test_scenario_on_track_status():
    """Scenario 10: High scores evaluate to ON_TRACK."""
    res = evaluate_progress_attention(85, 85, 85, 85)
    assert res.status == AttentionStatus.ON_TRACK.value
    assert res.score >= 75.0


def test_scenario_monitor_status():
    """Scenario 11: Mid-tier scores evaluate to MONITOR."""
    res = evaluate_progress_attention(60, 60, 60, 60)
    assert res.status == AttentionStatus.MONITOR.value
    assert 50.0 <= res.score < 75.0


def test_scenario_needs_attention_status():
    """Scenario 12: Low scores evaluate to NEEDS_ATTENTION."""
    res = evaluate_progress_attention(30, 30, 30, 30)
    assert res.status == AttentionStatus.NEEDS_ATTENTION.value
    assert res.score < 50.0


# ==============================================================================
# 3. Engine Compatibility & Boundary Tests
# ==============================================================================

def test_engine_prompt_example():
    """Verifies exact formula weights: (80*0.3) + (60*0.3) + (80*0.2) + (50*0.2) = 68."""
    data = {
        "progress_consistency": 80,
        "task_completion": 60,
        "report_submission": 80,
        "mentor_feedback": 50,
    }
    res = evaluate_progress_attention(data)
    assert res.score == 68
    assert res.status == "MONITOR"
    assert "Task completion is below the expected level." in res.reasons
    assert "Mentor feedback is pending." in res.reasons
    assert "Complete pending tasks." in res.recommendations
    assert "Request mentor feedback." in res.recommendations

    # Dict subscript access compatibility
    assert res["score"] == 68
    assert res["status"] == "MONITOR"
    assert "reasons" in res
    assert "recommendations" in res
    assert res.get("missing", "default") == "default"

    with pytest.raises(KeyError):
        _ = res["nonexistent"]


def test_engine_boundary_values():
    """Scenario: Boundary values around 75.0 and 50.0 are strictly respected."""
    res_75 = evaluate_progress_attention(75, 75, 75, 75)
    assert res_75.score == 75
    assert res_75.status == AttentionStatus.ON_TRACK.value

    res_74_7 = evaluate_progress_attention(74, 75, 75, 75)
    assert res_74_7.score == 74.7
    assert res_74_7.status == AttentionStatus.MONITOR.value

    res_50 = evaluate_progress_attention(50, 50, 50, 50)
    assert res_50.score == 50
    assert res_50.status == AttentionStatus.MONITOR.value

    res_49_7 = evaluate_progress_attention(49, 50, 50, 50)
    assert res_49_7.score == 49.7
    assert res_49_7.status == AttentionStatus.NEEDS_ATTENTION.value


def test_engine_invalid_inputs():
    """Scenario: Validates inputs outside 0–100 or non-numeric types."""
    with pytest.raises(ValueError, match="between 0 and 100"):
        evaluate_progress_attention(-5, 50, 50, 50)

    with pytest.raises(ValueError, match="between 0 and 100"):
        evaluate_progress_attention(50, 105, 50, 50)

    with pytest.raises(TypeError, match="numeric value"):
        evaluate_progress_attention("invalid", 50, 50, 50)

    with pytest.raises(TypeError, match="numeric value"):
        evaluate_progress_attention(50, 50, 50, None)
