# SIMS Progress Intelligence Engine Specification (Phase 1 & 2)

## Overview

The **Smart Internship Management & Monitoring System (SIMS)** Progress Intelligence Engine provides real-time, explainable, and deterministic progress analytics for academic internships. It transforms raw operational milestones (task status, weekly reports, timestamps, mentor feedback) into actionable health scores and early-intervention triage indicators without black-box opacity or external API dependencies.

---

## 1. Architecture

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 FASTAPI APPLICATION LAYER                              │
│                                                                                        │
│   GET /api/students/me/attention       GET /api/mentors/me/interns                     │
│   GET /api/admin/analytics             POST /api/analytics/evaluate-progress-simulation│
│                                                                                        │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │ backend/app/routers/students.py -> compute_student_attention_metrics()         │   │
│   │ • Queries Task, WeeklyReport, Internship from DB                               │   │
│   │ • Invokes Feature Extraction & Hybrid Early-Warning Progress Evaluation        │   │
│   └──────────────────────────────────────┬─────────────────────────────────────────┘   │
└──────────────────────────────────────────┼─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        FEATURE ENGINEERING LAYER (intelligence/app/features/)          │
│                                                                                        │
│   extract_progress_features(tasks, reports, internship, now)                           │
│   • Extracts 10 typed features: Task Completion, Report Submission, Mentor Feedback,  │
│     Attendance Rate, Task Velocity, Report Punctuality, Days Since Activity,           │
│     Activity Consistency, Progress Trend, and Days Remaining.                          │
│   • Eliminates collinear double-counting.                                              │
└────────────────────────────────────┬───────────────────────────────────────────────────┘
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
┌───────────────────────────────────┐   ┌────────────────────────────────────────────────┐
│   DETERMINISTIC HEALTH ENGINE     │   │         ML EARLY WARNING PIPELINE              │
│   (progress_analysis.py)          │   │         (intelligence/app/ml/predictor.py)     │
│                                   │   │                                                │
│ • Health Score: 0-100%            │   │ • Random Forest Classifier (Scikit-Learn)      │
│   30% Consistency + 30% Tasks +   │   │ • Outputs Risk Probability (0.0 to 1.0)        │
│   20% Reports + 20% Mentor Score  │   │ • Status: ON_TRACK | MONITOR | NEEDS_ATTENTION │
│ • Baseline Deterministic Metrics  │   └───────────────────────┬────────────────────────┘
└─────────────────┬─────────────────┘                           │
                  │                                             ▼
                  │                     ┌────────────────────────────────────────────────┐
                  │                     │         SHAP EXPLAINABILITY ENGINE             │
                  │                     │         (intelligence/app/ml/explainer.py)     │
                  │                     │                                                │
                  │                     │ • TreeSHAP Local Feature Attribution           │
                  │                     │ • Top Risk Drivers (negative impacts)          │
                  │                     │ • Top Protective Factors (positive impacts)    │
                  │                     └───────────────────────┬────────────────────────┘
                  │                                             │
                  └───────────────────────┬─────────────────────┘
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                 HYBRID DECISION ENGINE (intelligence/app/ml/service.py)                │
│                                                                                        │
│ • Merges Deterministic Health Score + ML Risk Probability + SHAP Explanations          │
│ • Institutional Safety Guardrails: Inactivity > 21d forces CRITICAL NEEDS_ATTENTION    │
│ • Deterministic Fallback: Gracefully operates if ML model/explainer artifact is missing│
│ • Formats backward-compatible ProgressAttentionEngineResult API payload                │
└────────────────────────────────────────────────────────────────────────────────────────┘
```


---

## 2. Feature Definitions

The engine defines 10 core features modeled in `ProgressFeatures`:

| Feature Name | Type | Range | Description |
| :--- | :--- | :--- | :--- |
| **`task_completion`** | `float` | $0.0 - 100.0$ | Percentage of assigned milestone tasks successfully completed. |
| **`report_submission`** | `float` | $0.0 - 100.0$ | Percentage of expected weekly reports submitted to date. |
| **`mentor_feedback`** | `Optional[float]` | $0.0 - 100.0$ | Arithmetic mean of supervisor ratings across reviewed reports (`None` if unrated). |
| **`attendance_rate`** | `Optional[float]` | $0.0 - 100.0$ | Tracked physical/virtual check-in rate. *(Safe `None` default due to DB schema limitation).* |
| **`task_velocity`** | `float` | $\ge 0.0$ | Milestone tasks completed per elapsed week. |
| **`report_punctuality`**| `Optional[float]` | $0.0 - 100.0$ | Percentage of reports submitted on or before the weekly deadline window. |
| **`days_since_last_activity`** | `Optional[int]` | $\ge 0$ | Calendar days since the most recent task, report, or term start timestamp. |
| **`activity_consistency`** | `float` | $0.0 - 100.0$ | Multi-factor cadence index measuring regular weekly activity and recency. |
| **`progress_trend`** | `ProgressTrend` | Enum | Trajectory direction (`IMPROVING`, `STABLE`, `DECLINING`, `INSUFFICIENT_DATA`). |
| **`days_remaining`** | `Optional[int]` | $\ge 0$ | Calendar days remaining until the scheduled internship conclusion. |

---

## 3. Feature Formulas

### 3.1 Task Completion ($T$)
$$T = \begin{cases} \left(\frac{\text{Completed Tasks}}{\text{Total Assigned Tasks}}\right) \times 100 & \text{if Total Tasks} > 0 \\ 100.0 & \text{if Total Tasks} = 0 \text{ (Initial neutral baseline)} \end{cases}$$

### 3.2 Report Submission ($R$)
$$\text{Expected Weeks} = \min\left(\max\left(1, \left\lfloor\frac{\text{Days Active}}{7}\right\rfloor + 1\right), \text{Duration Weeks}\right)$$
$$R = \min\left(100.0, \left(\frac{\text{Reports Submitted}}{\text{Expected Weeks}}\right) \times 100\right)$$

### 3.3 Mentor Feedback ($M$)
$$M = \begin{cases} \frac{1}{K} \sum_{i=1}^{K} \text{mentor\_score}_i & \text{if } K > 0 \text{ reviewed reports exist} \\ 75.0 & \text{neutral imputation if unreviewed} \end{cases}$$

### 3.4 Real Activity Consistency ($C_{\text{real}}$)
To eliminate previous collinear double-counting ($0.5 T + 0.5 R$), the engine evaluates **actual behavioral cadence over elapsed calendar time**:
$$C_{\text{real}} = (0.50 \times \text{Week Coverage}) + (0.30 \times \text{Recency Score}) + (0.20 \times \text{Cadence Score})$$
Where:
- $\text{Week Coverage} = \left(\frac{|\text{Unique Weeks with Submitted Reports}|}{\text{Expected Weeks}}\right) \times 100 \in [0, 100]$
- $\text{Recency Score} = \begin{cases} 100.0 & \text{if Days Inactive} \le 7 \\ 80.0 & \text{if } 7 < \text{Days Inactive} \le 14 \\ 50.0 & \text{if } 14 < \text{Days Inactive} \le 21 \\ \max(0.0, 50.0 - (\text{Days Inactive} - 21) \times 3) & \text{if Days Inactive} > 21 \end{cases}$
- $\text{Cadence Score} = \text{report\_punctuality} \in [0, 100]$ (defaults to 80.0 if punctuality cannot be calculated).

### 3.5 Deterministic Progress Trend
- If $\ge 2$ reviewed reports exist:
  $$\Delta = \text{Score}_{\text{recent\_half}} - \text{Score}_{\text{earlier\_half}}$$
  - $\Delta \ge +4.0 \implies \mathbf{IMPROVING}$
  - $\Delta \le -4.0 \implies \mathbf{DECLINING}$
  - Otherwise $\implies \mathbf{STABLE}$
- If $< 2$ reviewed reports and $\ge 2$ weeks elapsed:
  - $\text{Missing Reports} \ge 2 \text{ or Days Inactive} > 14 \implies \mathbf{DECLINING}$
  - $\text{Completed Tasks} > 0 \text{ and Missing Reports} = 0 \implies \mathbf{IMPROVING}$
  - Otherwise $\implies \mathbf{STABLE}$
- If $< 2$ weeks elapsed $\implies \mathbf{INSUFFICIENT\_DATA}$.

---

## 4. Progress Health Score Calculation

The **Progress Health Score** ($S$) is calculated using genuinely distinct, non-collinear features:

$$S = (C_{\text{real}} \times 0.30) + (T \times 0.30) + (R \times 0.20) + (M \times 0.20)$$

- **Activity Consistency ($C_{\text{real}}$ - 30%):** Measures cadence and regularity over calendar time.
- **Task Execution ($T$ - 30%):** Measures concrete project deliverables.
- **Report Submission ($R$ - 20%):** Measures compliance with weekly institutional logging.
- **Supervisor Rating ($M$ - 20%):** Measures qualitative evaluation by the industry or faculty mentor.

---

## 5. Status Thresholds & Intervention Triggers

```text
               NEEDS_ATTENTION                 MONITOR                   ON_TRACK
      [───────────────────────────────)[─────────────────────)[──────────────────────────]
      0.0                           50.0                   75.0                        100.0
```

- **`ON_TRACK` ($\mathbf{75.0 \le S \le 100.0}$):** Student is meeting expected milestones on schedule.
- **`MONITOR` ($\mathbf{50.0 \le S < 75.0}$):** Student has minor delays or pending reviews; warrants routine tracking.
- **`NEEDS_ATTENTION` ($\mathbf{0.0 \le S < 50.0}$):** Critical delays or low supervisor evaluation; faculty intervention recommended.
- **Intervention Override:** If a student has been inactive for more than 21 days ($\text{days\_since\_last\_activity} > 21$), their status is automatically clamped to at most `MONITOR` regardless of prior completed tasks.

---

## 6. Evidence-Based Explanation Generation

Generic strings (e.g. *"Progress updates are inconsistent."*) are replaced with quantifiable, traceable facts:

1. **Milestones:**
   - Deficit: `"{incomplete_tasks} of {total_tasks} assigned milestone tasks remain incomplete."`
   - Optimal: `"All {total_tasks} milestone tasks have been successfully completed."`
2. **Weekly Reports:**
   - Deficit: `"{missing_reports} of {expected_reports} expected weekly reports have not been submitted."`
   - Optimal: `"All {expected_reports} expected weekly reports have been submitted on schedule."`
3. **Inactivity:**
   - `days_since_last_activity > 14`: `"No verified internship activity recorded in the last {days} days."`
4. **Mentor Feedback:**
   - $M < 75.0$: `"Average mentor evaluation is {score}% (below 75% benchmark)."`
5. **Cadence Consistency:**
   - $C_{\text{real}} < 75.0$: `"Activity cadence index is {consistency}% due to irregular submission intervals."`
6. **Trajectory Trend:**
   - `trend == "DECLINING"`: `"Recent progress velocity and submission regularity are declining."`

---

## 7. Actionable Recommendation Logic

Recommendations are deterministically derived from detected deficiencies:

- **Pending Tasks:** `"Prioritize the {incomplete_tasks} remaining milestone tasks (e.g., '{next_task_title}')."`
- **Missing Reports:** `"Submit the {missing_reports} outstanding weekly progress reports."`
- **Prolonged Inactivity:** `"Record an immediate weekly progress update or milestone completion."`
- **Low Feedback:** `"Request mentor feedback and coordinate on upcoming evaluations."`
- **Declining Trend:** `"Schedule a progress review this week to realign on deliverables."`
- **Optimal Pace:** `"Maintain regular progress updates and continue scheduled milestone deliverables."`

---

## 8. Limitations & Edge Cases

1. **Attendance Tracking:**
   - The current database schema does not feature an `attendance` or daily badge-swipe table.
   - Handled cleanly via `attendance_rate: Optional[float] = None` without fabricating synthetic values.
2. **Early-Term Sparse Data:**
   - In week 1, with zero tasks or reports, the engine defaults gracefully to neutral baselines ($T = 100\%$, $M = 75\%$, trend = `INSUFFICIENT_DATA`) to avoid penalizing students during onboarding.
3. **Overdue Duration:**
   - When days active exceeds scheduled `duration_weeks`, `expected_reports` is capped at `duration_weeks` to prevent division skew.

---

## 9. Deterministic Heuristic vs Machine Learning

SIMS intentionally anchors its baseline in deterministic rules for the following reasons:
1. **Academic Auditability:** Institutional governance requires that every student risk alert be explainable to faculty committees with reproducible, auditable metrics.
2. **Zero Hallucinations & Opacity:** No LLM generation or opaque neural weights that could produce discriminatory or unpredictable scores.
3. **Zero Cold-Start Dependency:** New academic programs or newly enrolled cohorts function on Day 1 without requiring thousands of historical labeled student records to train supervised models.
4. **Instant Millisecond Execution:** Evaluates inside standard synchronous HTTP request loops with negligible latency and zero external API fees.

---

## 10. Implemented Phase 3: Explainable Hybrid Early-Warning Intelligence

The Feature Engineering layer feeds directly into the implemented Phase 3 ML Early-Warning pipeline:

```text
                                Phase 3 Hybrid Pipeline
                                
          extract_progress_features(...) ────────┐
                        │                        │
                        ▼                        ▼
          Deterministic Health Engine   Random Forest Early-Warning Model
          (Baseline accreditation)      (Predictive disengagement probability)
                        │                        │
                        │                        ▼
                        │               SHAP TreeExplainer
                        │               (Local feature attribution weights)
                        │                        │
                        └──────────────┬─────────┘
                                       ▼
                     Hybrid Decision Layer & Guardrails
                     • progress_health_score (Deterministic baseline)
                     • risk_probability & risk_label (ML signal)
                     • reasons & recommendations (SHAP-augmented)
                     • Severe inactivity safety override (> 21 days)
                     • Graceful deterministic fallback (if ML offline)
```

- **Feature Matrix:** `ProgressFeatures` produces a clean numerical vector $[T, R, M, \text{velocity}, \text{consistency}, \text{recency}, \text{punctuality}, \text{days\_remaining}]$ with one-hot encoded progress trends.
- **ML Model:** Trained `RandomForestClassifier` (Scikit-Learn) with Group-Aware splits to prevent student leakage. Trained on synthetic demonstration data ($N=3,000$).
- **SHAP Feature Attributions:** `shap.TreeExplainer` maps top risk and protective drivers to plain-language institutional reasons.
- **Complete Specification:** For full ML training pipeline, calibration metrics, and model card, see [`docs/ML_EARLY_WARNING.md`](file:///docs/ML_EARLY_WARNING.md) and [`docs/MODEL_CARD.md`](file:///docs/MODEL_CARD.md).

