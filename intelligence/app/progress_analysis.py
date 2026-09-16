"""
Progress Attention Analysis module for internship monitoring.
Provides transparent, explainable scoring to identify interns who may need support or follow-up.
"""

from typing import Any, Dict, List, Optional, Union
import pandas as pd
from intelligence.app.models import (
    AttentionStatus,
    ProgressAttentionEngineResult,
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


# ---------------------------------------------------------------------------
# Internship Progress Attention Engine
# ---------------------------------------------------------------------------

# Factor weights (sum to 1.0 / 100%)
WEIGHT_PROGRESS_CONSISTENCY = 0.30
WEIGHT_TASK_COMPLETION = 0.30
WEIGHT_REPORT_SUBMISSION = 0.20
WEIGHT_MENTOR_FEEDBACK = 0.20

# Status thresholds (configurable constants)
ON_TRACK_THRESHOLD = 75.0
MONITOR_THRESHOLD_SCORE = 50.0

# Metric benchmark threshold for flagging issues
FACTOR_BENCHMARK_THRESHOLD = 75.0


class ProgressAttentionEngine:
    """
    Internship Progress Attention Engine.
    Analyzes internship progress data and determines whether a student is:
      - ON_TRACK
      - MONITOR
      - NEEDS_ATTENTION

    Input Factors:
      1. Progress consistency  — 30%
      2. Task completion       — 30%
      3. Report submission     — 20%
      4. Mentor feedback       — 20%

    Formula:
      score = (progress_consistency * 0.30) +
              (task_completion * 0.30) +
              (report_submission * 0.20) +
              (mentor_feedback * 0.20)
    """

    # Constants exposed on class for easy inspection and override
    WEIGHT_PROGRESS_CONSISTENCY = WEIGHT_PROGRESS_CONSISTENCY
    WEIGHT_TASK_COMPLETION = WEIGHT_TASK_COMPLETION
    WEIGHT_REPORT_SUBMISSION = WEIGHT_REPORT_SUBMISSION
    WEIGHT_MENTOR_FEEDBACK = WEIGHT_MENTOR_FEEDBACK

    ON_TRACK_THRESHOLD = ON_TRACK_THRESHOLD
    MONITOR_THRESHOLD = MONITOR_THRESHOLD_SCORE
    BENCHMARK_THRESHOLD = FACTOR_BENCHMARK_THRESHOLD

    @classmethod
    def validate_inputs(
        cls,
        progress_consistency: Union[int, float],
        task_completion: Union[int, float],
        report_submission: Union[int, float],
        mentor_feedback: Union[int, float],
    ) -> None:
        """
        Validates that all input metrics are numeric and strictly within 0–100 inclusive.
        Raises TypeError if non-numeric, or ValueError if outside 0–100.
        """
        factors = {
            "progress_consistency": progress_consistency,
            "task_completion": task_completion,
            "report_submission": report_submission,
            "mentor_feedback": mentor_feedback,
        }
        for name, val in factors.items():
            if val is None or isinstance(val, bool) or not isinstance(val, (int, float)):
                raise TypeError(
                    f"'{name}' must be a numeric value (int or float). Got: {type(val).__name__}"
                )
            if val < 0 or val > 100:
                raise ValueError(
                    f"'{name}' must be between 0 and 100 inclusive. Received: {val}"
                )

    @classmethod
    def evaluate(
        cls,
        progress_consistency: Union[int, float],
        task_completion: Union[int, float],
        report_submission: Union[int, float],
        mentor_feedback: Union[int, float],
    ) -> ProgressAttentionEngineResult:
        """
        Evaluates progress metrics and returns an explainable attention result.
        """
        cls.validate_inputs(
            progress_consistency=progress_consistency,
            task_completion=task_completion,
            report_submission=report_submission,
            mentor_feedback=mentor_feedback,
        )

        # Calculate overall weighted score
        raw_score = (
            (progress_consistency * cls.WEIGHT_PROGRESS_CONSISTENCY)
            + (task_completion * cls.WEIGHT_TASK_COMPLETION)
            + (report_submission * cls.WEIGHT_REPORT_SUBMISSION)
            + (mentor_feedback * cls.WEIGHT_MENTOR_FEEDBACK)
        )
        calc_score = round(raw_score, 2)
        score: Union[int, float] = int(calc_score) if calc_score.is_integer() else calc_score

        # Determine status
        if score >= cls.ON_TRACK_THRESHOLD:
            status = AttentionStatus.ON_TRACK.value
        elif score >= cls.MONITOR_THRESHOLD:
            status = AttentionStatus.MONITOR.value
        else:
            status = AttentionStatus.NEEDS_ATTENTION.value

        reasons: List[str] = []
        recommendations: List[str] = []

        # Explainable reasons & recommendations:
        # Progress consistency
        if progress_consistency >= cls.BENCHMARK_THRESHOLD:
            reasons.append("Progress is consistent.")
        else:
            reasons.append("Progress consistency is below the expected level.")
            recommendations.append("Maintain regular progress updates.")

        # Task completion
        if task_completion < cls.BENCHMARK_THRESHOLD:
            reasons.append("Task completion is below the expected level.")
            recommendations.append("Complete pending tasks.")

        # Weekly reports
        if report_submission < cls.BENCHMARK_THRESHOLD:
            reasons.append("Weekly reports are missing.")
            recommendations.append("Submit pending weekly reports.")

        # Mentor feedback
        if mentor_feedback < cls.BENCHMARK_THRESHOLD:
            reasons.append("Mentor feedback is pending.")
            recommendations.append("Request mentor feedback.")

        # If on track and no issues exist, provide positive maintenance recommendation
        if status == AttentionStatus.ON_TRACK.value and not recommendations:
            recommendations.append("Maintain regular progress updates.")

        return ProgressAttentionEngineResult(
            score=score,
            status=status,
            reasons=reasons,
            recommendations=recommendations,
        )


def evaluate_progress_attention(
    progress_consistency: Union[int, float],
    task_completion: Union[int, float],
    report_submission: Union[int, float],
    mentor_feedback: Union[int, float],
) -> ProgressAttentionEngineResult:
    """
    Convenience function invoking ProgressAttentionEngine.evaluate.

    Parameters:
        progress_consistency: Metric from 0 to 100 (30% weight)
        task_completion: Metric from 0 to 100 (30% weight)
        report_submission: Metric from 0 to 100 (20% weight)
        mentor_feedback: Metric from 0 to 100 (20% weight)

    Returns:
        ProgressAttentionEngineResult with score, status, reasons, and recommendations.
    """
    return ProgressAttentionEngine.evaluate(
        progress_consistency=progress_consistency,
        task_completion=task_completion,
        report_submission=report_submission,
        mentor_feedback=mentor_feedback,
    )


calculate_progress_attention = evaluate_progress_attention

