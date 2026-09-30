# Model Card: SIMS Explainable ML Early-Warning Intelligence

**Model Version:** `synthetic-v1.1`  
**Model Type:** `RandomForestClassifier`  
**Last Updated:** September 2026  
**Pipeline:** Smart Internship Management & Monitoring System (SIMS) Intelligence Engine

---

> **MANDATORY INSTITUTIONAL NOTICE**  
> **"This prototype is trained on synthetic demonstration data and must not be treated as validated predictive evidence for real institutional decision-making."**  
> All model outputs are advisory decision-support signals designed to assist faculty coordinators in identifying students who may benefit from proactive guidance. They do not replace faculty mentorship or formal academic evaluations.

---

## 1. Model Purpose

The SIMS Early-Warning Intelligence model forecasts whether an intern is at risk of disengagement or falling behind scheduled milestones (`ATTENTION_RISK`) before critical internship deadlines are breached. It augments the deterministic Progress Health Score by identifying leading indicators of distress (such as decaying submission punctuality combined with slowing milestone velocity).

## 2. Intended Use

- **Advisory Triage:** Providing faculty mentors with prioritized student rosters to ensure timely support.
- **Early Intervention:** Encouraging mentors to schedule check-ins when leading risk probabilities are elevated, even if aggregate task completion percentages temporarily appear satisfactory.
- **Transparent Evidence Inspection:** Surfacing local feature attributions (via SHAP) so advisors understand the specific observable indicators contributing to the forecast.

## 3. Non-Intended Use

- **Automated Academic Sanctions:** Never to be used to automatically fail, penalize, withhold credit from, or discipline an intern.
- **Grading Substitutes:** Not an evaluation of student competence or professional work quality.
- **High-Stakes Decision Making:** Must not be deployed in real production academic environments without retraining on verified, representative, multi-semester institutional historical data.

## 4. Synthetic Data Description

Because the active SIMS development database contains a small set of demonstration student profiles, training a statistical machine learning model directly on the production database would lead to severe overfitting and memorization of student IDs. 

To evaluate pipeline architecture, calibration, and SHAP explainability safely:
- **Dataset Size:** 3,000 synthetic internship milestone checkpoints generated across distinct simulated student cohorts.
- **Group-Aware Structure:** Each observation is tied to a `synthetic_student_id`. Partitioning is performed via `GroupShuffleSplit` by student ID to prevent longitudinal distribution leakage across training, validation, and test splits.
- **Simulated Archetypes:**
  - *On-Track (50%):* Consistent submission cadence, high task completion (mean 86%), positive mentor evaluations (mean 88%), minimal inactivity (0–5 days), improving/stable trends.
  - *Monitor / Borderline (30%):* Moderate completion (mean 62%), occasional missed weekly reports, moderate feedback (mean 68%), minor inactivity (3–12 days).
  - *Struggling / At-Risk (20%):* Low task completion (mean 32%), frequent report gaps, lower mentor feedback (mean 48%), long inactivity periods (10–30+ days), declining trends.
- **Missing Data Realism:** Approximately 5% of records have `mentor_feedback = None`, reflecting realistic lag in supervisor evaluations.

## 5. Feature Description

The model consumes 9 engineered progress features derived from [`ProgressFeatures`](file:///intelligence/app/features/progress_features.py):

| Feature | Type | Range / States | Default Imputation | Description |
| :--- | :--- | :--- | :--- | :--- |
| `task_completion` | Numeric | 0.0 – 100.0% | 0.0% | Percentage of assigned milestone tasks completed |
| `report_submission` | Numeric | 0.0 – 100.0% | 0.0% | Percentage of expected weekly reports submitted |
| `mentor_feedback` | Numeric | 0.0 – 100.0 | 75.0 (Neutral) | Mean score on evaluated weekly reports |
| `task_velocity` | Numeric | 0.0 – 10.0 | 0.0 tasks/wk | Milestone tasks completed per elapsed week |
| `report_punctuality` | Numeric | 0.0 – 100.0% | 100.0% | Percentage of reports submitted prior to deadline |
| `days_since_last_activity` | Numeric | 0 – 365 days | 14 days | Elapsed days since last recorded action |
| `activity_consistency` | Numeric | 0.0 – 100.0% | 100.0% | Cadence regularity index across weeks |
| `days_remaining` | Numeric | 0 – 365 days | 30 days | Scheduled days remaining in internship |
| `progress_trend` | Categorical | 4 States | `INSUFFICIENT_DATA` | One-hot encoded: `declining`, `improving`, `stable`, `insufficient_data` |

*Note: `attendance_rate` is intentionally excluded from the model matrix as attendance check-ins are not currently captured in the database schema.*

## 6. Target Definition

The target variable `risk_label` is binary:
- `0` = `LOW_RISK`
- `1` = `ATTENTION_RISK`

Target assignment is governed by a multi-signal latent risk formulation that simulates realistic supervisor review thresholds:
$$\text{Latent Risk} = 0.30 \cdot (100 - \text{TC}) + 0.25 \cdot (100 - \text{RS}) + 0.20 \cdot (100 - \text{MF}) + 0.15 \cdot (100 - \text{AC}) + 0.10 \cdot \left(\frac{\min(\text{Inactivity}, 30)}{30} \times 100\right) + \text{Trend Penalty} + \epsilon$$
where $\epsilon \sim \mathcal{N}(0, 5.0)$ represents human supervisor variability.
- Primary threshold: $\text{Signal} \ge 50.0 \implies 1$
- Institutional safety override: $\text{days\_since\_last\_activity} > 21 \implies 1$

## 7. Training Procedure

- **Algorithm:** `RandomForestClassifier` (scikit-learn)
- **Hyperparameters:** `n_estimators=100`, `max_depth=6`, `min_samples_split=10`, `min_samples_leaf=5`, `class_weight='balanced'`, `random_state=42`.
- **Command:** `python -m intelligence.app.ml.model`
- **Output Artifacts:**
  - `intelligence/app/ml/artifacts/risk_model_v1.joblib`
  - `intelligence/app/ml/artifacts/model_metadata.json`

## 8. Validation Procedure

- **Group-Aware Splitting:** `GroupShuffleSplit` partitions observations by `synthetic_student_id` into:
  - Training: 420 students (2,100 observations, 70%)
  - Validation: 90 students (450 observations, 15%)
  - Test: 90 students (450 observations, 15%)
  - Total: 600 unique synthetic students (3,000 observations across 5 checkpoints)
- Evaluation is strictly conducted on held-out test students who were never seen during training or validation, verifying true generalization across novel student trajectories rather than memorizing individual checkpoint rows.

## 9. Evaluation Metrics

Evaluated on 450 unseen test student checkpoints from the synthetic demonstration dataset:

| Metric | Score | Analysis |
| :--- | :--- | :--- |
| **Accuracy** | 95.78% | Pipeline classification fidelity on synthetic distribution |
| **Precision** | 85.71% | Minimizes alert fatigue for faculty advisors on synthetic data |
| **Recall (Attention Risk)** | **91.14%** | Successfully flags >91% of simulated students needing support |
| **F1-Score** | 88.34% | Harmonic mean confirming balanced performance on synthetic dataset |
| **ROC-AUC** | **0.9874** (98.74%) | High discriminative ability across confidence thresholds on synthetic distribution |

> ⚠️ **Scope Limitation:** These metrics are from synthetic demonstration data and do not establish real-world predictive validity. The 98.74% ROC-AUC metric confirms pipeline integrity and statistical separation under simulation, not real-world predictive validity for institutional student retention.


### Confusion Matrix (Test Set, N = 450)
- True Negatives (`LOW_RISK` correct): 359
- False Positives (`LOW_RISK` flagged as risk): 12
- False Negatives (`ATTENTION_RISK` missed): 7
- True Positives (`ATTENTION_RISK` caught): 72

## 10. Calibration Assessment

- **Brier Score:** `0.0399` (probabilistic calibration error on synthetic evaluation set, well below the 0.25 uninformative baseline)
- **Expected Calibration Error (ECE, 10 Bins):** `0.0549`
- **Reliability Assessment:** Standard random forest voting fractions display good alignment with empirical frequencies on synthetic data. Because tree ensembles can produce conservative probabilities near 0 and 1, outputs represent synthetic behavior and are not validated for real institutional certainty.

## 11. Explainability (SHAP TreeExplainer)

- Feature attributions are computed locally using exact Shapley value calculation (`shap.TreeExplainer`).
- Positive attributions ($\phi_i > 0$) increase the predicted risk of intervention (`direction = "RISK"`).
- Negative attributions ($\phi_i < 0$) reflect protective performance (`direction = "PROTECTIVE"`).
- Mathematical tensors are transformed into structured, human-readable descriptors with labeled units (`%`, `tasks/wk`, `days`).
- Raw arrays are never returned over public APIs.

## 12. Fallback Behavior & Institutional Safety

If the ML artifact is deleted, inaccessible, or encounters an internal inference exception:
1. `RiskPredictor` catches the fault and sets `model_available = False`.
2. The hybrid service immediately falls back to the deterministic Progress Health Engine.
3. API endpoints return `risk_probability: null`, `risk_label: null`, `top_risk_factors: []`.
4. Zero system crashes or client HTTP 500 errors occur.

## 13. Known Limitations

1. **Synthetic Data Only:** The model has not been trained or tested on live institutional records.
2. **Missing Check-in Attendance:** Attendance is not part of the current feature set.
3. **Department Variation:** Pacing in software internships differs from research internships; current synthetic distributions assume a standardized milestone structure.
4. **Snapshot Representation:** The model evaluates tabular snapshot windows rather than recurrent sequential time-series patterns.

## 14. Data Limitations

- Live institutional student data is subject to FERPA, GDPR, and university privacy regulations.
- Demographics and protected characteristics are strictly excluded from the feature space.

## 15. Production Requirements

Before deploying this early-warning model in a live academic institution:
1. Collect at least two full historical semesters of verified internship milestones and supervisor outcomes.
2. Conduct an equity and disparate impact audit across degree programs and demographic segments.
3. Retrain and calibrate model thresholds on representative historical distributions.
4. Maintain deterministic institutional guardrails as the primary source of truth for completed academic credit.
