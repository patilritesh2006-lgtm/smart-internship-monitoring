"""
Intelligence and Analytics Module for Smart Internship Management and Monitoring System.
"""

from intelligence.app.models import (
    AttentionStatus,
    ProgressAttentionEngineResult,
    ProgressAttentionResult,
    ProgressBreakdown,
    ProgressData,
    ProgressStatus,
    ProgressTrend,
    SkillGapRequest,
    SkillGapResult,
)
from intelligence.app.progress_analysis import (
    MONITOR_THRESHOLD_SCORE,
    ON_TRACK_THRESHOLD,
    ProgressAttentionEngine,
    ProgressValidationError,
    analyze_progress_attention,
    batch_analyze_progress,
    calculate_attention_score,
    calculate_progress_attention,
    evaluate_progress_attention,
)
from intelligence.app.skill_gap import (
    analyze_skill_gap,
    batch_analyze_skill_gaps,
    generate_skill_recommendation,
)

__all__ = [
    "SkillGapRequest",
    "SkillGapResult",
    "ProgressTrend",
    "ProgressStatus",
    "AttentionStatus",
    "ProgressData",
    "ProgressBreakdown",
    "ProgressAttentionResult",
    "ProgressAttentionEngineResult",
    "ProgressAttentionEngine",
    "ProgressValidationError",
    "evaluate_progress_attention",
    "calculate_progress_attention",
    "ON_TRACK_THRESHOLD",
    "MONITOR_THRESHOLD_SCORE",
    "analyze_skill_gap",
    "generate_skill_recommendation",
    "batch_analyze_skill_gaps",
    "calculate_attention_score",
    "analyze_progress_attention",
    "batch_analyze_progress",
]

