"""
Synthetic Training Dataset Generator for SIMS ML Early-Warning Intelligence.

DISCLAIMER:
"Model trained on synthetic demonstration data."
"The model is evaluated on synthetic demonstration data generated from simulated internship behavior patterns. These metrics demonstrate pipeline behavior and do not establish real-world predictive validity."
This dataset is generated for prototype demonstration and structural verification.
It does not represent real institutional student records.
"""

from typing import Optional, Tuple
import numpy as np
import pandas as pd


RANDOM_SEED = 42
DEFAULT_SAMPLE_COUNT = 3000
DEFAULT_CHECKPOINTS_PER_STUDENT = 5

# Canonical feature columns used by the ML pipeline
ML_NUMERIC_FEATURES = [
    "task_completion",
    "report_submission",
    "mentor_feedback",
    "task_velocity",
    "report_punctuality",
    "days_since_last_activity",
    "activity_consistency",
    "days_remaining",
]

ML_CATEGORICAL_FEATURES = ["progress_trend"]

ALL_FEATURE_COLUMNS = ML_NUMERIC_FEATURES + ML_CATEGORICAL_FEATURES
TARGET_COLUMN = "risk_label"
GROUP_COLUMN = "synthetic_student_id"


def generate_synthetic_dataset(
    n_samples: int = DEFAULT_SAMPLE_COUNT,
    random_seed: int = RANDOM_SEED,
    checkpoints_per_student: int = DEFAULT_CHECKPOINTS_PER_STUDENT,
) -> pd.DataFrame:
    """
    Generates a deterministic synthetic dataset simulating realistic student progress states
    across longitudinal internship checkpoints.

    Group-Aware Architecture:
      Rows are structured by distinct synthetic students (`synthetic_student_id`),
      enabling group-aware splitting to strictly evaluate generalization across unseen students
      rather than leaking longitudinal states from the same student across splits.

    Features generated:
      - task_completion (0.0 to 100.0)
      - report_submission (0.0 to 100.0)
      - mentor_feedback (0.0 to 100.0, or None for ~5% unreviewed students)
      - task_velocity (0.0 to 3.5 tasks/week)
      - report_punctuality (0.0 to 100.0)
      - days_since_last_activity (0 to 45 days)
      - activity_consistency (0.0 to 100.0)
      - days_remaining (0 to 90 days)
      - progress_trend ('IMPROVING', 'STABLE', 'DECLINING', 'INSUFFICIENT_DATA')

    Target:
      - risk_label: 0 (LOW_RISK) or 1 (ATTENTION_RISK)

    Target Generation Logic:
      - Multi-signal latent risk index:
          Risk Signal = 0.30*(100 - task_completion)
                      + 0.25*(100 - report_submission)
                      + 0.20*(100 - mentor_feedback)
                      + 0.15*(100 - activity_consistency)
                      + 0.10*(min(days_since_last_activity, 30) / 30 * 100)
                      + trend_penalty (Declining: +12, Improving: -10, Insufficient: +5)
                      + Gaussian noise ~ N(0, 5.0)
      - Decision threshold: Signal >= 50.0 -> 1 (ATTENTION_RISK)
      - Institutional invariant override: days_since_last_activity > 21 -> 1
    """
    rng = np.random.default_rng(random_seed)

    # Determine number of distinct synthetic students
    n_checkpoints = max(1, checkpoints_per_student)
    n_students = max(1, n_samples // n_checkpoints)
    total_rows = n_students * n_checkpoints

    # 1. Latent student archetypes (proportions: 50% on-track, 30% monitor, 20% struggling)
    archetypes = rng.choice(["on_track", "monitor", "struggling"], size=n_students, p=[0.50, 0.30, 0.20])

    records = []

    for s_idx in range(n_students):
        student_id = f"SYN_STU_{s_idx + 1:04d}"
        arch = archetypes[s_idx]

        # Student baseline parameters
        if arch == "on_track":
            base_tc = rng.normal(86.0, 6.0)
            base_rs = rng.normal(88.0, 7.0)
            base_mf = rng.normal(88.0, 6.0)
            base_punct = rng.normal(90.0, 6.0)
            base_cons = rng.normal(88.0, 6.0)
            trends = ["IMPROVING", "STABLE"]
            trend_p = [0.45, 0.55]
            inact_scale = 2.0

        elif arch == "monitor":
            base_tc = rng.normal(62.0, 8.0)
            base_rs = rng.normal(65.0, 9.0)
            base_mf = rng.normal(68.0, 8.0)
            base_punct = rng.normal(70.0, 9.0)
            base_cons = rng.normal(65.0, 8.0)
            trends = ["STABLE", "DECLINING", "IMPROVING"]
            trend_p = [0.50, 0.35, 0.15]
            inact_scale = 5.5

        else:  # struggling
            base_tc = rng.normal(32.0, 10.0)
            base_rs = rng.normal(35.0, 11.0)
            base_mf = rng.normal(48.0, 9.0)
            base_punct = rng.normal(45.0, 12.0)
            base_cons = rng.normal(38.0, 10.0)
            trends = ["DECLINING", "STABLE", "INSUFFICIENT_DATA"]
            trend_p = [0.65, 0.25, 0.10]
            inact_scale = 13.0

        # Generate longitudinal checkpoints for this student
        for cp in range(n_checkpoints):
            # As checkpoints advance, days remaining decreases
            # e.g., checkpoint 0 is week 2 (70 days left), checkpoint 4 is week 10 (14 days left)
            days_remaining = max(0, int(75 - (cp * 14) + rng.integers(-3, 4)))

            # Add longitudinal temporal drift
            tc = np.clip(base_tc + rng.normal(0.0, 3.0), 0.0, 100.0)
            rs = np.clip(base_rs + rng.normal(0.0, 4.0), 0.0, 100.0)
            mf = np.clip(base_mf + rng.normal(0.0, 3.0), 0.0, 100.0)
            punct = np.clip(base_punct + rng.normal(0.0, 4.0), 0.0, 100.0)
            inact = int(np.clip(rng.exponential(scale=inact_scale), 0, 45))
            cons = np.clip(base_cons + rng.normal(0.0, 3.0), 0.0, 100.0)
            velocity = np.clip(rng.normal(tc / 40.0, 0.25), 0.0, 3.5)
            trend = rng.choice(trends, p=trend_p)

            records.append({
                GROUP_COLUMN: student_id,
                "task_completion": round(float(tc), 1),
                "report_submission": round(float(rs), 1),
                "mentor_feedback": round(float(mf), 1),
                "task_velocity": round(float(velocity), 2),
                "report_punctuality": round(float(punct), 1),
                "days_since_last_activity": inact,
                "activity_consistency": round(float(cons), 1),
                "days_remaining": days_remaining,
                "progress_trend": trend,
            })

    df = pd.DataFrame(records)

    # Trim to exact requested n_samples
    if len(df) > n_samples:
        df = df.iloc[:n_samples].copy()

    # Introduce ~5% missing mentor feedback (unreviewed weekly reports)
    unreviewed_mask = rng.random(size=len(df)) < 0.05
    df.loc[unreviewed_mask, "mentor_feedback"] = np.nan

    # --------------------------------------------------------------------------
    # Deterministic Target Label Generation with Realistic Stochastic Noise
    # --------------------------------------------------------------------------
    mf_imputed = df["mentor_feedback"].fillna(75.0)

    latent_risk_score = (
        (100.0 - df["task_completion"]) * 0.30
        + (100.0 - df["report_submission"]) * 0.25
        + (100.0 - mf_imputed) * 0.20
        + (100.0 - df["activity_consistency"]) * 0.15
        + (np.minimum(df["days_since_last_activity"], 30) / 30.0 * 100.0) * 0.10
    )

    trend_penalty = df["progress_trend"].map({
        "DECLINING": 12.0,
        "STABLE": 0.0,
        "IMPROVING": -10.0,
        "INSUFFICIENT_DATA": 5.0,
    })
    latent_risk_score += trend_penalty

    # Add stochastic noise modeling human supervisor variance
    noise = rng.normal(0.0, 5.0, size=len(df))
    total_risk_signal = latent_risk_score + noise

    # Decision threshold: signal >= 50.0 flagged as ATTENTION_RISK
    risk_labels = (total_risk_signal >= 50.0).astype(int)

    # Institutional safety override: prolonged inactivity (> 21 days) always ATTENTION_RISK
    long_inactivity = df["days_since_last_activity"] > 21
    risk_labels[long_inactivity] = 1

    df[TARGET_COLUMN] = risk_labels

    return df


if __name__ == "__main__":
    df_sample = generate_synthetic_dataset(1000)
    print(f"Generated synthetic dataset: {df_sample.shape}")
    print(f"Distinct students: {df_sample[GROUP_COLUMN].nunique()}")
    print(f"Target distribution:\n{df_sample[TARGET_COLUMN].value_counts(normalize=True)}")
    print(df_sample.head(3))
