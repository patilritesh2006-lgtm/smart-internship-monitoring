"""
Intelligence and Analytics Module for Smart Internship Management and Monitoring System (SIMS).
"""

from intelligence.app.features import (
    ProgressFeatures,
    ProgressTrend,
    extract_progress_features,
)
from intelligence.app.models import (
    AttentionStatus,
    ProgressAttentionEngineResult,
    ProgressHealthResult,
    ProgressStatus,
    SkillGapRequest,
    SkillGapResult,
)
from intelligence.app.progress_analysis import (
    MONITOR_THRESHOLD_SCORE,
    ON_TRACK_THRESHOLD,
    ProgressAttentionEngine,
    ProgressValidationError,
    calculate_progress_attention,
    evaluate_progress_attention,
)
from intelligence.app.skill_gap import (
    analyze_skill_gap,
    batch_analyze_skill_gaps,
    generate_skill_recommendation,
)

__all__ = [
    # Features
    "ProgressFeatures",
    "ProgressTrend",
    "extract_progress_features",
    # Models & Enums
    "AttentionStatus",
    "ProgressStatus",
    "ProgressAttentionEngineResult",
    "ProgressHealthResult",
    "SkillGapRequest",
    "SkillGapResult",
    # Engine Functions
    "ProgressAttentionEngine",
    "ProgressValidationError",
    "evaluate_progress_attention",
    "calculate_progress_attention",
    "ON_TRACK_THRESHOLD",
    "MONITOR_THRESHOLD_SCORE",
    # Skill Gap
    "analyze_skill_gap",
    "generate_skill_recommendation",
    "batch_analyze_skill_gaps",
]
