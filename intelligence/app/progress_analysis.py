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
# Internship Progress Attention Engine (Prompt 4 Refined)
# ---------------------------------------------------------------------------
import math
from pydantic import BaseModel

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


class ProgressValidationError(ValueError, TypeError):
    """Raised when progress attention inputs fail validation (subclasses ValueError & TypeError)."""
    pass


def _deduplicate(items: List[str]) -> List[str]:
    """Preserves order while eliminating duplicate strings."""
    seen = set()
    result = []
    for item in items:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result


class ProgressAttentionEngine:
    """
    Internship Progress Attention Engine.
    Analyzes structured internship progress data and determines whether a student is:
      - ON_TRACK (75–100)
      - MONITOR (50–74)
      - NEEDS_ATTENTION (0–49)

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
    def validate_and_extract(
        cls,
        data: Optional[Union[Dict[str, Any], BaseModel, int, float]] = None,
        task_completion: Optional[Union[int, float]] = None,
        report_submission: Optional[Union[int, float]] = None,
        mentor_feedback: Optional[Union[int, float]] = None,
        *,
        progress_consistency: Optional[Union[int, float]] = None,
        **kwargs: Any,
    ) -> Dict[str, Union[int, float]]:
        """
        Validates and extracts the 4 required progress metrics from dict, model,
        or positional/keyword arguments.
        """
        pc = progress_consistency
        tc = task_completion
        rs = report_submission
        mf = mentor_feedback

        # Case 1: Empty input check
        if data == {} or (data is None and pc is None and tc is None and rs is None and mf is None):
            raise ProgressValidationError(
                "Input data cannot be empty. Expected fields: 'progress_consistency', "
                "'task_completion', 'report_submission', 'mentor_feedback'."
            )

        # Case 2: Dict input
        if isinstance(data, dict):
            required_keys = ["progress_consistency", "task_completion", "report_submission", "mentor_feedback"]
            for key in required_keys:
                if key not in data:
                    raise ProgressValidationError(f"Missing required progress metric: '{key}'.")
            pc = data.get("progress_consistency", pc)
            tc = data.get("task_completion", tc)
            rs = data.get("report_submission", rs)
            mf = data.get("mentor_feedback", mf)
        # Case 3: Pydantic model input
        elif isinstance(data, BaseModel):
            pc = getattr(data, "progress_consistency", pc)
            tc = getattr(data, "task_completion", tc)
            rs = getattr(data, "report_submission", rs)
            mf = getattr(data, "mentor_feedback", mf)
        # Case 4: Positional argument
        elif data is not None and not isinstance(data, (dict, BaseModel)):
            pc = data

        factors = {
            "progress_consistency": pc,
            "task_completion": tc,
            "report_submission": rs,
            "mentor_feedback": mf,
        }

        # Validate each factor
        for name, val in factors.items():
            if val is None:
                raise ProgressValidationError(
                    f"Metric '{name}' must be a numeric value (int or float), not None."
                )
            if isinstance(val, bool):
                raise ProgressValidationError(
                    f"Metric '{name}' must be a numeric value (int or float), not boolean."
                )
            if not isinstance(val, (int, float)):
                raise ProgressValidationError(
                    f"Metric '{name}' must be a numeric value (int or float). Got: {type(val).__name__}"
                )
            if math.isnan(val) or math.isinf(val):
                raise ProgressValidationError(f"Metric '{name}' must be a finite number.")
            if val < 0 or val > 100:
                raise ProgressValidationError(
                    f"Metric '{name}' must be between 0 and 100 inclusive. Received: {val}"
                )

        return factors

    @classmethod
    def evaluate(
        cls,
        data: Optional[Union[Dict[str, Any], BaseModel, int, float]] = None,
        task_completion: Optional[Union[int, float]] = None,
        report_submission: Optional[Union[int, float]] = None,
        mentor_feedback: Optional[Union[int, float]] = None,
        *,
        progress_consistency: Optional[Union[int, float]] = None,
        **kwargs: Any,
    ) -> ProgressAttentionEngineResult:
        """
        Evaluates progress metrics and returns an explainable attention result.
        Accepts structured data (dict / Pydantic model) or direct arguments.
        """
        metrics = cls.validate_and_extract(
            data=data,
            task_completion=task_completion,
            report_submission=report_submission,
            mentor_feedback=mentor_feedback,
            progress_consistency=progress_consistency,
            **kwargs,
        )

        pc = metrics["progress_consistency"]
        tc = metrics["task_completion"]
        rs = metrics["report_submission"]
        mf = metrics["mentor_feedback"]

        # Calculate overall weighted score
        raw_score = (
            (pc * cls.WEIGHT_PROGRESS_CONSISTENCY)
            + (tc * cls.WEIGHT_TASK_COMPLETION)
            + (rs * cls.WEIGHT_REPORT_SUBMISSION)
            + (mf * cls.WEIGHT_MENTOR_FEEDBACK)
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

        # Explainable reasons & recommendations for low factors:
        # 1. Task completion
        if tc < cls.BENCHMARK_THRESHOLD:
            reasons.append("Task completion is below the expected level.")
            recommendations.append("Complete pending tasks.")

        # 2. Weekly reports
        if rs < cls.BENCHMARK_THRESHOLD:
            reasons.append("Weekly reports are pending.")
            recommendations.append("Submit pending weekly reports.")

        # 3. Mentor feedback
        if mf < cls.BENCHMARK_THRESHOLD:
            reasons.append("Mentor feedback is pending.")
            recommendations.append("Request mentor feedback.")

        # 4. Progress consistency
        if pc < cls.BENCHMARK_THRESHOLD:
            reasons.append("Progress updates are inconsistent.")
            recommendations.append("Maintain regular progress updates.")

        # If all factors meet or exceed benchmark (no low factors flagged)
        if not reasons:
            reasons.append("Progress is consistent.")
            recommendations.append("Maintain regular progress updates.")

        # Ensure reasons and recommendations are strictly deduplicated
        clean_reasons = _deduplicate(reasons)
        clean_recommendations = _deduplicate(recommendations)

        return ProgressAttentionEngineResult(
            score=score,
            status=status,
            reasons=clean_reasons,
            recommendations=clean_recommendations,
        )


def evaluate_progress_attention(
    data: Optional[Union[Dict[str, Any], BaseModel, int, float]] = None,
    task_completion: Optional[Union[int, float]] = None,
    report_submission: Optional[Union[int, float]] = None,
    mentor_feedback: Optional[Union[int, float]] = None,
    *,
    progress_consistency: Optional[Union[int, float]] = None,
    **kwargs: Any,
) -> ProgressAttentionEngineResult:
    """
    Convenience function invoking ProgressAttentionEngine.evaluate.

    Supports structured dictionary input:
        evaluate_progress_attention({
            "progress_consistency": 80,
            "task_completion": 70,
            "report_submission": 100,
            "mentor_feedback": 50
        })

    Or individual parameters:
        evaluate_progress_attention(80, 70, 100, 50)
    """
    return ProgressAttentionEngine.evaluate(
        data=data,
        task_completion=task_completion,
        report_submission=report_submission,
        mentor_feedback=mentor_feedback,
        progress_consistency=progress_consistency,
        **kwargs,
    )


calculate_progress_attention = evaluate_progress_attention


