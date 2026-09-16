"""
Data models and schemas for the Intelligence & Analytics module.
FastAPI-compatible using Pydantic v2.
"""

from enum import Enum
from typing import List, Optional, Union
from pydantic import BaseModel, ConfigDict, Field


class ProgressTrend(str, Enum):
    """Trend direction for intern's recent progress."""
    IMPROVING = "improving"
    STABLE = "stable"
    DECLINING = "declining"


class ProgressStatus(str, Enum):
    """Categorical attention status for internship progress."""
    ON_TRACK = "On Track"
    MONITOR = "Monitor"
    NEEDS_ATTENTION = "Needs Attention"


class SkillGapRequest(BaseModel):
    """Request model for skill gap evaluation."""
    student_skills: List[str] = Field(
        default_factory=list,
        description="List of skills possessed by the student"
    )
    required_skills: List[str] = Field(
        default_factory=list,
        description="List of required internship skills"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "student_skills": ["Python", "SQL", "Excel"],
                "required_skills": ["Python", "SQL", "Power BI", "Tableau"]
            }
        }
    )


class SkillGapResult(BaseModel):
    """Result model for skill gap evaluation."""
    matched_skills: List[str] = Field(
        description="Skills matched between student and requirements"
    )
    missing_skills: List[str] = Field(
        description="Required skills that student currently lacks"
    )
    match_percentage: Union[int, float] = Field(
        ge=0,
        le=100,
        description="Percentage of required skills matched (0 to 100)"
    )
    recommendation: Optional[str] = Field(
        default=None,
        description="Optional action-oriented learning recommendation"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "matched_skills": ["Python", "SQL"],
                "missing_skills": ["Power BI", "Tableau"],
                "match_percentage": 50,
                "recommendation": "Consider improving Power BI and Tableau skills."
            }
        }
    )

    def __getitem__(self, item: str):
        if hasattr(self, item):
            return getattr(self, item)
        raise KeyError(item)

    def get(self, key: str, default=None):
        return getattr(self, key, default)

    def __contains__(self, key: str) -> bool:
        return hasattr(self, key)


class ProgressData(BaseModel):
    """Input model representing student internship activity metrics."""
    student_id: Optional[str] = Field(
        default=None,
        description="Optional unique identifier for the student/intern"
    )
    student_name: Optional[str] = Field(
        default=None,
        description="Optional student display name"
    )
    reports_submitted: int = Field(
        ge=0,
        description="Number of periodic reports submitted so far"
    )
    reports_expected: int = Field(
        ge=0,
        description="Number of periodic reports expected up to this date"
    )
    tasks_completed: int = Field(
        ge=0,
        description="Number of assigned tasks successfully completed"
    )
    tasks_total: int = Field(
        ge=0,
        description="Total number of assigned tasks"
    )
    mentor_feedback_pending: bool = Field(
        default=False,
        description="Whether a mentor review/feedback session is currently pending"
    )
    progress_trend: str = Field(
        default="stable",
        description="Recent trend: 'improving', 'stable', or 'declining'"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "student_id": "INT-2026-001",
                "student_name": "Alex Smith",
                "reports_submitted": 3,
                "reports_expected": 4,
                "tasks_completed": 8,
                "tasks_total": 10,
                "mentor_feedback_pending": True,
                "progress_trend": "stable"
            }
        }
    )


class ProgressBreakdown(BaseModel):
    """Detailed score deductions/penalties for full explainability."""
    report_penalty: float = Field(
        description="Penalty contribution from overdue/unsubmitted reports"
    )
    task_penalty: float = Field(
        description="Penalty contribution from incomplete tasks"
    )
    mentor_penalty: float = Field(
        description="Penalty contribution from pending mentor feedback"
    )
    trend_penalty: float = Field(
        description="Penalty/mitigation adjustment from recent trend"
    )


class ProgressAttentionResult(BaseModel):
    """Result model containing the attention score, status, and explainable reasons."""
    score: float = Field(
        ge=0.0,
        le=100.0,
        description="Attention score (0-100). Higher scores indicate greater need for attention/intervention"
    )
    status: ProgressStatus = Field(
        description="Categorical status: 'On Track', 'Monitor', or 'Needs Attention'"
    )
    reasons: List[str] = Field(
        default_factory=list,
        description="Human-readable explanations for any flagged issues"
    )
    breakdown: Optional[ProgressBreakdown] = Field(
        default=None,
        description="Breakdown of individual scoring components"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "score": 38.75,
                "status": "Monitor",
                "reasons": [
                    "Reports are pending (3 of 4 submitted)",
                    "Mentor feedback is pending"
                ],
                "breakdown": {
                    "report_penalty": 8.75,
                    "task_penalty": 7.0,
                    "mentor_penalty": 15.0,
                    "trend_penalty": 8.0
                }
            }
        }
    )
