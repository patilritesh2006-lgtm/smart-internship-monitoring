"""
Data models and schemas for the Intelligence & Analytics module.
FastAPI-compatible using Pydantic v2.
"""

from enum import Enum
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, ConfigDict, Field
import warnings


# ==============================================================================
# 1. Enums
# ==============================================================================

class AttentionStatus(str, Enum):
    """Categorical progress/attention status for internship monitoring."""
    ON_TRACK = "ON_TRACK"
    MONITOR = "MONITOR"
    NEEDS_ATTENTION = "NEEDS_ATTENTION"


class ProgressTrend(str, Enum):
    """Trend trajectory for intern's recent progress."""
    IMPROVING = "IMPROVING"
    STABLE = "STABLE"
    DECLINING = "DECLINING"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


# Backward-compatible alias for deprecated ProgressStatus
ProgressStatus = AttentionStatus


# ==============================================================================
# 2. Skill Gap Models
# ==============================================================================

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
        description="Action-oriented learning recommendation"
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


# ==============================================================================
# 3. Active Intelligence Engine Result Models
# ==============================================================================

class ProgressAttentionEngineResult(BaseModel):
    """
    Structured result from the Internship Progress Health & Attention Engine.
    Represents an explainable health score, categorical status, and evidence-based findings.
    """
    # Backward compatible field (synonymous with progress_health_score)
    score: Union[int, float] = Field(
        ge=0,
        le=100,
        description="Overall progress health score (0 to 100). Higher is better."
    )
    progress_health_score: Optional[Union[int, float]] = Field(
        default=None,
        description="Explicit progress health score (0 to 100)."
    )
    status: str = Field(
        description="Progress status: 'ON_TRACK', 'MONITOR', or 'NEEDS_ATTENTION'"
    )
    reasons: List[str] = Field(
        default_factory=list,
        description="Evidence-based explanations clarifying the evaluated status"
    )
    recommendations: List[str] = Field(
        default_factory=list,
        description="Deterministic actionable recommendations based on detected deficiencies"
    )
    trend: Optional[str] = Field(
        default="STABLE",
        description="Recent progress trend: 'IMPROVING', 'STABLE', 'DECLINING', or 'INSUFFICIENT_DATA'"
    )
    factors: Optional[Dict[str, float]] = Field(
        default=None,
        description="4-factor component breakdown (consistency, tasks, reports, mentor)"
    )
    features: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Full 10-feature engineered profile dictionary"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "score": 82.4,
                "progress_health_score": 82.4,
                "status": "ON_TRACK",
                "trend": "STABLE",
                "reasons": [
                    "All 4 assigned milestone tasks completed on schedule.",
                    "Logged 4 weekly reports with verified mentor feedback."
                ],
                "recommendations": [
                    "Maintain regular weekly logging and continue sprint milestones."
                ],
                "factors": {
                    "progress_consistency": 85.0,
                    "task_completion": 80.0,
                    "report_submission": 80.0,
                    "mentor_feedback": 92.2
                }
            }
        }
    )

    def model_post_init(self, __context: Any) -> None:
        if self.progress_health_score is None:
            self.progress_health_score = self.score

    def __getitem__(self, item: str):
        if hasattr(self, item):
            return getattr(self, item)
        raise KeyError(item)

    def get(self, key: str, default=None):
        return getattr(self, key, default)

    def __contains__(self, key: str) -> bool:
        return hasattr(self, key)


# Primary alias
ProgressHealthResult = ProgressAttentionEngineResult


# ==============================================================================
# 4. Deprecated Legacy Models (Retained with warnings for backward compatibility)
# ==============================================================================

class ProgressData(BaseModel):
    """
    [DEPRECATED] Legacy penalty input model.
    Use `intelligence.app.features.ProgressFeatures` instead.
    """
    student_id: Optional[str] = None
    student_name: Optional[str] = None
    reports_submitted: int = 0
    reports_expected: int = 0
    tasks_completed: int = 0
    tasks_total: int = 0
    mentor_feedback_pending: bool = False
    progress_trend: str = "stable"


class ProgressBreakdown(BaseModel):
    """
    [DEPRECATED] Legacy penalty breakdown model.
    """
    report_penalty: float = 0.0
    task_penalty: float = 0.0
    mentor_penalty: float = 0.0
    trend_penalty: float = 0.0


class ProgressAttentionResult(BaseModel):
    """
    [DEPRECATED] Legacy penalty result model.
    Use `ProgressAttentionEngineResult` / `ProgressHealthResult` instead.
    """
    score: float = 0.0
    status: Any = AttentionStatus.ON_TRACK
    reasons: List[str] = Field(default_factory=list)
    breakdown: Optional[ProgressBreakdown] = None
