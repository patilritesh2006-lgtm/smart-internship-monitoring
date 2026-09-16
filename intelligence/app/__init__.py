"""
Intelligence and Analytics Module for Smart Internship Management and Monitoring System.
"""

from intelligence.app.models import (
    ProgressAttentionResult,
    ProgressBreakdown,
    ProgressData,
    ProgressStatus,
    ProgressTrend,
    SkillGapRequest,
    SkillGapResult,
)
from intelligence.app.progress_analysis import (
    analyze_progress_attention,
    batch_analyze_progress,
    calculate_attention_score,
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
    "ProgressData",
    "ProgressBreakdown",
    "ProgressAttentionResult",
    "analyze_skill_gap",
    "generate_skill_recommendation",
    "batch_analyze_skill_gaps",
    "calculate_attention_score",
    "analyze_progress_attention",
    "batch_analyze_progress",
]
