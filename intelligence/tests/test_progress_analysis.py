"""
Unit tests for Internship Progress Attention Analysis.
Tests On-track, Monitor, and Needs Attention student profiles,
along with explainability of reasons and edge cases.
"""

import pytest
from intelligence.app.models import (
    ProgressAttentionResult,
    ProgressData,
    ProgressStatus,
    ProgressTrend,
)
from intelligence.app.progress_analysis import (
    calculate_attention_score,
    analyze_progress_attention,
    batch_analyze_progress,
)


def test_on_track_student():
    """
    Student 1: On-track student
    - Reports: 5 of 5 submitted (100%)
    - Tasks: 12 of 12 completed (100%)
    - Mentor feedback: Not pending
    - Trend: Improving
    Expected: Status = 'On Track', Score < 30, no negative flags in reasons.
    """
    result = calculate_attention_score(
        reports_submitted=5,
        reports_expected=5,
        tasks_completed=12,
        tasks_total=12,
        mentor_feedback_pending=False,
        progress_trend="improving",
    )

    assert isinstance(result, ProgressAttentionResult)
    assert result.status == ProgressStatus.ON_TRACK
    assert result.score < 30.0
    assert result.score == 0.0
    assert len(result.reasons) == 0


def test_student_needing_monitoring():
    """
    Student 2: Student needing monitoring
    - Reports: 3 of 4 submitted (75%, 1 pending)
    - Tasks: 7 of 10 completed (70%)
    - Mentor feedback: Pending
    - Trend: Stable
    Expected: Status = 'Monitor', Score between 30 and 59.9, reasons explain flags.
    """
    result = calculate_attention_score(
        reports_submitted=3,
        reports_expected=4,
        tasks_completed=7,
        tasks_total=10,
        mentor_feedback_pending=True,
        progress_trend="stable",
    )

    assert result.status == ProgressStatus.MONITOR
    assert 30.0 <= result.score < 60.0
    assert any("Reports are pending" in r for r in result.reasons)
    assert any("Mentor feedback is pending" in r for r in result.reasons)


def test_student_needing_attention():
    """
    Student 3: Student needing attention
    - Reports: 1 of 4 submitted (25%, 3 pending)
    - Tasks: 2 of 10 completed (20%, low completion)
    - Mentor feedback: Pending
    - Trend: Declining
    Expected: Status = 'Needs Attention', Score >= 60.0,
    Reasons explain why the student was flagged.
    """
    result = calculate_attention_score(
        reports_submitted=1,
        reports_expected=4,
        tasks_completed=2,
        tasks_total=10,
        mentor_feedback_pending=True,
        progress_trend="declining",
    )

    assert result.status == ProgressStatus.NEEDS_ATTENTION
    assert result.score >= 60.0
    # Must contain specific, explainable reasons
    assert any("Reports are pending" in r for r in result.reasons)
    assert any("Task completion is low" in r for r in result.reasons)
    assert any("Mentor feedback is pending" in r for r in result.reasons)
    assert any("Recent progress is declining" in r for r in result.reasons)


def test_pydantic_model_input():
    """calculate_attention_score accepts ProgressData model instance."""
    data = ProgressData(
        student_id="STU-001",
        student_name="Jordan Lee",
        reports_submitted=4,
        reports_expected=4,
        tasks_completed=9,
        tasks_total=10,
        mentor_feedback_pending=False,
        progress_trend="stable",
    )
    result = calculate_attention_score(data)

    assert result.status == ProgressStatus.ON_TRACK
    assert result.score < 30.0


def test_dictionary_input_and_alias():
    """analyze_progress_attention alias works with raw dictionary."""
    data_dict = {
        "student_id": "STU-002",
        "reports_submitted": 2,
        "reports_expected": 5,
        "tasks_completed": 3,
        "tasks_total": 10,
        "mentor_feedback_pending": True,
        "progress_trend": "declining",
    }
    result = analyze_progress_attention(data_dict)

    assert result.status == ProgressStatus.NEEDS_ATTENTION
    assert result.score >= 60.0
    assert result.breakdown is not None
    assert result.breakdown.report_penalty > 0
    assert result.breakdown.task_penalty > 0
    assert result.breakdown.mentor_penalty == 15.0
    assert result.breakdown.trend_penalty == 15.0


def test_zero_expected_and_totals():
    """Handles edge case where no reports are expected yet and no tasks assigned."""
    result = calculate_attention_score(
        reports_submitted=0,
        reports_expected=0,
        tasks_completed=0,
        tasks_total=0,
        mentor_feedback_pending=False,
        progress_trend="stable",
    )

    assert result.status == ProgressStatus.ON_TRACK
    assert result.score == 0.0
    assert len(result.reasons) == 0


def test_case_insensitive_trend():
    """Handles trends provided in varied casing."""
    res_declining = calculate_attention_score(
        reports_submitted=2,
        reports_expected=2,
        tasks_completed=5,
        tasks_total=5,
        mentor_feedback_pending=False,
        progress_trend="DECLINING",
    )
    assert res_declining.breakdown.trend_penalty == 15.0
    assert any("Recent progress is declining" in r for r in res_declining.reasons)

    res_improving = calculate_attention_score(
        reports_submitted=2,
        reports_expected=2,
        tasks_completed=5,
        tasks_total=5,
        mentor_feedback_pending=False,
        progress_trend="Improving",
    )
    assert res_improving.breakdown.trend_penalty == -5.0


def test_batch_analyze_progress():
    """Batch analysis returns formatted DataFrame across intern cohort."""
    cohort = [
        {
            "student_id": "STU-1",
            "student_name": "On Track Intern",
            "reports_submitted": 4,
            "reports_expected": 4,
            "tasks_completed": 10,
            "tasks_total": 10,
            "mentor_feedback_pending": False,
            "progress_trend": "stable",
        },
        {
            "student_id": "STU-2",
            "student_name": "Monitor Intern",
            "reports_submitted": 3,
            "reports_expected": 4,
            "tasks_completed": 7,
            "tasks_total": 10,
            "mentor_feedback_pending": True,
            "progress_trend": "stable",
        },
        {
            "student_id": "STU-3",
            "student_name": "Attention Intern",
            "reports_submitted": 1,
            "reports_expected": 4,
            "tasks_completed": 2,
            "tasks_total": 10,
            "mentor_feedback_pending": True,
            "progress_trend": "declining",
        },
    ]

    df = batch_analyze_progress(cohort)

    assert len(df) == 3
    assert df.loc[df["student_id"] == "STU-1", "status"].values[0] == "On Track"
    assert df.loc[df["student_id"] == "STU-2", "status"].values[0] == "Monitor"
    assert df.loc[df["student_id"] == "STU-3", "status"].values[0] == "Needs Attention"
    assert df.loc[df["student_id"] == "STU-3", "reasons_count"].values[0] == 4


def test_defensive_fallback_reason(monkeypatch):
    """Verifies that any flagged status without individual criteria reasons gets a fallback explanation."""
    import intelligence.app.progress_analysis as pa
    monkeypatch.setattr(pa, "MONITOR_THRESHOLD", 5.0)
    res = pa.calculate_attention_score(
        reports_submitted=10,
        reports_expected=10,
        tasks_completed=8,
        tasks_total=10,
        mentor_feedback_pending=False,
        progress_trend="stable",
    )
    assert res.status == pa.ProgressStatus.MONITOR
    assert "Overall milestone metrics fall below recommended tracking thresholds" in res.reasons


# ---------------------------------------------------------------------------
# Tests for ProgressAttentionEngine (Prompt 3 requirements)
# ---------------------------------------------------------------------------
from intelligence.app.models import AttentionStatus, ProgressAttentionEngineResult
from intelligence.app.progress_analysis import (
    ProgressAttentionEngine,
    evaluate_progress_attention,
)


def test_engine_1_high_performing_student():
    """Scenario 1: High-performing student evaluates to ON_TRACK."""
    result = evaluate_progress_attention(
        progress_consistency=95,
        task_completion=90,
        report_submission=100,
        mentor_feedback=90,
    )

    assert isinstance(result, ProgressAttentionEngineResult)
    assert result.status == AttentionStatus.ON_TRACK.value
    assert result.score == 93.5
    assert "Progress is consistent." in result.reasons
    assert "Maintain regular progress updates." in result.recommendations


def test_engine_2_medium_progress():
    """Scenario 2: Medium progress student evaluates to MONITOR (50-74)."""
    result = evaluate_progress_attention(
        progress_consistency=65,
        task_completion=60,
        report_submission=70,
        mentor_feedback=60,
    )

    assert result.status == AttentionStatus.MONITOR.value
    assert 50 <= result.score < 75
    assert result.score == 63.5


def test_engine_3_low_progress():
    """Scenario 3: Low progress student evaluates to NEEDS_ATTENTION (< 50)."""
    result = evaluate_progress_attention(
        progress_consistency=30,
        task_completion=30,
        report_submission=40,
        mentor_feedback=30,
    )

    assert result.status == AttentionStatus.NEEDS_ATTENTION.value
    assert result.score < 50
    assert result.score == 32


def test_engine_4_missing_reports():
    """Scenario 4: Missing reports flags specific reason and recommendation."""
    result = evaluate_progress_attention(
        progress_consistency=85,
        task_completion=80,
        report_submission=20,
        mentor_feedback=80,
    )

    assert "Weekly reports are pending." in result.reasons
    assert "Submit pending weekly reports." in result.recommendations


def test_engine_5_pending_mentor_feedback():
    """Scenario 5: Pending mentor feedback flags specific reason and recommendation."""
    result = evaluate_progress_attention(
        progress_consistency=85,
        task_completion=80,
        report_submission=80,
        mentor_feedback=30,
    )

    assert "Mentor feedback is pending." in result.reasons
    assert "Request mentor feedback." in result.recommendations


def test_engine_6_low_task_completion():
    """Scenario 6: Low task completion flags specific reason and recommendation."""
    result = evaluate_progress_attention(
        progress_consistency=85,
        task_completion=40,
        report_submission=80,
        mentor_feedback=80,
    )

    assert "Task completion is below the expected level." in result.reasons
    assert "Complete pending tasks." in result.recommendations


def test_engine_7_boundary_values():
    """Scenario 7: Boundary values around 75 and 50 are strictly respected."""
    # Score exactly 75.0 -> ON_TRACK
    res_75 = evaluate_progress_attention(75, 75, 75, 75)
    assert res_75.score == 75
    assert res_75.status == AttentionStatus.ON_TRACK.value

    # Score 74.7 -> MONITOR
    res_74_7 = evaluate_progress_attention(74, 75, 75, 75)
    assert res_74_7.score == 74.7
    assert res_74_7.status == AttentionStatus.MONITOR.value

    # Score exactly 50.0 -> MONITOR
    res_50 = evaluate_progress_attention(50, 50, 50, 50)
    assert res_50.score == 50
    assert res_50.status == AttentionStatus.MONITOR.value

    # Score 49.7 -> NEEDS_ATTENTION
    res_49_7 = evaluate_progress_attention(49, 50, 50, 50)
    assert res_49_7.score == 49.7
    assert res_49_7.status == AttentionStatus.NEEDS_ATTENTION.value


def test_engine_8_invalid_input_values():
    """Scenario 8: Values outside 0–100 raise ValueError; non-numeric raises TypeError."""
    with pytest.raises(ValueError, match="between 0 and 100"):
        evaluate_progress_attention(-5, 50, 50, 50)

    with pytest.raises(ValueError, match="between 0 and 100"):
        evaluate_progress_attention(50, 105, 50, 50)

    with pytest.raises(ValueError, match="between 0 and 100"):
        evaluate_progress_attention(50, 50, -0.1, 50)

    with pytest.raises(ValueError, match="between 0 and 100"):
        evaluate_progress_attention(50, 50, 50, 150)

    with pytest.raises(TypeError, match="numeric value"):
        evaluate_progress_attention("invalid", 50, 50, 50)

    with pytest.raises(TypeError, match="numeric value"):
        evaluate_progress_attention(50, 50, 50, None)


def test_engine_prompt_example():
    """Verifies the exact scenario and formula from prompt 4."""
    data = {
        "progress_consistency": 80,
        "task_completion": 60,
        "report_submission": 80,
        "mentor_feedback": 50,
    }
    # (80 * 0.30) + (60 * 0.30) + (80 * 0.20) + (50 * 0.20) = 24 + 18 + 16 + 10 = 68
    res = evaluate_progress_attention(data)
    assert res.score == 68
    assert res.status == "MONITOR"
    assert res.reasons == [
        "Task completion is below the expected level.",
        "Mentor feedback is pending.",
    ]
    assert res.recommendations == [
        "Complete pending tasks.",
        "Request mentor feedback.",
    ]

    # Dict subscript access
    assert res["score"] == 68
    assert res["status"] == "MONITOR"
    assert "reasons" in res
    assert "recommendations" in res
    assert res.get("missing", "default") == "default"

    with pytest.raises(KeyError):
        _ = res["nonexistent"]


def test_engine_all_factors_high():
    """All factors high evaluates to ON_TRACK with positive progress confirmation."""
    data = {
        "progress_consistency": 90,
        "task_completion": 90,
        "report_submission": 90,
        "mentor_feedback": 90,
    }
    res = evaluate_progress_attention(data)
    assert res.score == 90
    assert res.status == "ON_TRACK"
    assert res.reasons == ["Progress is consistent."]
    assert res.recommendations == ["Maintain regular progress updates."]
    assert len(res.reasons) == len(set(res.reasons))
    assert len(res.recommendations) == len(set(res.recommendations))


def test_engine_all_factors_low():
    """All factors low evaluates to NEEDS_ATTENTION with distinct reasons and recommendations."""
    data = {
        "progress_consistency": 30,
        "task_completion": 30,
        "report_submission": 30,
        "mentor_feedback": 30,
    }
    res = evaluate_progress_attention(data)
    assert res.score == 30
    assert res.status == "NEEDS_ATTENTION"
    assert len(res.reasons) == 4
    assert len(res.recommendations) == 4
    assert "Task completion is below the expected level." in res.reasons
    assert "Weekly reports are pending." in res.reasons
    assert "Mentor feedback is pending." in res.reasons
    assert "Progress updates are inconsistent." in res.reasons
    assert len(res.reasons) == len(set(res.reasons))
    assert len(res.recommendations) == len(set(res.recommendations))


def test_engine_only_task_completion_low():
    """Only task completion low generates only task-related reason and recommendation."""
    data = {
        "progress_consistency": 85,
        "task_completion": 50,
        "report_submission": 85,
        "mentor_feedback": 85,
    }
    res = evaluate_progress_attention(data)
    assert res.reasons == ["Task completion is below the expected level."]
    assert res.recommendations == ["Complete pending tasks."]


def test_engine_only_reports_low():
    """Only reports low generates only reports-related reason and recommendation."""
    data = {
        "progress_consistency": 85,
        "task_completion": 85,
        "report_submission": 40,
        "mentor_feedback": 85,
    }
    res = evaluate_progress_attention(data)
    assert res.reasons == ["Weekly reports are pending."]
    assert res.recommendations == ["Submit pending weekly reports."]


def test_engine_only_mentor_feedback_low():
    """Only mentor feedback low generates only mentor-related reason and recommendation."""
    data = {
        "progress_consistency": 85,
        "task_completion": 85,
        "report_submission": 85,
        "mentor_feedback": 40,
    }
    res = evaluate_progress_attention(data)
    assert res.reasons == ["Mentor feedback is pending."]
    assert res.recommendations == ["Request mentor feedback."]


def test_engine_invalid_inputs_comprehensive():
    """Verifies edge cases: empty input, missing values, out of range, non-numeric."""
    # Empty input
    with pytest.raises((ValueError, TypeError), match="empty"):
        evaluate_progress_attention({})

    with pytest.raises((ValueError, TypeError), match="empty"):
        evaluate_progress_attention()

    # Missing value
    with pytest.raises((ValueError, TypeError), match="Missing required progress metric"):
        evaluate_progress_attention({"progress_consistency": 80, "task_completion": 70})

    # Below 0
    with pytest.raises((ValueError, TypeError), match="between 0 and 100"):
        evaluate_progress_attention({"progress_consistency": -10, "task_completion": 70, "report_submission": 80, "mentor_feedback": 80})

    # Above 100
    with pytest.raises((ValueError, TypeError), match="between 0 and 100"):
        evaluate_progress_attention({"progress_consistency": 80, "task_completion": 120, "report_submission": 80, "mentor_feedback": 80})

    # Non-numeric
    with pytest.raises((ValueError, TypeError), match="numeric"):
        evaluate_progress_attention({"progress_consistency": "high", "task_completion": 70, "report_submission": 80, "mentor_feedback": 80})

    # Boolean value
    with pytest.raises((ValueError, TypeError), match="boolean"):
        evaluate_progress_attention({"progress_consistency": True, "task_completion": 70, "report_submission": 80, "mentor_feedback": 80})

    # NaN / Inf
    import math
    with pytest.raises((ValueError, TypeError), match="finite"):
        evaluate_progress_attention({"progress_consistency": float("nan"), "task_completion": 70, "report_submission": 80, "mentor_feedback": 80})


def test_engine_no_duplicate_reasons():
    """Ensures duplicate reasons and recommendations are prevented across diverse evaluations."""
    cases = [
        {"progress_consistency": 40, "task_completion": 40, "report_submission": 40, "mentor_feedback": 40},
        {"progress_consistency": 90, "task_completion": 50, "report_submission": 90, "mentor_feedback": 50},
        {"progress_consistency": 100, "task_completion": 100, "report_submission": 100, "mentor_feedback": 100},
    ]
    for case in cases:
        res = evaluate_progress_attention(case)
        assert len(res.reasons) == len(set(res.reasons)), f"Duplicate reasons found in: {res.reasons}"
        assert len(res.recommendations) == len(set(res.recommendations)), f"Duplicate recommendations found in: {res.recommendations}"


def test_engine_pydantic_model_input():
    """Validates that a Pydantic model can be passed directly into evaluate_progress_attention."""
    from pydantic import BaseModel

    class ProgressInputSchema(BaseModel):
        progress_consistency: float
        task_completion: float
        report_submission: float
        mentor_feedback: float

    model_data = ProgressInputSchema(
        progress_consistency=80.0,
        task_completion=60.0,
        report_submission=80.0,
        mentor_feedback=50.0,
    )
    res = evaluate_progress_attention(model_data)
    assert res.score == 68
    assert res.status == "MONITOR"





