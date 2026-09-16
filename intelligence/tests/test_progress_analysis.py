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

