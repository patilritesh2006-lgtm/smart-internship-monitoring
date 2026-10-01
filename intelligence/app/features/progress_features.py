"""
Feature Engineering Layer for SIMS Progress Intelligence Engine.
Transforms raw internship database records (tasks, weekly reports, timestamps)
into a structured, typed feature representation.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Union
import math


class ProgressTrend(str, Enum):
    """Categorical trend direction for student internship progress."""
    IMPROVING = "IMPROVING"
    STABLE = "STABLE"
    DECLINING = "DECLINING"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


@dataclass
class ProgressFeatures:
    """
    Typed feature representation for a student's internship progress.
    Contains 10 standard features covering performance, engagement, cadence, and supervision.
    """
    # 1. Performance: % of assigned milestone tasks completed (0.0 to 100.0)
    task_completion: float = 0.0

    # 2. Engagement: % of expected weekly reports submitted (0.0 to 100.0)
    report_submission: float = 0.0

    # 3. Supervision: Average mentor evaluation score across reviewed reports (0.0 to 100.0 or None)
    mentor_feedback: Optional[float] = None

    # 4. Attendance: Attendance rate (0.0 to 100.0).
    # NOTE: The current SIMS database schema does not have an attendance/check-in table.
    # Safe default: None (documented limitation, not fabricated).
    attendance_rate: Optional[float] = None

    # 5. Velocity: Milestone tasks completed per elapsed week
    task_velocity: float = 0.0

    # 6. Punctuality: % of reports submitted within or before their expected weekly deadline (0.0 to 100.0)
    report_punctuality: Optional[float] = None

    # 7. Recency: Number of calendar days since the student's last recorded task/report/start activity
    days_since_last_activity: Optional[int] = None

    # 8. Consistency: Genuine temporal consistency index (0.0 to 100.0) based on submission cadence and gaps
    activity_consistency: float = 100.0

    # 9. Trend: Direction of recent progress (IMPROVING, STABLE, DECLINING, INSUFFICIENT_DATA)
    progress_trend: ProgressTrend = ProgressTrend.INSUFFICIENT_DATA

    # 10. Horizon: Calendar days remaining until scheduled internship conclusion
    days_remaining: Optional[int] = None

    # Metadata for evidence-based reporting and traceability
    total_tasks: int = 0
    completed_tasks: int = 0
    incomplete_tasks: int = 0
    overdue_tasks: int = 0
    is_early_stage: bool = False
    expected_reports: int = 0
    submitted_reports: int = 0
    missing_reports: int = 0
    reviewed_reports_count: int = 0
    elapsed_weeks: int = 0
    duration_weeks: int = 8
    next_task_title: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Serializes features into a dictionary."""
        return {
            "task_completion": round(self.task_completion, 1),
            "report_submission": round(self.report_submission, 1),
            "mentor_feedback": round(self.mentor_feedback, 1) if self.mentor_feedback is not None else None,
            "attendance_rate": self.attendance_rate,
            "task_velocity": round(self.task_velocity, 2),
            "report_punctuality": round(self.report_punctuality, 1) if self.report_punctuality is not None else None,
            "days_since_last_activity": self.days_since_last_activity,
            "activity_consistency": round(self.activity_consistency, 1),
            "progress_trend": self.progress_trend.value if isinstance(self.progress_trend, ProgressTrend) else str(self.progress_trend),
            "days_remaining": self.days_remaining,
            "total_tasks": self.total_tasks,
            "completed_tasks": self.completed_tasks,
            "incomplete_tasks": self.incomplete_tasks,
            "overdue_tasks": self.overdue_tasks,
            "is_early_stage": self.is_early_stage,
            "expected_reports": self.expected_reports,
            "submitted_reports": self.submitted_reports,
            "missing_reports": self.missing_reports,
            "reviewed_reports_count": self.reviewed_reports_count,
            "elapsed_weeks": self.elapsed_weeks,
            "duration_weeks": self.duration_weeks,
            "next_task_title": self.next_task_title,
        }


def _ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Ensures a datetime object is timezone-aware in UTC."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def extract_progress_features(
    tasks: Optional[List[Any]] = None,
    reports: Optional[List[Any]] = None,
    internship: Optional[Any] = None,
    now: Optional[datetime] = None,
    *,
    task_completion: Optional[float] = None,
    report_submission: Optional[float] = None,
    mentor_feedback: Optional[float] = None,
    progress_consistency: Optional[float] = None,
) -> ProgressFeatures:
    """
    Extracts the 10 progress intelligence features from raw database models or precomputed factors.
    Supports both ORM entity inputs (tasks, reports, internship) and direct factor dictionaries.
    """
    current_time = _ensure_utc(now) or datetime.now(timezone.utc)

    # --------------------------------------------------------------------------
    # FAST PATH: Direct factor override (e.g. from simulation endpoint or tests)
    # --------------------------------------------------------------------------
    if tasks is None and reports is None and internship is None:
        tc = max(0.0, min(100.0, float(task_completion if task_completion is not None else 100.0)))
        rs = max(0.0, min(100.0, float(report_submission if report_submission is not None else 100.0)))
        mf = float(mentor_feedback) if mentor_feedback is not None else None
        
        # If real consistency provided, use it; otherwise compute initial sensible baseline
        if progress_consistency is not None:
            ac = max(0.0, min(100.0, float(progress_consistency)))
        else:
            ac = rs  # Submission regularity proxy when raw timestamps unavailable

        trend = ProgressTrend.STABLE
        if tc < 50.0 or rs < 50.0:
            trend = ProgressTrend.DECLINING
        elif tc >= 75.0 and rs >= 75.0:
            trend = ProgressTrend.IMPROVING

        return ProgressFeatures(
            task_completion=tc,
            report_submission=rs,
            mentor_feedback=mf,
            attendance_rate=None,
            task_velocity=round(tc / 10.0, 2),
            report_punctuality=rs,
            days_since_last_activity=2 if rs >= 50 else 14,
            activity_consistency=ac,
            progress_trend=trend,
            days_remaining=30,
            total_tasks=10,
            completed_tasks=int(round(tc / 10.0)),
            incomplete_tasks=10 - int(round(tc / 10.0)),
            expected_reports=5,
            submitted_reports=int(round((rs / 100.0) * 5)),
            missing_reports=max(0, 5 - int(round((rs / 100.0) * 5))),
            reviewed_reports_count=1 if mf is not None else 0,
            elapsed_weeks=5,
            duration_weeks=10,
            next_task_title="Next scheduled sprint milestone",
        )

    # --------------------------------------------------------------------------
    # FULL EXTRACTION: Real ORM / Entity data processing
    # --------------------------------------------------------------------------
    task_list = tasks or []
    report_list = reports or []

    # 1. Timeline & Duration
    duration_weeks = 8
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

    if internship:
        duration_weeks = getattr(internship, "duration_weeks", 8) or 8
        start_date = _ensure_utc(getattr(internship, "start_date", None))
        end_date = _ensure_utc(getattr(internship, "end_date", None))

    if start_date:
        days_active = max(0, (current_time - start_date).days)
        elapsed_weeks = min(max(1, days_active // 7), duration_weeks)
    else:
        days_active = 0
        elapsed_weeks = max(1, len(report_list))

    is_early_stage = bool(internship is None or start_date is None or days_active < 7)

    # Days remaining calculation
    days_remaining: Optional[int] = None
    if end_date:
        days_remaining = max(0, (end_date - current_time).days)
    elif start_date:
        from datetime import timedelta
        calculated_end = start_date + timedelta(weeks=duration_weeks)
        days_remaining = max(0, (calculated_end - current_time).days)

    # 2. Task Feature Derivation
    total_tasks = len(task_list)
    completed_tasks = sum(1 for t in task_list if getattr(t, "is_completed", False))
    incomplete_tasks = total_tasks - completed_tasks

    overdue_tasks = 0
    future_due_tasks = 0
    for t in task_list:
        if not getattr(t, "is_completed", False):
            t_due = _ensure_utc(getattr(t, "due_date", None))
            if t_due is not None:
                if t_due < current_time:
                    overdue_tasks += 1
                else:
                    future_due_tasks += 1

    if total_tasks > 0:
        all_incomplete_are_future = incomplete_tasks > 0 and overdue_tasks == 0 and future_due_tasks == incomplete_tasks
        if overdue_tasks == 0 and (is_early_stage or all_incomplete_are_future):
            # Newly assigned or upcoming tasks with future due dates and zero overdue tasks
            task_completion_pct = 100.0
        else:
            task_completion_pct = (completed_tasks / total_tasks) * 100.0
    else:
        # If no tasks have been assigned yet, 100% baseline with note
        task_completion_pct = 100.0

    # Task velocity: completed tasks per elapsed week
    task_velocity = completed_tasks / max(1, elapsed_weeks)

    # Find title of next incomplete task for specific recommendations
    next_task_title: Optional[str] = None
    for t in task_list:
        if not getattr(t, "is_completed", False):
            next_task_title = getattr(t, "title", None)
            if next_task_title:
                break

    # 3. Weekly Report Feature Derivation
    submitted_reports = len(report_list)
    if is_early_stage:
        # First week has not yet elapsed (or no active internship yet): no weekly report is overdue
        expected_reports = submitted_reports
        missing_reports = 0
        report_submission_pct = 100.0
    else:
        expected_reports = elapsed_weeks
        missing_reports = max(0, expected_reports - submitted_reports)
        if expected_reports > 0:
            report_submission_pct = min(100.0, (submitted_reports / expected_reports) * 100.0)
        else:
            report_submission_pct = 100.0

    # 4. Mentor Feedback Derivation
    reviewed_scores = [
        getattr(r, "mentor_score")
        for r in report_list
        if getattr(r, "mentor_score", None) is not None
    ]
    reviewed_count = len(reviewed_scores)
    if reviewed_scores:
        mentor_feedback_avg: Optional[float] = sum(reviewed_scores) / reviewed_count
    else:
        mentor_feedback_avg = None

    # 5. Activity Recency (Days since last activity)
    activity_timestamps: List[datetime] = []

    for t in task_list:
        c_at = _ensure_utc(getattr(t, "completed_at", None))
        if c_at:
            activity_timestamps.append(c_at)

    for r in report_list:
        s_at = _ensure_utc(getattr(r, "submitted_at", None))
        if s_at:
            activity_timestamps.append(s_at)

    if start_date:
        activity_timestamps.append(start_date)

    if activity_timestamps:
        latest_activity = max(activity_timestamps)
        days_since_last_activity = max(0, (current_time - latest_activity).days)
    else:
        days_since_last_activity = None

    # 6. Report Punctuality Rate
    punctual_count = 0
    total_evaluable_reports = 0

    if start_date:
        for r in report_list:
            s_at = _ensure_utc(getattr(r, "submitted_at", None))
            w_num = getattr(r, "week_number", None)
            if s_at and w_num:
                total_evaluable_reports += 1
                from datetime import timedelta
                # Week N deadline is start_date + N weeks + 3 days grace
                deadline = start_date + timedelta(days=(w_num * 7) + 3)
                if s_at <= deadline:
                    punctual_count += 1

    if total_evaluable_reports > 0:
        report_punctuality = (punctual_count / total_evaluable_reports) * 100.0
    else:
        report_punctuality = report_submission_pct if submitted_reports > 0 else 100.0

    # --------------------------------------------------------------------------
    # 7. Real Activity Consistency Calculation (Task 3)
    # Measures actual regularity over time instead of duplicate 0.5*T + 0.5*R
    # --------------------------------------------------------------------------
    # Factor A: Weekly reporting coverage across elapsed weeks (50%)
    submitted_week_numbers = {
        getattr(r, "week_number", 0) for r in report_list if getattr(r, "week_number", None)
    }
    if expected_reports == 0:
        week_coverage_ratio = 100.0
    else:
        covered_expected_weeks = sum(1 for w in range(1, expected_reports + 1) if w in submitted_week_numbers)
        week_coverage_ratio = (covered_expected_weeks / max(1, expected_reports)) * 100.0

    # Factor B: Recency cadence score (30%)
    if days_since_last_activity is None:
        recency_score = 100.0 if (is_early_stage and overdue_tasks == 0) else 75.0
    elif days_since_last_activity <= 7:
        recency_score = 100.0
    elif days_since_last_activity <= 14:
        recency_score = 80.0
    elif days_since_last_activity <= 21:
        recency_score = 50.0
    else:
        # Severe penalty for inactive terms exceeding 3 weeks
        recency_score = max(0.0, 50.0 - float(days_since_last_activity - 21) * 3.0)

    # Factor C: Punctuality / Cadence index (20%)
    cadence_score = report_punctuality if report_punctuality is not None else 80.0

    # Weighted real consistency
    activity_consistency = (
        (week_coverage_ratio * 0.50) +
        (recency_score * 0.30) +
        (cadence_score * 0.20)
    )
    if overdue_tasks > 0 and total_tasks > 0:
        overdue_penalty = (overdue_tasks / total_tasks) * 45.0
        activity_consistency = max(0.0, activity_consistency - overdue_penalty)
    activity_consistency = max(0.0, min(100.0, activity_consistency))

    # --------------------------------------------------------------------------
    # 8. Deterministic Progress Trend (Task 4)
    # Evaluates temporal trajectory using available report scores and activity
    # --------------------------------------------------------------------------
    progress_trend = ProgressTrend.INSUFFICIENT_DATA

    # Case A: Trend based on sequential mentor report scores
    if len(reviewed_scores) >= 2:
        # Compare second half vs first half
        mid = len(reviewed_scores) // 2
        first_half = reviewed_scores[:mid]
        second_half = reviewed_scores[mid:]
        avg_early = sum(first_half) / len(first_half)
        avg_recent = sum(second_half) / len(second_half)
        delta = avg_recent - avg_early

        if delta >= 4.0:
            progress_trend = ProgressTrend.IMPROVING
        elif delta <= -4.0:
            progress_trend = ProgressTrend.DECLINING
        else:
            progress_trend = ProgressTrend.STABLE

    # Case B: If fewer than 2 reviewed scores, determine from submission regularity
    elif elapsed_weeks >= 2:
        if missing_reports >= 2 or (days_since_last_activity is not None and days_since_last_activity > 14):
            progress_trend = ProgressTrend.DECLINING
        elif completed_tasks > 0 and missing_reports == 0:
            progress_trend = ProgressTrend.IMPROVING
        else:
            progress_trend = ProgressTrend.STABLE
    else:
        progress_trend = ProgressTrend.INSUFFICIENT_DATA

    return ProgressFeatures(
        task_completion=round(task_completion_pct, 2),
        report_submission=round(report_submission_pct, 2),
        mentor_feedback=round(mentor_feedback_avg, 2) if mentor_feedback_avg is not None else None,
        attendance_rate=None,  # Documented schema limitation
        task_velocity=round(task_velocity, 2),
        report_punctuality=round(report_punctuality, 2) if report_punctuality is not None else None,
        days_since_last_activity=days_since_last_activity,
        activity_consistency=round(activity_consistency, 2),
        progress_trend=progress_trend,
        days_remaining=days_remaining,
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        incomplete_tasks=incomplete_tasks,
        overdue_tasks=overdue_tasks,
        is_early_stage=is_early_stage,
        expected_reports=expected_reports,
        submitted_reports=submitted_reports,
        missing_reports=missing_reports,
        reviewed_reports_count=reviewed_count,
        elapsed_weeks=elapsed_weeks,
        duration_weeks=duration_weeks,
        next_task_title=next_task_title,
    )
