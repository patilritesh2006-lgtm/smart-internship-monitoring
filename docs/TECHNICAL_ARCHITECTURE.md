# Technical Architecture Specification

**Project:** Smart Internship Management & Monitoring System  
**Architecture Style:** Layered Service-Oriented Web Application (FastAPI + Next.js + SQLite/PostgreSQL)  
**Intelligence Architecture:** Explainable Hybrid Early-Warning Intelligence  
**Version:** 2.0.0  
**Updated:** September 30, 2026  

---

## 1. System Overview & Architectural Diagram

The system is architected as an end-to-end, decoupled full-stack platform with a multi-layered intelligence engine:

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT / FRONTEND LAYER                                        │
│                              Next.js 14.2 App Router (TypeScript)                               │
│                                                                                                  │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌──────────────────────────────────┐  │
│  │     Student Portal      │  │      Mentor Portal      │  │       Administrator Portal       │  │
│  │ • Milestone Task Toggle │  │ • Priority Triage Queue │  │ • Institutional KPI Dashboard    │  │
│  │ • Weekly Report Filing  │  │ • Report Review Form    │  │ • Internship Opportunity Queue   │  │
│  │ • Skill Gap Playground  │  │ • 1-5 Supervisor Rating │  │ • Faculty Allocation Drawer      │  │
│  │ • TreeSHAP Visual Modal │  │ • Log Intervention Modal│  │ • Placement Approvals            │  │
│  │ (app/student/page.tsx)  │  │ (app/mentor/page.tsx)   │  │ (app/admin/page.tsx)             │  │
│  └────────────┬────────────┘  └────────────┬────────────┘  └────────────────┬─────────────────┘  │
│               │                            │                                │                    │
│               └────────────────────────────┼────────────────────────────────┘                    │
│                                            ▼                                                     │
│                ┌───────────────────────────────────────────────────────┐                         │
│                │ Access / Login Context & Authenticated API Client     │                         │
│                │ • Quick 1-Click Persona Login (app/login/page.tsx)    │                         │
│                │ • Session Provider & JWT Storage (lib/auth.tsx)       │                         │
│                │ • Fetch Client with Bearer Interceptor (lib/api.ts)   │                         │
│                └───────────────────────────┬───────────────────────────┘                         │
└────────────────────────────────────────────┼─────────────────────────────────────────────────────┘
                                             │ HTTP / JSON (Bearer JWT Authorization)
                                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  FASTAPI APPLICATION API LAYER                                   │
│                        FastAPI 0.110 (ASGI Framework) • Pydantic v2 Validation                   │
│                                                                                                  │
│   ┌─────────────────────┐   ┌─────────────────────┐   ┌──────────────────────────────────────┐   │
│   │ Authentication      │   │ Student Domain      │   │ Mentor Domain                        │   │
│   │ • /api/auth/login   │   │ • /api/students/me  │   │ • /api/mentors/me/interns (triage)   │   │
│   │ • /api/auth/register│   │ • /api/students/... │   │ • /api/mentors/students/{id}         │   │
│   │ • /api/auth/me      │   │   (tasks, reports,  │   │ • /api/mentors/reports/{id}/review   │   │
│   │ (routers/auth.py)   │   │    attention status)│   │ • /api/mentors/interventions         │   │
│   └─────────────────────┘   │ (routers/students)  │   │ (routers/mentors.py)                 │   │
│                             └─────────────────────┘   └──────────────────────────────────────┘   │
│   ┌─────────────────────┐   ┌─────────────────────┐   ┌──────────────────────────────────────┐   │
│   │ Internship Domain   │   │ Analytics Domain    │   │ Administration Domain                │   │
│   │ • /api/internships  │   │ • /api/analytics/   │   │ • /api/admin/analytics (KPIs)        │   │
│   │ • /api/internships/ │   │   skill-gap         │   │ • /api/admin/applications (queue)    │   │
│   │   apply             │   │ • /api/analytics/   │   │ • /api/admin/mentors (allocation)    │   │
│   │ (routers/internship)│   │   evaluate-progress │   │ (routers/admin.py)                   │   │
│   └─────────────────────┘   │ (routers/analytics) │   └──────────────────────────────────────┘   │
│                             └─────────────────────┘                                              │
└────────────────────────────────────────────┬─────────────────────────────────────────────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
┌──────────────────────────────────────────────┐ ┌─────────────────────────────────────────────────┐
│           SERVICES / DATA LAYER              │ │           EXPLAINABLE HYBRID INTELLIGENCE       │
│                                              │ │                 ENGINE (offline)                │
│  ┌────────────────────────────────────────┐  │ │                                                 │
│  │ JWT Security & RBAC Guards             │  │ │ ┌─────────────────────────────────────────────┐ │
│  │ • Passlib salted bcrypt password hash  │  │ │ │ 1. Feature Extraction (FeatureExtractor)    │ │
│  │ • PyJWT HS256 stateless tokens         │  │ │ │    Extracts 10 quantitative signals from    │ │
│  │ • Role dependencies: Student/Mentor/   │  │ │ │    milestones, reports & ratings            │ │
│  │   Admin (core/security.py, core/deps)  │  │ │ │    (features/progress_features.py)          │ │
│  └────────────────────────────────────────┘  │ │ └──────────────────────┬──────────────────────┘ │
│  ┌────────────────────────────────────────┐  │ │                        ▼                        │
│  │ Database & SQLAlchemy 2.0 ORM          │  │ │ ┌─────────────────────────────────────────────┐ │
│  │ • Engine & SessionLocal (SQLite/PG)    │  │ │ │ 2. Deterministic Health Baseline            │ │
│  │ • Models: User, Student, Mentor, Task, │  │ │ │    Weighted score (Tasks 40%, Reports 30%,  │ │
│  │   Report, Internship, Application,     │  │ │ │    Ratings 20%, Velocity 10%) → 0-100%      │ │
│  │   Intervention, Skill (models/)        │  │ │ │    (progress_analysis.py)                   │ │
│  └────────────────────────────────────────┘  │ │ └──────────────────────┬──────────────────────┘ │
│  ┌────────────────────────────────────────┐  │ │                        ▼                        │
│  │ Seed Service (core/seed.py)            │  │ │ ┌─────────────────────────────────────────────┐ │
│  │ • Realistic multi-persona seeding      │  │ │ │ 3. ML Early-Warning Risk Model              │ │
│  │ • Calibrated synthetic sample data     │  │ │ │    Pretrained Random Forest Classifier      │ │
│  │ • Deterministic test accounts          │  │ │ │    (ml/predictor.py, ml/artifacts/)         │ │
│  └────────────────────────────────────────┘  │ │ └──────────────────────┬──────────────────────┘ │
│                                              │ │                        ▼                        │
│                                              │ │ ┌─────────────────────────────────────────────┐ │
│                                              │ │ │ 4. SHAP Explainability (SHAPExplainer)      │ │
│                                              │ │ │    TreeSHAP local feature attribution       │ │
│                                              │ │ │    Positive & negative risk contributors    │ │
│                                              │ │ │    (ml/explainer.py)                        │ │
│                                              │ │ └──────────────────────┬──────────────────────┘ │
│                                              │ │                        ▼                        │
│                                              │ │ ┌─────────────────────────────────────────────┐ │
│                                              │ │ │ 5. Hybrid Decision Engine                   │ │
│                                              │ │ │    Combines deterministic ground truth      │ │
│                                              │ │ │    with ML risk probability (ml/service.py) │ │
│                                              │ │ └──────────────────────┬──────────────────────┘ │
│                                              │ │                        ▼                        │
│                                              │ │ ┌─────────────────────────────────────────────┐ │
│                                              │ │ │ 6. Institutional Safety Guardrails          │ │
│                                              │ │ │    Hard policy overrides for inactivity,    │ │
│                                              │ │ │    critical failures, low ratings (<2.0)    │ │
│                                              │ │ └──────────────────────┬──────────────────────┘ │
│                                              │ │                        ▼                        │
│                                              │ │ ┌─────────────────────────────────────────────┐ │
│                                              │ │ │ 7. Deterministic Fallback System            │ │
│                                              │ │ │    Safe degradation to deterministic score  │ │
│                                              │ │ │    if model/SHAP artifacts are unavailable  │ │
│                                              │ │ └─────────────────────────────────────────────┘ │
│                                              │ │                                                 │
│                                              │ │ ══════════════ PARALLEL CAPABILITY ════════════ │
│                                              │ │ ┌─────────────────────────────────────────────┐ │
│                                              │ │ │ Skill Gap Analysis Engine (skill_gap.py)    │ │
│                                              │ │ │ • Case-insensitive keyword normalization    │ │
│                                              │ │ │ • Required vs Student skill set delta       │ │
│                                              │ │ │ • Deterministic curriculum recommendations  │ │
│                                              │ │ │ • Zero external LLM / Cloud dependencies    │ │
│                                              │ │ └─────────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘ └─────────────────────────────────────────────────┘
```

### 1.1 End-to-End Operational Data Flow Pipeline

```text
  [Student Activity]        [Weekly Reports]          [Mentor Feedback]
  • Milestone task toggle   • Weekly report filing    • Supervisor rating (1-5)
  • Submission timestamp    • Timesheet hours logged  • Qualitative feedback
             │                     │                          │
             └─────────────────────┼──────────────────────────┘
                                   ▼
                   ┌───────────────────────────────┐
                   │   Feature Extraction (10)     │
                   │ • task_completion_rate        │
                   │ • submission_timeliness_rate  │
                   │ • supervisor_rating_avg       │
                   │ • days_since_last_submission  │
                   │ • velocity & trend indicators │
                   └───────────────┬───────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
       ┌─────────────────────────┐   ┌─────────────────────────┐
       │  Deterministic Health   │   │  ML Early-Warning Risk  │
       │  Ground-Truth Baseline  │   │  RandomForest Classifier│
       │  (Health Score 0-100%)  │   │  (Risk Probability 0-1) │
       └────────────┬────────────┘   └────────────┬────────────┘
                    │                             │
                    │                             ▼
                    │                ┌─────────────────────────┐
                    │                │   TreeSHAP Explainer    │
                    │                │ • Top positive factors  │
                    │                │ • Top negative factors  │
                    │                └────────────┬────────────┘
                    │                             │
                    └──────────────┬──────────────┘
                                   ▼
                   ┌───────────────────────────────┐
                   │    Hybrid Decision Engine     │
                   │ • Reconciles health + ML risk │
                   │ • Enforces Safety Guardrails  │
                   │ • (Deterministic fallback if  │
                   │    model is unavailable)      │
                   └───────────────┬───────────────┘
                                   ▼
                   ┌───────────────────────────────┐
                   │  Actionable Attention Status  │
                   │  ON_TRACK • MONITOR • ATTENTION│
                   │               │               │
                   │               ▼               │
                   │  [Faculty Mentor Review]      │
                   │  Closed-loop intervention log │
                   │  Academic meeting / Tutoring  │
                   └───────────────────────────────┘
```

```mermaid
flowchart TD
    subgraph Frontend["CLIENT / FRONTEND (Next.js 14 App Router)"]
        SP["Student Portal<br/>(app/student/page.tsx)"]
        MP["Mentor Portal<br/>(app/mentor/page.tsx)"]
        AP["Admin Portal<br/>(app/admin/page.tsx)"]
        AUTH["Login / Access Context<br/>(app/login, lib/auth.tsx)"]
        CLIENT["API Client (lib/api.ts)"]
        SP --> CLIENT
        MP --> CLIENT
        AP --> CLIENT
        AUTH --> CLIENT
    end

    CLIENT -->|"Bearer JWT HTTP/JSON"| API

    subgraph API["FASTAPI API LAYER (0.110 ASGI)"]
        R_AUTH["Authentication Domain (/api/auth)"]
        R_STU["Student Domain (/api/students)"]
        R_MEN["Mentor Domain (/api/mentors)"]
        R_INT["Internship Domain (/api/internships)"]
        R_ADM["Administration Domain (/api/admin)"]
        R_ANA["Analytics Domain (/api/analytics)"]
    end

    API --> SERVICES
    API --> INTEL

    subgraph SERVICES["SERVICES & DATA LAYER"]
        SEC["JWT Security & RBAC Guards<br/>(core/security.py, core/deps.py)"]
        DB["SQLAlchemy 2.0 ORM<br/>(models/, core/database.py)"]
        SEED["Multi-Persona Seeder<br/>(core/seed.py)"]
    end

    subgraph INTEL["EXPLAINABLE HYBRID INTELLIGENCE ENGINE"]
        direction TB
        FE["1. Feature Extraction (10 Features)<br/>(features/progress_features.py)"]
        DET["2. Deterministic Health Baseline (0-100%)<br/>(progress_analysis.py)"]
        ML["3. ML Early-Warning Risk Model (Random Forest)<br/>(ml/predictor.py)"]
        SHAP["4. SHAP Local Explainability (TreeSHAP)<br/>(ml/explainer.py)"]
        HYBRID["5. Hybrid Decision Engine<br/>(ml/service.py)"]
        GUARD["6. Institutional Safety Guardrails<br/>(Hard overrides on critical delays)"]
        FALLBACK["7. Deterministic Fallback<br/>(Graceful degradation if model missing)"]

        FE --> DET
        DET --> ML
        ML --> SHAP
        SHAP --> HYBRID
        HYBRID --> GUARD
        GUARD -.-> FALLBACK

        subgraph PARALLEL["Parallel Capability"]
            SKILL["Skill Gap Analysis Engine<br/>(skill_gap.py)"]
        end
    end

    R_ANA --> SKILL
    R_STU --> FE
    R_MEN --> FE
```

---

## 2. Technology Stack Selection & Rationale

| Layer | Chosen Technology | Version / Tool | Architectural Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js / React | Next.js 14.2 / TypeScript 5.7 | Modern App Router, SSR, typed API contracts, responsive layout, glassmorphic UI. |
| **Styling** | Tailwind CSS | v3.4 / CSS variables | Utility-first responsive design system, touch targets $\ge 44\text{px}$, notch safe areas. |
| **Backend API** | FastAPI | Python 3.14 / v0.141+ | High-throughput ASGI, native Pydantic v2 validation, auto-generated OpenAPI (`/docs`). |
| **ORM / Data** | SQLAlchemy | 2.0 (Modern declarative) | Database-agnostic abstractions, type-safe queries, seamless SQLite $\leftrightarrow$ PostgreSQL transition. |
| **Security** | PyJWT + bcrypt | JWT (HS256) + direct bcrypt 5.0 | Cryptographic password salting and stateless signed authorization headers. No passlib. |
| **Intelligence** | Explainable Hybrid Engine | Pure Python + Scikit-Learn + SHAP | 4-factor deterministic baseline + Random Forest early-warning + SHAP local explanations + deterministic fallback. |
| **Database** | SQLite (Dev) / PostgreSQL | Modern SQL Engine | Zero-friction local development (`internship.db`); connection pool ready for managed PostgreSQL. |

---

## 3. Layered Directory & Module Structure

```text
smart-internship-management/
├── backend/
│   ├── app/
│   │   ├── core/                           # Security, configuration, database sessions
│   │   │   ├── config.py                   # Pydantic Settings & environment variables
│   │   │   ├── database.py                 # Engine, SessionLocal, Base declarative class
│   │   │   ├── security.py                 # Direct bcrypt hashing & PyJWT token management
│   │   │   ├── deps.py                     # Role guards (get_current_student, mentor, admin)
│   │   │   └── seed.py                     # Multi-persona realistic database seeder
│   │   ├── models/
│   │   │   └── __init__.py                 # SQLAlchemy 2.0 Entities (User, Student, Mentor, etc.)
│   │   ├── schemas/
│   │   │   └── __init__.py                 # Pydantic v2 request & response schemas
│   │   ├── routers/                        # FastAPI Route Handlers & Business Orchestration
│   │   │   ├── auth.py                     # /api/auth (register, login, me)
│   │   │   ├── students.py                 # /api/students (profile, tasks, reports, attention)
│   │   │   ├── mentors.py                  # /api/mentors (triage roster, report grading, interventions)
│   │   │   ├── admin.py                    # /api/admin (institutional analytics, approvals, allocations)
│   │   │   ├── internships.py              # /api/internships (catalog, apply, publish)
│   │   │   └── analytics.py                # /api/analytics (skill-gap, attention simulation)
│   │   └── main.py                         # FastAPI application initialization, lifespan, CORS
│   ├── tests/
│   │   └── test_api_integration.py         # 23 Backend API integration and security tests
│   └── requirements.txt                    # Backend dependencies (fastapi, scikit-learn, shap, etc.)
├── frontend/                               # Next.js 14 TypeScript Frontend
│   ├── src/
│   │   ├── app/                            # Next.js App Router Pages
│   │   │   ├── page.tsx                    # Institutional Landing Page
│   │   │   ├── login/page.tsx              # Quick 1-click persona login page
│   │   │   ├── register/page.tsx           # Role-guarded registration
│   │   │   ├── student/page.tsx            # Student workspace (tasks, reports, attention)
│   │   │   ├── mentor/page.tsx             # Faculty triage & grading portal
│   │   │   └── admin/page.tsx              # Administrator oversight & approvals
│   │   ├── components/                     # Reusable UI Components
│   │   │   ├── ProgressAttentionCard.tsx   # Hybrid progress attention & early-warning card
│   │   │   ├── IntelligenceExplainerModal.tsx # Transparent math & ML explanation modal
│   │   │   ├── TopHeader.tsx               # Contextual persona header
│   │   │   ├── Sidebar.tsx                 # Desktop and mobile drawer navigation
│   │   │   └── ui/                         # GlassCard, ProgressBar, StatusBadge, Modal
│   │   └── lib/                            # Client infrastructure
│   │       ├── api.ts                      # Authenticated API fetch wrapper
│   │       └── auth.tsx                    # React Context & Session Provider
│   ├── package.json
│   └── tailwind.config.ts
├── intelligence/                           # Standalone Intelligence & Analytics Package
│   ├── app/
│   │   ├── features/
│   │   │   └── progress_features.py        # 10 typed progress features & cadence engineering
│   │   ├── ml/                             # Phase 3 ML Early-Warning Pipeline
│   │   │   ├── dataset.py                  # Reproducible synthetic dataset generator (N=3000)
│   │   │   ├── preprocessing.py            # MLPreprocessor bounds, imputations, one-hot trends
│   │   │   ├── model.py                    # RandomForestClassifier training with GroupShuffleSplit
│   │   │   ├── predictor.py                # Singleton RiskPredictor inference engine
│   │   │   ├── explainer.py                # SHAPExplainer (TreeSHAP feature attributions)
│   │   │   ├── service.py                  # Hybrid decision policy & institutional overrides
│   │   │   └── artifacts/                  # Serialized risk_model_v1.joblib & metadata
│   │   ├── models.py                       # Pydantic schemas (SkillGap, ProgressAttention)
│   │   ├── progress_analysis.py            # 4-factor deterministic scoring engine
│   │   └── skill_gap.py                    # Case-insensitive skill matching algebra
│   └── tests/                              # Pytest Intelligence Test Suites
│       ├── test_ml_pipeline.py             # 21 tests for ML pipeline, SHAP, & hybrid logic
│       ├── test_progress_analysis.py       # 17 tests for deterministic 4-factor math
│       └── test_skill_gap.py               # 14 tests for skill gap algebra & recommendations
├── tests/                                  # Automated Playwright E2E Test Suite (118 Tests)
│   ├── fixtures/                           # Page Objects and Test Contexts
│   ├── health/                             # Startup & health checks (5 tests)
│   ├── auth/                               # Authentication & session checks (9 tests)
│   ├── navigation/                         # Route guards & 404s (7 tests)
│   ├── ui/                                 # UI components & visual cards (6 tests)
│   ├── forms/                              # Interactive form controls (7 tests)
│   ├── crud/                               # Tasks & reports CRUD (6 tests)
│   ├── api/                                # REST API contract checks (8 tests)
│   ├── validation/                         # Boundary conditions (6 tests)
│   ├── security/                           # RBAC & token security (5 tests)
│   ├── responsive/                         # Viewport & mobile tests (6 tests)
│   ├── error-handling/                     # Fault tolerance (5 tests)
│   ├── accessibility/                      # a11y labels & keyboard nav (5 tests)
│   ├── workflows/                          # Full multi-role journeys (4 tests)
│   └── security/security-audit.spec.ts     # Deep security & tamper audit (39 tests)
└── docs/                                   # Architectural Specifications & Reports
```

---

## 4. Database Schema & Entity-Relationship Architecture

```text
┌──────────────┐          ┌────────────────┐          ┌──────────────┐
│    Users     │ 1──────1 │    Students    │ 1──────N │ Applications │
├──────────────┤          ├────────────────┤          ├──────────────┤
│ id (PK)      │          │ id (PK)        │          │ id (PK)      │
│ email (UQ)   │          │ user_id (FK)   │          │ student_id   │
│ hashed_pw    │          │ roll_number    │          │ internship_id│
│ role         │          │ department     │          │ status       │
│ is_active    │          │ academic_year  │          └──────────────┘
└──────┬───────┘          └───────┬────────┘
       │                          │
       │ 1──────1                 │ 1──────N
       ▼                          ▼
┌──────────────┐          ┌────────────────┐
│   Mentors    │          │  StudentSkills │
├──────────────┤          ├────────────────┤
│ id (PK)      │          │ student_id (FK)│
│ user_id (FK) │          │ skill_name     │
│ designation  │          └────────────────┘
└──────┬───────┘
       │
       │ 1──────N (Assigned)
       ▼
┌──────────────┐ 1──────N ┌────────────────┐ 1──────N ┌──────────────┐
│  Internships │─────────▶│     Tasks      │─────────▶│WeeklyReports │
├──────────────┤          ├────────────────┤          ├──────────────┤
│ id (PK)      │          │ id (PK)        │          │ id (PK)      │
│ title        │          │ internship_id  │          │ internship_id│
│ company_id   │          │ title          │          │ week_number  │
│ mentor_id    │          │ is_completed   │          │ status       │
│ student_id   │          └────────────────┘          │ mentor_score │
│ status       │                                      └──────────────┘
└──────┬───────┘                                              │
       │ 1──────N                                             │ 1──────N
       ▼                                                      ▼
┌──────────────┐                                      ┌──────────────┐
│InternSkills  │                                      │Interventions │
├──────────────┤                                      ├──────────────┤
│ id (PK)      │                                      │ id (PK)      │
│ internship_id│                                      │ student_id   │
│ skill_name   │                                      │ mentor_id    │
└──────────────┘                                      │ notes        │
                                                      └──────────────┘
```

---

## 5. Explainable Hybrid Early-Warning Intelligence

The platform integrates two complementary intelligence approaches into a unified decision service:

### 5.1 The 6-Stage Hybrid Pipeline

1. **Feature Engineering (`intelligence/app/features/progress_features.py`):**
   - Extracts 10 typed features from raw milestone records.
   - Measures true calendar cadence: $\text{Consistency} = 0.50 \times \text{Week Coverage} + 0.30 \times \text{Recency} + 0.20 \times \text{Punctuality}$.
   - Omit `attendance_rate` from model inputs due to database schema limitations.
2. **Deterministic Progress Health Engine (`intelligence/app/progress_analysis.py`):**
   - Establishes the authoritative progress baseline from verified deliverables:
     $$\text{Progress Health Score} = (0.30 \times \text{Consistency}) + (0.30 \times \text{Tasks}) + (0.20 \times \text{Reports}) + (0.20 \times \text{Mentor Feedback})$$
   - Mapped to: $\ge 75 \implies \text{ON\_TRACK}$, $50 - 74 \implies \text{MONITOR}$, $< 50 \implies \text{NEEDS\_ATTENTION}$.
3. **ML Early-Warning Risk Model (`intelligence/app/ml/`):**
   - `RandomForestClassifier` trained on synthetic demonstration data ($N=3,000$, seed 42) using group-aware splits.
   - Evaluates risk probability ($\hat{p} \in [0, 1]$) indicating whether a student exhibits early disengagement patterns.
4. **SHAP Explainability (`intelligence/app/ml/explainer.py`):**
   - Computes local feature attributions using `shap.TreeExplainer`.
   - Generates top $k$ explanatory factors showing direction (`RISK` vs `PROTECTIVE`), impact level, and plain-language narrative reasons.
5. **Hybrid Decision Policy & Institutional Overrides (`intelligence/app/ml/service.py`):**
   - **Baseline:** Completed deliverables form ground truth.
   - **Severe Inactivity Override:** If `days_since_last_activity > 21`, status is forced to `MONITOR` or `NEEDS_ATTENTION` regardless of ML probability.
   - **Early-Warning Escalation:** If deterministic status is `ON_TRACK` but ML risk probability is $\ge 0.65$, status escalates to `MONITOR` with proactive intervention alerts.
   - **Low Data Caution:** Flags students in weeks $< 2$ as preliminary.
6. **Graceful Deterministic Fallback:**
   - If model artifacts or dependencies are unavailable, the system transparently defaults to pure deterministic scoring with `model_available=False`.

---

## 6. Migration Strategy: SQLite $\rightarrow$ PostgreSQL

1. **Dialect Neutrality:** All models use standard ANSI SQL types (`Integer`, `String`, `DateTime`, `Text`, `Boolean`, `Float`).
2. **Environment Configuration:**
   - Development: `DATABASE_URL="sqlite:///./internship.db"`
   - Production: `DATABASE_URL="postgresql://user:password@host:5432/smart_internship"`
3. **Connection Pooling:** In production with PostgreSQL, `pool_size=20`, `max_overflow=10`, `pool_pre_ping=True`, and `pool_recycle=300` maintain connection health automatically.
