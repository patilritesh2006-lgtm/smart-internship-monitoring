"""
Progress Intelligence Engine for Smart Internship Management & Monitoring System (SIMS).
Calculates an explainable progress health score, categorical status, and evidence-based findings.
"""

import math
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel

from intelligence.app.features.progress_features import (
    ProgressFeatures,
    ProgressTrend,
    extract_progress_features,
)
from intelligence.app.models import (
    AttentionStatus,
    ProgressAttentionEngineResult,
    ProgressHealthResult,
)

# Factor weights (sum to 1.00 / 100%)
# Non-collinear weighting: Consistency, Tasks, Reports, and Mentor Feedback
WEIGHT_PROGRESS_CONSISTENCY = 0.30
WEIGHT_TASK_COMPLETION = 0.30
WEIGHT_REPORT_SUBMISSION = 0.20
WEIGHT_MENTOR_FEEDBACK = 0.20

# Categorical status thresholds
ON_TRACK_THRESHOLD = 75.0
MONITOR_THRESHOLD_SCORE = 50.0

# Metric benchmark threshold for flagging individual deficiency reasons
FACTOR_BENCHMARK_THRESHOLD = 75.0


class ProgressValidationError(ValueError, TypeError):
    """Raised when progress attention inputs fail validation (subclasses ValueError & TypeError)."""
    pass


def _deduplicate(items: List[str]) -> List[str]:
    """Preserves insertion order while eliminating duplicate strings."""
    seen = set()
    result = []
    for item in items:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result


class ProgressAttentionEngine:
    """
    SIMS Progress Health & Attention Engine.
    Evaluates structured internship progress metrics and determines whether a student is:
      - ON_TRACK (75–100)
      - MONITOR (50–74)
      - NEEDS_ATTENTION (0–49)

    Core Factors:
      1. Activity consistency (regularity over time) — 30%
      2. Milestone task completion                   — 30%
      3. Weekly report submission rate               — 20%
      4. Faculty mentor evaluation                   — 20%

    Formula:
      health_score = (activity_consistency * 0.30) +
                     (task_completion * 0.30) +
                     (report_submission * 0.20) +
                     (mentor_feedback * 0.20)
    """

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
        data: Optional[Union[Dict[str, Any], BaseModel, int, float, ProgressFeatures]] = None,
        task_completion: Optional[Union[int, float]] = None,
        report_submission: Optional[Union[int, float]] = None,
        mentor_feedback: Optional[Union[int, float]] = None,
        *,
        progress_consistency: Optional[Union[int, float]] = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """
        Validates and extracts progress metrics from dict, Pydantic model, ProgressFeatures,
        or positional/keyword arguments.
        """
        pc = progress_consistency
        tc = task_completion
        rs = report_submission
        mf = mentor_feedback
        meta: Dict[str, Any] = {}

        # Case 0: ProgressFeatures instance
        if isinstance(data, ProgressFeatures):
            pc = data.activity_consistency
            tc = data.task_completion
            rs = data.report_submission
            mf = data.mentor_feedback if data.mentor_feedback is not None else 75.0
            meta = data.to_dict()

        # Case 1: Empty input check
        elif data == {} or (data is None and pc is None and tc is None and rs is None and mf is None):
            raise ProgressValidationError(
                "Input data cannot be empty. Expected fields: 'progress_consistency', "
                "'task_completion', 'report_submission', 'mentor_feedback'."
            )

        # Case 2: Dict input
        elif isinstance(data, dict):
            required_keys = ["progress_consistency", "task_completion", "report_submission", "mentor_feedback"]
            for key in required_keys:
                if key not in data and kwargs.get(key) is None:
                    # Check if positional / kwargs supplied
                    if key == "progress_consistency" and pc is not None:
                        continue
                    if key == "task_completion" and tc is not None:
                        continue
                    if key == "report_submission" and rs is not None:
                        continue
                    if key == "mentor_feedback" and mf is not None:
                        continue
                    raise ProgressValidationError(f"Missing required progress metric: '{key}'.")
            pc = data.get("progress_consistency", pc)
            tc = data.get("task_completion", tc)
            rs = data.get("report_submission", rs)
            mf = data.get("mentor_feedback", mf)
            meta = {k: v for k, v in data.items() if k not in required_keys}

        # Case 3: Pydantic model input
        elif isinstance(data, BaseModel):
            pc = getattr(data, "progress_consistency", pc)
            tc = getattr(data, "task_completion", tc)
            rs = getattr(data, "report_submission", rs)
            mf = getattr(data, "mentor_feedback", mf)

        # Case 4: Positional single argument for progress_consistency
        elif data is not None and not isinstance(data, (dict, BaseModel)):
            pc = data

        factors = {
            "progress_consistency": pc,
            "task_completion": tc,
            "report_submission": rs,
            "mentor_feedback": mf,
        }

        # Validate each factor strictly
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

        factors["_metadata"] = meta
        return factors

    @classmethod
    def evaluate(
        cls,
        data: Optional[Union[Dict[str, Any], BaseModel, int, float, ProgressFeatures]] = None,
        task_completion: Optional[Union[int, float]] = None,
        report_submission: Optional[Union[int, float]] = None,
        mentor_feedback: Optional[Union[int, float]] = None,
        *,
        progress_consistency: Optional[Union[int, float]] = None,
        **kwargs: Any,
    ) -> ProgressAttentionEngineResult:
        """
        Evaluates progress metrics and returns an explainable progress health result.
        Produces evidence-based explanations and actionable recommendations.
        """
        extracted = cls.validate_and_extract(
            data=data,
            task_completion=task_completion,
            report_submission=report_submission,
            mentor_feedback=mentor_feedback,
            progress_consistency=progress_consistency,
            **kwargs,
        )

        pc = extracted["progress_consistency"]
        tc = extracted["task_completion"]
        rs = extracted["report_submission"]
        mf = extracted["mentor_feedback"]
        meta: Dict[str, Any] = extracted.get("_metadata", {})

        # Calculate overall weighted progress health score
        raw_score = (
            (pc * cls.WEIGHT_PROGRESS_CONSISTENCY)
            + (tc * cls.WEIGHT_TASK_COMPLETION)
            + (rs * cls.WEIGHT_REPORT_SUBMISSION)
            + (mf * cls.WEIGHT_MENTOR_FEEDBACK)
        )
        calc_score = round(raw_score, 2)
        score: Union[int, float] = int(calc_score) if calc_score.is_integer() else calc_score

        # Determine categorical status
        if score >= cls.ON_TRACK_THRESHOLD:
            status = AttentionStatus.ON_TRACK.value
        elif score >= cls.MONITOR_THRESHOLD:
            status = AttentionStatus.MONITOR.value
        else:
            status = AttentionStatus.NEEDS_ATTENTION.value

        # Intervention override: check prolonged inactivity if recency data exists
        days_inactive = meta.get("days_since_last_activity")
        if days_inactive is not None and days_inactive > 21 and status == AttentionStatus.ON_TRACK.value:
            status = AttentionStatus.MONITOR.value

        reasons: List[str] = []
        recommendations: List[str] = []

        # Check if rich feature metadata is present for evidence-based explanations
        has_rich_metadata = bool(meta.get("total_tasks") or meta.get("expected_reports"))

        if has_rich_metadata:
            total_tasks = meta.get("total_tasks", 0)
            completed_tasks = meta.get("completed_tasks", 0)
            incomplete_tasks = meta.get("incomplete_tasks", total_tasks - completed_tasks)
            expected_reports = meta.get("expected_reports", 0)
            submitted_reports = meta.get("submitted_reports", 0)
            missing_reports = meta.get("missing_reports", max(0, expected_reports - submitted_reports))
            next_task = meta.get("next_task_title")
            trend_val = meta.get("progress_trend", "STABLE")

            # 1. Milestone tasks
            if tc < cls.BENCHMARK_THRESHOLD or incomplete_tasks > 0:
                if total_tasks > 0:
                    reasons.append(f"{incomplete_tasks} of {total_tasks} assigned milestone tasks remain incomplete.")
                else:
                    reasons.append("Task completion is below the expected level.")
                
                if next_task:
                    recommendations.append(f"Prioritize the remaining milestone tasks (e.g., '{next_task}').")
                else:
                    recommendations.append("Complete pending tasks.")

            # 2. Weekly reports
            if rs < cls.BENCHMARK_THRESHOLD or missing_reports > 0:
                if expected_reports > 0:
                    reasons.append(f"{missing_reports} of {expected_reports} expected weekly reports have not been submitted.")
                else:
                    reasons.append("Weekly reports are pending.")
                if missing_reports > 0:
                    recommendations.append("Submit the outstanding weekly progress reports.")
                else:
                    recommendations.append("Submit pending weekly reports.")

            # 3. Recency / Inactivity
            if days_inactive is not None and days_inactive > 14:
                reasons.append(f"No internship activity recorded in the last {days_inactive} days.")
                recommendations.append("Record an immediate weekly progress update or milestone completion.")

            # 4. Mentor feedback
            if mf < cls.BENCHMARK_THRESHOLD:
                reasons.append(f"Average mentor evaluation is {round(mf, 1)}% (below {int(cls.BENCHMARK_THRESHOLD)}% benchmark).")
                recommendations.append("Request mentor feedback.")

            # 5. Consistency
            if pc < cls.BENCHMARK_THRESHOLD:
                reasons.append(f"Activity cadence index is {round(pc, 1)}% due to irregular submission intervals.")
                recommendations.append("Maintain regular progress updates.")

            # 6. Trend
            if trend_val == "DECLINING":
                reasons.append("Recent progress velocity and submission regularity are declining.")
                recommendations.append("Schedule a progress review this week.")

            # If on track with no flags
            if not reasons:
                reasons.append("Progress is consistent.")
                recommendations.append("Maintain regular progress updates.")

        else:
            # Fallback to standard clean explanations matching prompt benchmarks
            if tc < cls.BENCHMARK_THRESHOLD:
                reasons.append("Task completion is below the expected level.")
                recommendations.append("Complete pending tasks.")

            if rs < cls.BENCHMARK_THRESHOLD:
                reasons.append("Weekly reports are pending.")
                recommendations.append("Submit pending weekly reports.")

            if mf < cls.BENCHMARK_THRESHOLD:
                reasons.append("Mentor feedback is pending.")
                recommendations.append("Request mentor feedback.")

            if pc < cls.BENCHMARK_THRESHOLD:
                reasons.append("Progress updates are inconsistent.")
                recommendations.append("Maintain regular progress updates.")

            if not reasons:
                reasons.append("Progress is consistent.")
                recommendations.append("Maintain regular progress updates.")

        clean_reasons = _deduplicate(reasons)
        clean_recommendations = _deduplicate(recommendations)

        factors_dict = {
            "progress_consistency": round(float(pc), 2),
            "task_completion": round(float(tc), 2),
            "report_submission": round(float(rs), 2),
            "mentor_feedback": round(float(mf), 2),
        }

        return ProgressAttentionEngineResult(
            score=score,
            progress_health_score=score,
            status=status,
            reasons=clean_reasons,
            recommendations=clean_recommendations,
            trend=meta.get("progress_trend", "STABLE"),
            factors=factors_dict,
            features=meta if meta else None,
        )


def evaluate_progress_attention(
    data: Optional[Union[Dict[str, Any], BaseModel, int, float, ProgressFeatures]] = None,
    task_completion: Optional[Union[int, float]] = None,
    report_submission: Optional[Union[int, float]] = None,
    mentor_feedback: Optional[Union[int, float]] = None,
    *,
    progress_consistency: Optional[Union[int, float]] = None,
    **kwargs: Any,
) -> ProgressAttentionEngineResult:
    """
    Primary API entry point for evaluating progress health and attention.
    """
    return ProgressAttentionEngine.evaluate(
        data=data,
        task_completion=task_completion,
        report_submission=report_submission,
        mentor_feedback=mentor_feedback,
        progress_consistency=progress_consistency,
        **kwargs,
    )


# Backward-compatible function alias
calculate_progress_attention = evaluate_progress_attention
