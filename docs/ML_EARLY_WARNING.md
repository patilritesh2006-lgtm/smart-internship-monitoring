# SIMS Phase 3: Explainable ML Early-Warning Intelligence

> **IMPORTANT DISCLAIMER**  
> *"This is a prototype model trained on synthetic demonstration data and is not validated for real institutional decision-making."*  
> Model predictions are decision-support indicators intended to augment, never replace, faculty mentorship, human supervisor evaluation, and institutional academic policies.

---

## 1. Why Machine Learning is Being Introduced

In **Phase 1** and **Phase 2**, the Smart Internship Management & Monitoring System (SIMS) established a robust, deterministic progress engine that computes an explainable `progress_health_score` (0–100%) and categorizes students into `ON_TRACK`, `MONITOR`, and `NEEDS_ATTENTION`. 

While this deterministic engine excels at evaluating **past and current milestone completion**, deterministic rules are inherently **reactive**:
- A student is only categorized as `NEEDS_ATTENTION` after milestones or weekly submissions have already been missed.
- Subtly declining trends, irregular cadence, or slowing milestone velocity can go unnoticed while aggregate completion percentages appear temporarily acceptable.

**Phase 3** introduces an **Early-Warning Machine Learning Intelligence Layer** to complement the deterministic engine:
- Predicts the **probability that a student will require faculty intervention in the near future**.
- Identifies subtle early patterns of disengagement (e.g., decaying submission punctuality paired with declining velocity) before acute academic failure occurs.
- Provides **local feature attributions (SHAP)** to explain exactly which factors drive the risk elevation.

---

## 2. Why Synthetic Data is Used

The SIMS prototype database contains only three demonstration student records. Training a statistical machine learning model on three students would cause catastrophic overfitting, memorize individual student IDs, and fail to generalize.

To build a technically sound prototype pipeline without violating student privacy or training on inadequate sample sizes:
1. **Zero Privacy Risk:** Synthetic data does not expose confidential student records, grades, or mentor evaluations.
2. **Controlled Distributions:** Allows testing of diverse student archetypes (high performers, irregular pacing, disengaged interns, and borderline students).
3. **Reproducibility:** A fixed random seed (`seed=42`) guarantees bit-exact dataset reconstruction across all developer environments and automated test runners.
4. **Validation Separation:** Synthetic data enables strict train/validation/test holdout evaluation of model architecture, calibration, and feature attribution.

*Synthetic validation metrics verify algorithmic correctness and pipeline mechanics; they do not represent real-world predictive validity.*

---

## 3. Dataset Generation

The dataset generator is implemented in [`intelligence/app/ml/dataset.py`](file:///intelligence/app/ml/dataset.py) using NumPy and Pandas:
- **Sample Size:** 3,000 synthetic student internship observations.
- **Random Seed:** Fixed seed `42` via `numpy.random.default_rng(42)`.
- **Student Archetypes:**
  - **On-Track (50%):** High task completion (mean 86%), high report submission (mean 88%), positive mentor feedback (mean 88%), minimal inactivity (0–5 days), improving or stable trends.
  - **Monitor / Borderline (30%):** Moderate completion (mean 62%), occasional missed reports, moderate feedback (mean 68%), minor inactivity (3–12 days), mixed trends.
  - **Struggling / Disengaged (20%):** Low completion (mean 32%), frequent missing reports, sub-benchmark mentor scores (mean 48%), long inactivity gaps (10–30+ days), declining trends.
- **Realistic Variations:**
  - Features are generated with continuous distributions (normal, exponential) and realistic stochastic noise rather than rigid deterministic formulas.
  - ~5% of student records feature unreviewed reports (`mentor_feedback = None`), mirroring realistic live data where reports await supervisor review.
- **Target Label (`risk_label`):**
  - Binary classification: `0 = LOW_RISK`, `1 = ATTENTION_RISK`.
  - Driven by a latent risk index with realistic stochastic noise ($N(0, 5)$).
  - Prolonged inactivity (> 21 days) enforces `risk_label = 1` as an institutional safety invariant.
  - Target balance: ~22–32% positive class (`ATTENTION_RISK`), accurately modeling early-warning triage where 1 in 4 students requires proactive check-ins.

---

## 4. Feature Set

The canonical feature set mirrors the 10 progress intelligence features defined in [`ProgressFeatures`](file:///intelligence/app/features/progress_features.py):

| Feature Name | Type | Physical Bounds | Default Imputation | Description |
| :--- | :--- | :--- | :--- | :--- |
| `task_completion` | Numeric | 0.0 – 100.0% | 0.0% | Percentage of assigned milestone tasks completed |
| `report_submission` | Numeric | 0.0 – 100.0% | 0.0% | Percentage of expected weekly progress reports submitted |
| `mentor_feedback` | Numeric | 0.0 – 100.0 | 75.0 (Neutral) | Average score across reviewed weekly submissions |
| `task_velocity` | Numeric | 0.0 – 10.0 | 0.0 tasks/wk | Milestone tasks completed per elapsed week |
| `report_punctuality` | Numeric | 0.0 – 100.0% | 100.0% | Percentage of reports submitted before weekly deadline |
| `days_since_last_activity` | Numeric | 0 – 365 days | 14 days | Calendar days since last recorded task or report action |
| `activity_consistency` | Numeric | 0.0 – 100.0% | 100.0% | Temporal regularity index based on coverage & cadence |
| `days_remaining` | Numeric | 0 – 365 days | 30 days | Calendar days remaining until scheduled internship end |
| `progress_trend` | Categorical | 4 States | `INSUFFICIENT_DATA` | One-hot encoded: `declining`, `improving`, `stable`, `insufficient_data` |

### Attendance Note
`attendance_rate` is intentionally **excluded** from ML model inputs because the current SIMS database schema lacks an attendance/check-in table. To avoid training/inference feature mismatch or fabricating data, attendance is left as `None` in live inference and omitted from the ML feature matrix.

---

## 5. Training Pipeline

Implemented in [`intelligence/app/ml/model.py`](file:///intelligence/app/ml/model.py):
1. **Data Ingestion:** Calls `generate_synthetic_dataset(3000, random_seed=42)`.
2. **Preprocessing:** [`MLPreprocessor`](file:///intelligence/app/ml/preprocessing.py) validates bounds, imputes missing values, and one-hot encodes `progress_trend`.
3. **Data Splitting:** Group-aware synthetic student split via `GroupShuffleSplit` across 600 unique synthetic students (preventing longitudinal data leakage across checkpoints):
   - **Training Set (70%):** 420 students (2,100 observations)
   - **Validation Set (15%):** 90 students (450 observations)
   - **Held-out Test Set (15%):** 90 students (450 observations)
4. **Reproducible Training Command:**
   ```bash
   python -m intelligence.app.ml.model
   ```
5. **Artifact Persistence:**
   - Serialized model + preprocessor bundle saved to [`intelligence/app/ml/artifacts/risk_model_v1.joblib`](file:///intelligence/app/ml/artifacts/risk_model_v1.joblib).
   - Training metadata, metrics, and timestamp saved to [`intelligence/app/ml/artifacts/model_metadata.json`](file:///intelligence/app/ml/artifacts/model_metadata.json).

---

## 6. Model Selection

We evaluated candidate scikit-learn algorithms:
- **Decision:** Selected `RandomForestClassifier(n_estimators=100, max_depth=6, class_weight='balanced', random_state=42)`.
- **Rationale:**
  1. **Non-Linear Relationships:** Tree ensembles naturally model threshold interactions (e.g., high tasks combined with high inactivity).
  2. **Class Imbalance Handling:** `class_weight='balanced'` penalizes false negatives on `ATTENTION_RISK`, prioritizing high recall for early-warning triage.
  3. **Inference Speed & Offline Execution:** Requires < 5ms per inference on standard CPU, with zero GPU or cloud dependencies.
  4. **Direct SHAP Compatibility:** Fast, exact TreeExplainer support without sampling approximations or slow background dataset computations.

---

## 7. Evaluation Metrics

Evaluated on the held-out 450-sample test set from the synthetic demonstration dataset:

| Metric | Score | Target Rationale |
| :--- | :--- | :--- |
| **Accuracy** | 95.78% | General classification performance on synthetic cohort distribution |
| **Precision** | 85.71% | Avoids alert fatigue for faculty supervisors on synthetic data |
| **Recall (Attention Risk)** | **91.14%** | Critical: prioritizes catching students needing attention |
| **F1-Score** | 88.34% | Harmonic balance between precision and recall |
| **ROC-AUC** | **0.9874** (98.74%) | High discriminative ability across decision thresholds on synthetic demonstration data |

> ⚠️ **Evaluation Scope:** These metrics are from synthetic demonstration data and do not establish real-world predictive validity. The **98.74% ROC-AUC** metric is achieved exclusively on synthetic demonstration data generated from simulated internship behavior distributions. It confirms pipeline correctness and probabilistic separation under controlled simulation; it does **not** establish real-world predictive validity for institutional student failure or retention.


---

## 8. Risk Probability Meaning

The service API provides:
```json
{
  "risk_probability": 0.78,
  "risk_label": "ATTENTION_RISK",
  "model_version": "synthetic-v1.1",
  "model_available": true
}
```

- **`risk_probability` (0.0 to 1.0):** The model's estimated likelihood that the student's progress trajectory will require faculty intervention or monitoring.
- **Decision Threshold:**
  - $\ge 0.50 \implies \text{ATTENTION\_RISK}$
  - $< 0.50 \implies \text{LOW\_RISK}$
- **Labeling Standard:** In all institutional reporting, `risk_probability` is explicitly phrased as **"Predicted attention risk"** (a probabilistic forecast), never as an immutable academic judgment.

---

## 9. SHAP Explanation Architecture

Implemented in [`intelligence/app/ml/explainer.py`](file:///intelligence/app/ml/explainer.py) using `shap.TreeExplainer`:
- Calculates exact local Shapley values $\phi_i$ for each input feature relative to the expected model base value:
  $$f(x) = \phi_0 + \sum_{i=1}^M \phi_i$$
- **Transformation to Institutional Explanations:**
  Raw mathematical tensors are translated into human-interpretable factors:
  - **Direction:** 
    - $\phi_i > 0 \implies \text{"RISK"}$ (feature increases probability of requiring attention)
    - $\phi_i < 0 \implies \text{"PROTECTIVE"}$ (feature decreases probability of requiring attention)
  - **Impact Tier:**
    - $|\phi_i| \ge 0.09 \implies \text{"HIGH"}$
    - $|\phi_i| \ge 0.035 \implies \text{"MEDIUM"}$
    - $|\phi_i| < 0.035 \implies \text{"LOW"}$
- **Output Schema:**
  ```json
  [
    {
      "feature": "report_submission",
      "label": "Report Submission",
      "impact": "HIGH",
      "direction": "RISK",
      "value": 42.0,
      "unit": "%",
      "attribution_weight": 0.184,
      "description": "Percentage of expected weekly progress reports submitted."
    },
    {
      "feature": "task_completion",
      "label": "Task Completion",
      "impact": "MEDIUM",
      "direction": "PROTECTIVE",
      "value": 85.0,
      "unit": "%",
      "attribution_weight": -0.062,
      "description": "Percentage of assigned milestone tasks completed to date."
    }
  ]
  ```
- **Safety Standard:** Raw SHAP arrays and internal tree structures are never exposed to the frontend.

---

## 10. Hybrid Deterministic + ML Decision Logic

Implemented in [`intelligence/app/ml/service.py`](file:///intelligence/app/ml/service.py):

```
                   Student Internship State (Tasks, Reports, Timestamps)
                                             │
                                             ▼
                             extract_progress_features(...)
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       │                                           │
                       ▼                                           ▼
          ProgressAttentionEngine.evaluate()               RiskPredictor.predict()
          (Deterministic Health Score)                     (ML Probability [0–1])
                       │                                           │
                       │                                           ▼
                       │                                  SHAPExplainer.explain()
                       │                                  (Top Contributing Factors)
                       │                                           │
                       └─────────────────────┬─────────────────────┘
                                             │
                                             ▼
                                  Hybrid Decision Layer
                        ┌─────────────────────────────────────────┐
                        │ Institutional Safeguards & Overrides:   │
                        │ 1. Ground Truth = Completed Work        │
                        │ 2. Inactivity > 21d -> Force Attention  │
                        │ 3. ML Risk >= 0.65 -> Escalate Warning  │
                        │ 4. Elapsed < 2 wks -> Insufficient Data │
                        └─────────────────────────────────────────┘
                                             │
                                             ▼
                               API Response & Dashboard
```

### Institutional Safeguards:
1. **Completed Work Ground Truth:** The deterministic health score ($0.30 \cdot C + 0.30 \cdot T + 0.20 \cdot R + 0.20 \cdot M$) always forms the foundation for verified student achievement.
2. **Severe Inactivity Override:** If `days_since_last_activity > 21`, the student is automatically flagged for `MONITOR` or `NEEDS_ATTENTION` regardless of how favorable the ML risk probability is.
3. **Early Escalation:** If a student's current score is `ON_TRACK` but the ML risk probability is $\ge 0.65$ (e.g., due to declining velocity and punctuality), the status is escalated to `MONITOR` with an early-warning notice.
4. **Insufficient Data Awareness:** If fewer than 2 weeks have elapsed, a cautionary explanation is attached to prevent false confidence.

---

## 11. Fallback Behavior

The system is designed with **zero hard dependencies on the ML model**:
- If `intelligence/app/ml/artifacts/risk_model_v1.joblib` is deleted, corrupted, or unreadable:
  1. `RiskPredictor` logs a warning and sets `model_available = False`.
  2. `evaluate_hybrid_attention` seamlessly falls back to deterministic evaluation.
  3. API response returns `model_available: false`, `risk_probability: null`, `top_risk_factors: []`.
  4. All legacy endpoints (`/api/students/me/attention`, `/api/mentors/assigned-students`) continue operating with zero downtime.

---

## 12. Known Limitations

1. **Synthetic Training Bias:** The model is trained on synthetic data representing idealized archetypes, not real student behavior.
2. **Lack of Check-in Attendance:** Attendance is not tracked in the current database schema and cannot be utilized as a feature.
3. **Course/Domain Differences:** Different academic departments have varying deliverable cadences (e.g., software engineering vs. laboratory research) that synthetic data does not capture.
4. **Static Time Windows:** The model currently operates on snapshot features rather than sequential recurrent time-series modeling.

---

## 13. Why Production Deployment Requires Real Historical Institutional Data

Before deploying this early-warning system for high-stakes academic decisions:
- **Institutional Context:** Student engagement varies significantly across universities, semesters, and degree programs.
- **Fairness & Bias Auditing:** Real historical data must be evaluated for disparate impact across departments, demographics, and internship types.
- **Calibration on Real Outliers:** Real-world interruptions (illness, supervisor leaves, company schedule changes) require historical calibration to avoid unnecessary false alarms.

---

## 14. Future Improvements

1. **Attendance Tracking Integration:** Introduce a student daily/weekly check-in table and incorporate attendance regularity.
2. **Time-Series Progression Modeling:** Transition to temporal progression models (e.g., LSTM or temporal fusion transformers) to track longitudinal trajectory.
3. **Cohort Drift Monitoring:** Implement automated monitoring for distribution shift across academic semesters.
4. **Mentor Intervention Feedback Loop:** Track whether faculty check-ins successfully mitigate predicted attention risk over time.
