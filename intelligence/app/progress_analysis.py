"""
Progress Attention Analysis module for internship monitoring.
Provides transparent, explainable scoring to identify interns who may need support or follow-up.
"""

from typing import Any, Dict, List, Optional, Union
import pandas as pd
from intelligence.app.models import (
    ProgressAttentionResult,
    ProgressBreakdown,
    ProgressData,
    ProgressStatus,
    ProgressTrend,
)

# Penalty weight constants
MAX_REPORT_PENALTY = 35.0
MAX_TASK_PENALTY = 35.0
MENTOR_FEEDBACK_PENALTY = 15.0
DECLINING_TREND_PENALTY = 15.0
IMPROVING_TREND_MITIGATION = -5.0

# Status thresholds
MONITOR_THRESHOLD = 30.0
ATTENTION_THRESHOLD = 60.0
LOW_TASK_COMPLETION_THRESHOLD = 0.60


def calculate_attention_score(
    data: Optional[Union[ProgressData, Dict[str, Any]]] = None,
    *,
    reports_submitted: Optional[int] = None,
    reports_expected: Optional[int] = None,
    tasks_completed: Optional[int] = None,
    tasks_total: Optional[int] = None,
    mentor_feedback_pending: Optional[bool] = None,
    progress_trend: Optional[Union[str, ProgressTrend]] = None,
    student_id: Optional[str] = None,
    student_name: Optional[str] = None,
) -> ProgressAttentionResult:
    """
    Computes an explainable, transparent attention score for an intern's current progress.

    This is an internship progress and milestone indicator to alert supervisors/mentors,
    NOT a medical, psychological, or predictive behavioral assessment.

    Score Scale:
        - 0.0 to 29.9: 'On Track' (intern is meeting expected milestones)
        - 30.0 to 59.9: 'Monitor' (moderate delays or pending feedback; keep an eye)
        - 60.0 to 100.0: 'Needs Attention' (significant deficits; mentor intervention recommended)

    Parameters can be passed either as a `ProgressData` model / dict, or as individual keyword arguments.
    """
    # Parse inputs into a unified ProgressData object
    if isinstance(data, ProgressData):
        input_data = data
    elif isinstance(data, dict):
        input_data = ProgressData(**data)
    else:
        input_data = ProgressData(
            student_id=student_id,
            student_name=student_name,
            reports_submitted=reports_submitted if reports_submitted is not None else 0,
            reports_expected=reports_expected if reports_expected is not None else 0,
            tasks_completed=tasks_completed if tasks_completed is not None else 0,
            tasks_total=tasks_total if tasks_total is not None else 0,
            mentor_feedback_pending=bool(mentor_feedback_pending),
            progress_trend=str(progress_trend.value if isinstance(progress_trend, ProgressTrend) else (progress_trend or "stable")),
        )

    reasons: List[str] = []

    # 1. Report Submission Evaluation (0 to 35 pts)
    if input_data.reports_expected > 0:
        submission_ratio = min(
            1.0, max(0.0, input_data.reports_submitted / input_data.reports_expected)
        )
        report_penalty = round(MAX_REPORT_PENALTY * (1.0 - submission_ratio), 2)
        if input_data.reports_submitted < input_data.reports_expected:
            reasons.append(
                f"Reports are pending ({input_data.reports_submitted} of {input_data.reports_expected} submitted)"
            )
    else:
        report_penalty = 0.0

    # 2. Task Completion Evaluation (0 to 35 pts)
    if input_data.tasks_total > 0:
        task_ratio = min(
            1.0, max(0.0, input_data.tasks_completed / input_data.tasks_total)
        )
        task_penalty = round(MAX_TASK_PENALTY * (1.0 - task_ratio), 2)
        if task_ratio < LOW_TASK_COMPLETION_THRESHOLD:
            pct = round(task_ratio * 100.0, 1)
            reasons.append(
                f"Task completion is low ({input_data.tasks_completed} of {input_data.tasks_total} completed, {pct}%)"
            )
        elif input_data.tasks_completed < input_data.tasks_total and task_ratio < 0.80:
            reasons.append(
                f"Task completion is moderate ({input_data.tasks_completed} of {input_data.tasks_total} completed)"
            )
    else:
        task_penalty = 0.0

    # 3. Mentor Feedback Evaluation (0 or 15 pts)
    if input_data.mentor_feedback_pending:
        mentor_penalty = MENTOR_FEEDBACK_PENALTY
        reasons.append("Mentor feedback is pending")
    else:
        mentor_penalty = 0.0

    # 4. Progress Trend Evaluation (-5 to 15 pts)
    trend_clean = (input_data.progress_trend or "stable").strip().lower()
    if trend_clean == ProgressTrend.DECLINING.value:
        trend_penalty = DECLINING_TREND_PENALTY
        reasons.append("Recent progress is declining")
    elif trend_clean == ProgressTrend.IMPROVING.value:
        trend_penalty = IMPROVING_TREND_MITIGATION
    else:
        trend_penalty = 0.0

    # Calculate overall raw score and clamp to [0.0, 100.0]
    raw_score = report_penalty + task_penalty + mentor_penalty + trend_penalty
    final_score = round(max(0.0, min(100.0, raw_score)), 2)

    # Determine status categorization
    if final_score >= ATTENTION_THRESHOLD:
        status = ProgressStatus.NEEDS_ATTENTION
    elif final_score >= MONITOR_THRESHOLD:
        status = ProgressStatus.MONITOR
    else:
        status = ProgressStatus.ON_TRACK

    # Ensure flagged statuses include explanation
    if status != ProgressStatus.ON_TRACK and not reasons:
        reasons.append("Overall milestone metrics fall below recommended tracking thresholds")

    breakdown = ProgressBreakdown(
        report_penalty=report_penalty,
        task_penalty=task_penalty,
        mentor_penalty=mentor_penalty,
        trend_penalty=trend_penalty,
    )

    return ProgressAttentionResult(
        score=final_score,
        status=status,
        reasons=reasons,
        breakdown=breakdown,
    )


# Function alias for intuitive API naming
analyze_progress_attention = calculate_attention_score


def batch_analyze_progress(records: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Computes progress attention analytics across a cohort of interns using pandas.

    Parameters:
        records: List of dictionaries matching ProgressData schema.

    Returns:
        pd.DataFrame containing intern metrics, attention scores, statuses, and reasons.
    """
    results = []
    for rec in records:
        student_id = rec.get("student_id") or rec.get("id") or "N/A"
        student_name = rec.get("student_name") or rec.get("name") or "Unknown"

        res = calculate_attention_score(rec)
        results.append({
            "student_id": student_id,
            "student_name": student_name,
            "attention_score": res.score,
            "status": res.status.value,
            "reasons_count": len(res.reasons),
            "reasons": "; ".join(res.reasons) if res.reasons else "None",
            "report_penalty": res.breakdown.report_penalty if res.breakdown else 0.0,
            "task_penalty": res.breakdown.task_penalty if res.breakdown else 0.0,
            "mentor_penalty": res.breakdown.mentor_penalty if res.breakdown else 0.0,
            "trend_penalty": res.breakdown.trend_penalty if res.breakdown else 0.0,
        })

    return pd.DataFrame(results)
