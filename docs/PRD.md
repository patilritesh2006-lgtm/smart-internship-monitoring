# Product Requirements Document (PRD)

**Product Name:** Smart Internship Management & Monitoring System  
**Version:** 1.0.0  
**Status:** In Active Development  
**Lead Architect:** Full-Stack Lead & System Architect  

---

## 1. Executive Summary & Core Concept

### 1.1 Core Concept: From Management to Intelligence
Traditional academic internship tracking is purely administrative: storing student records in spreadsheets, collecting reports at the end of the term, and checking off hours completed.

The **Smart Internship Management & Monitoring System** fundamentally shifts this paradigm:
$$\text{Internship Management} \longrightarrow \mathbf{Internship\ Intelligence}$$

The platform centralizes the complete lifecycle of university internships while continuously analyzing structured progress data in real-time. Rather than discovering deficits at the end of a semester, the system identifies issues early, produces transparent, explainable health indicators, and provides actionable recommendations to students, mentors, and administrators.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                          INTERNSHIP INTELLIGENCE                        │
│                                                                         │
│   Internship Management  +  Progress Monitoring  +  Skill Gap Engine    │
│                                                                         │
│                                   ↓                                     │
│                Explainable Attention Scoring (30/30/20/20)              │
│                                   ↓                                     │
│                 ON_TRACK  |  MONITOR  |  NEEDS_ATTENTION                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Problem Statement & Opportunities

### 2.1 The Current Problem
1. **Fragmented Workflows:** Student records, company postings, mentor evaluations, and task submissions are scattered across emails, spreadsheets, and physical documents.
2. **Skill Mismatch at Application:** Students apply for internships without understanding which competencies they lack for specific roles.
3. **Delayed Interventions:** Overdue reports, low task completion, and pending mentor feedback go unnoticed until final grading, resulting in poor outcomes and unaddressed student struggles.
4. **Opaque Analytics:** Existing institutional software relies on arbitrary percentages or opaque scoring with no actionable explanation for why a student is flagged.

### 2.2 The Solution
A unified, database-backed platform providing:
- Role-based portals for **Students**, **Mentors**, and **Administrators**.
- Centralized internship application, approval, and task/report tracking.
- An independent, deterministic **Intelligence Layer** providing:
  - **Skill Gap Analysis:** Match percentage, missing skills list, and specific improvement recommendations.
  - **Progress Attention Scoring:** 4-factor explainable evaluation alerting supervisors to students needing follow-up.

---

## 3. Primary User Personas & Capabilities

### 3.1 Student Persona
- **Registration & Authentication:** Sign up, log in, manage credentials.
- **Profile & Skills:** Maintain profile, add/remove acquired skills.
- **Internship Discovery:** Browse approved internships, inspect prerequisites, role descriptions, and stipends.
- **Skill Gap Self-Assessment:** Run instantaneous skill gap analysis against any internship posting before applying.
- **Application Flow:** Submit applications, view approval status (`PENDING`, `APPROVED`, `REJECTED`).
- **Milestone & Task Management:** View assigned tasks, toggle task completion status.
- **Weekly Progress & Reports:** Submit weekly reports detailing achievements, blockers, and hours; view submission history and mentor feedback scores.
- **Live Intelligence Feedback:** View personal progress attention status (`ON_TRACK`, `MONITOR`, `NEEDS_ATTENTION`), exact reasons for flags, and personalized recommended actions.

### 3.2 Faculty Mentor / Industry Supervisor Persona
- **Authentication & Dashboard:** Secure login with immediate access to assigned intern roster.
- **Cohort Monitoring:** Real-time visibility into student progress percentages, task completion ratios, and overdue report flags.
- **Report Review & Evaluation:** Inspect submitted weekly reports, provide qualitative comments, and submit evaluation ratings.
- **Early Warning Triage:** Filter interns by attention status (`NEEDS_ATTENTION`, `MONITOR`) to identify students who require immediate intervention.
- **Explainable Insights:** View transparent factor breakdowns and reasons explaining why a student was flagged (e.g., "Weekly reports are pending", "Task completion is below expected level").

### 3.3 College Administrator / Placement Director Persona
- **User & Role Management:** Approve student registrations, manage mentor accounts, manage institutional roles.
- **Company & Opportunity Management:** Register industry partners, approve or publish internship postings, specify required skill competencies.
- **Application Oversight & Mentor Allocation:** Review pending applications, approve intern placements, assign mentors to approved internships.
- **Institutional Analytics:** Monitor university-wide metrics: total active internships, cohort attention distribution, report submission rates, and company engagement stats.
- **Audit Logs:** Maintain visibility over institutional actions (approvals, allocations, evaluations).

---

## 4. End-to-End Internship Lifecycle

```text
       [Student Registration]
                 ↓
      [Skill Profile Setup]
                 ↓
    [Browse & Skill Gap Check]
                 ↓
    [Apply for Internship] ──→ [Admin Review & Approval]
                                      ↓
                             [Mentor Assigned]
                                      ↓
                            [Internship Starts]
                                      ↓
                       [Task Completion & Progress]
                                      ↓
                        [Weekly Report Submitted]
                                      ↓
                          [Mentor Review & Score]
                                      ↓
                  [Intelligence Engine Analyzes Data]
                                      ↓
                 ┌────────────────────────────────┐
                 │  Attention Score (0 - 100)     │
                 │  Status: ON_TRACK/MONITOR/NEEDS│
                 │  Explainable Reasons & Actions │
                 └────────────────────────────────┘
                                      ↓
                         [Intervention / Feedback]
                                      ↓
                            [Final Evaluation]
                                      ↓
                              [Completion]
```

---

## 5. Core Intelligence Specifications

### 5.1 Feature 1: Skill Gap Analysis
- **Inputs:**
  - `student_skills`: List of strings representing skills claimed by the student.
  - `required_skills`: List of skills defined for the target internship.
- **Rules:**
  - Case-insensitive comparison (e.g. `"python"`, `"Python"`, `"PYTHON"` match).
  - Normalizes leading/trailing whitespace.
  - Eliminates duplicate entries.
  - Preserves canonical required skill casing for display.
  - Safe division-by-zero handling (returns $100\%$ if no skills are required).
- **Calculation:**
  $$\text{Match Percentage} = \left( \frac{\text{Unique Matched Required Skills}}{\text{Total Unique Required Skills}} \right) \times 100$$
- **Recommendation:** Rule-based natural language generator:
  - 0 missing: `"No skill gaps identified. All required skills are met."`
  - 1 missing: `"Consider improving [Skill] skills."`
  - 2 missing: `"Consider improving [Skill A] and [Skill B] skills."`
  - 3+ missing: `"Consider improving [Skill A], [Skill B] and [Skill C] skills."`

### 5.2 Feature 2: Progress Attention Scoring Engine
- **Input Factors (0 to 100 Scale):**
  1. `progress_consistency` ($30\%$ weight / $0.30$)
  2. `task_completion` ($30\%$ weight / $0.30$)
  3. `report_submission` ($20\%$ weight / $0.20$)
  4. `mentor_feedback` ($20\%$ weight / $0.20$)
- **Formula:**
  $$\text{Score} = (C \times 0.30) + (T \times 0.30) + (R \times 0.20) + (M \times 0.20)$$
- **Status Classification:**
  - $\mathbf{75 - 100} \implies \mathbf{ON\_TRACK}$
  - $\mathbf{50 - 74} \implies \mathbf{MONITOR}$
  - $\mathbf{0 - 49} \implies \mathbf{NEEDS\_ATTENTION}$
- **Explainability & Recommendations:**
  - Factor benchmark threshold: $75.0$.
  - Low task completion ($<75$): `"Task completion is below the expected level."` $\implies$ `"Complete pending tasks."`
  - Low report submission ($<75$): `"Weekly reports are pending."` $\implies$ `"Submit pending weekly reports."`
  - Low mentor feedback ($<75$): `"Mentor feedback is pending."` $\implies$ `"Request mentor feedback."`
  - Low progress consistency ($<75$): `"Progress updates are inconsistent."` $\implies$ `"Maintain regular progress updates."`
  - If all factors $\ge 75$: `"Progress is consistent."` $\implies$ `"Maintain regular progress updates."`
  - Strict deduplication ensures zero repeated reasons or actions.

---

## 6. Non-Functional & Quality Requirements

1. **Determinism:** Zero external stochastic AI calls or hallucinations. Results are strictly reproducible given the same inputs.
2. **Performance:** Sub-millisecond intelligence evaluations; sub-100ms API response times.
3. **Data Integrity:** Strict foreign key relationships, cascade configurations, and database constraints.
4. **Security:** Server-side authorization on every protected route. Passwords hashed using `bcrypt`; authentication tokens signed via HMAC-SHA256 JWTs.
5. **Usability:** 100% accessible UI across mobile, tablet, and desktop viewports with explicit loading, empty, and error states.
