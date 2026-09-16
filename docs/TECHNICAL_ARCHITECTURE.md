# Technical Architecture Specification

**Project:** Smart Internship Management & Monitoring System  
**Architecture Style:** Layered Service-Oriented Web Application (FastAPI + Next.js + SQLite/PostgreSQL)  
**Version:** 1.0.0  

---

## 1. System Overview & Architectural Diagram

The system is architected as an end-to-end, decoupled full-stack platform:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT / FRONTEND                             │
│                  Next.js 14+ | React 18+ | TypeScript                  │
│                     Tailwind CSS | Lucide Icons                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / JSON (REST API)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY / ROUTERS                           │
│                FastAPI (Asynchronous ASGI Application)                 │
│         /api/auth | /api/internships | /api/reports | /api/analytics   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        SERVICE & BUSINESS LAYER                        │
│          AuthService | InternshipService | IntelligenceService         │
│               Role Validation | Milestone Progress Aggregator          │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│          INTELLIGENCE LAYER          │  │       DATA ACCESS LAYER      │
│      Deterministic Scoring Core      │  │        SQLAlchemy 2.0        │
│   Skill Gap Engine | Attention Engine│  │    SQLite (Dev) / Postgres   │
└──────────────────────────────────────┘  └──────────────┬───────────────┘
                                                         │
                                                         ▼
                                          ┌──────────────────────────────┐
                                          │      PERSISTENCE STORE       │
                                          │  Users, Students, Mentors,   │
                                          │  Internships, Tasks, Reports │
                                          └──────────────────────────────┘
```

---

## 2. Technology Stack Selection & Rationale

| Layer | Chosen Technology | Version / Tool | Architectural Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js / React | Next.js 14 / TypeScript | Fast SSR, typed contracts, intuitive routing, and modular components. |
| **Styling** | Tailwind CSS | v3 / Vanilla utilities | Responsive, accessible, utility-first design system with clean state tokens. |
| **Backend API** | FastAPI | Python 3.14 / v0.111+ | High throughput ASGI, native Pydantic v2 validation, auto-generated OpenAPI. |
| **ORM / Data** | SQLAlchemy | 2.0 (Modern declarative) | Database-agnostic abstractions, type-safe queries, seamless SQLite $\leftrightarrow$ PostgreSQL transition. |
| **Security** | PyJWT + Passlib | JWT + bcrypt | Industry-standard password salting and stateless signed authorization headers. |
| **Intelligence** | Pure Python + Pandas | Standalone package | 100% deterministic, zero external AI dependencies, mathematically verified explainability. |
| **Database** | SQLite (Dev) / PostgreSQL | Modern SQL Engine | Zero-friction local development; standard relational schema portable to production PostgreSQL. |

---

## 3. Layered Directory & Module Structure

```text
smart-internship-management/
├── backend/
│   ├── app/
│   │   ├── core/                           # Security, config, database sessions
│   │   │   ├── config.py                   # Pydantic Settings & environment variables
│   │   │   ├── database.py                 # Engine, SessionLocal, Base declarative class
│   │   │   └── security.py                 # bcrypt hashing, JWT create & verify tokens
│   │   ├── models/                         # SQLAlchemy 2.0 Database Entities
│   │   │   ├── user.py                     # User, Student, Mentor
│   │   │   ├── internship.py               # Company, Internship, Application
│   │   │   ├── milestone.py                # Task, WeeklyReport, Evaluation
│   │   │   └── skill.py                    # Skill, StudentSkill, InternshipSkill
│   │   ├── schemas/                        # Pydantic request & response schemas
│   │   │   ├── auth.py                     # Login, Register, TokenPayload
│   │   │   ├── internship.py               # ApplicationCreate, InternshipOut
│   │   │   ├── report.py                   # ReportCreate, ReportReview
│   │   │   └── analytics.py                # AttentionScoreOut, SkillGapOut
│   │   ├── services/                       # Business logic & intelligence coordination
│   │   │   ├── auth_service.py             # User registration, authentication logic
│   │   │   ├── internship_service.py       # Workflow, approvals, applications
│   │   │   ├── report_service.py           # Report submission, mentor evaluation
│   │   │   └── analytics_service.py        # Database $\leftrightarrow$ Intelligence bridge
│   │   ├── routers/                        # FastAPI Route Handlers
│   │   │   ├── auth.py                     # /api/auth
│   │   │   ├── students.py                 # /api/students
│   │   │   ├── mentors.py                  # /api/mentors
│   │   │   ├── internships.py              # /api/internships
│   │   │   ├── reports.py                  # /api/reports
│   │   │   └── analytics.py                # /api/analytics
│   │   └── main.py                         # FastAPI application initialization & CORS
│   ├── tests/                              # Backend API & integration tests
│   └── requirements.txt                    # Backend dependencies
├── frontend/                               # Next.js TypeScript Frontend
│   ├── src/
│   │   ├── app/                            # App router pages (Next.js 14)
│   │   │   ├── page.tsx                    # Landing / Overview page
│   │   │   ├── login/                      # Login screen
│   │   │   ├── register/                   # Student registration
│   │   │   ├── student/                    # Student portal (Dashboard, Tasks, Reports, Skill Gap)
│   │   │   ├── mentor/                     # Mentor portal (Assigned Interns, Review Queue)
│   │   │   └── admin/                      # Admin portal (Internships, Allocations, Institutional Stats)
│   │   ├── components/                     # Reusable UI components
│   │   │   ├── ui/                         # Buttons, Inputs, Badges, Cards, Modals
│   │   │   ├── layout/                     # Navigation, Sidebar, RoleHeader
│   │   │   ├── student/                    # SkillGapCard, AttentionBanner, ReportHistory
│   │   │   └── mentor/                     # EvaluationModal, ProgressMatrix
│   │   ├── lib/                            # API client, token management, constants
│   │   │   ├── api.ts                      # Fetch wrapper with JWT headers
│   │   │   └── auth.tsx                    # AuthContext & Session Provider
│   │   └── types/                          # Shared TypeScript interfaces
│   ├── package.json
│   └── tailwind.config.js
├── intelligence/                           # Standalone Intelligence Package (Verified 100%)
│   ├── app/
│   │   ├── models.py                       # Pydantic schemas (SkillGap, ProgressAttention)
│   │   ├── progress_analysis.py            # 4-factor scoring & reason generator
│   │   └── skill_gap.py                    # Case-insensitive skill matcher & recommendations
│   └── tests/                              # 40 Unit tests with 100% statement coverage
└── docs/                                   # Architectural Specifications
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
└──────┬───────┘          └───────┬────────┘          └──────────────┘
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
│ status       │          └────────────────┘          │ mentor_score │
└──────────────┘                                      └──────────────┘
```

### 4.1 Detailed Entity Dictionary

1. **`users` Table:**
   - `id`: `Integer`, Primary Key, autoincrement.
   - `email`: `String(255)`, Unique, Indexed, Not Null.
   - `hashed_password`: `String(255)`, Not Null.
   - `full_name`: `String(255)`, Not Null.
   - `role`: `Enum('STUDENT', 'MENTOR', 'ADMIN')`, Not Null.
   - `is_active`: `Boolean`, Default `True`.
   - `created_at`: `DateTime`, Default UTC.

2. **`students` Table:**
   - `id`: `Integer`, Primary Key.
   - `user_id`: `Integer`, Foreign Key $\rightarrow$ `users.id` (ON DELETE CASCADE), Unique.
   - `roll_number`: `String(50)`, Unique, Not Null.
   - `department`: `String(100)`, Not Null.
   - `academic_year`: `Integer`, Not Null.

3. **`mentors` Table:**
   - `id`: `Integer`, Primary Key.
   - `user_id`: `Integer`, Foreign Key $\rightarrow$ `users.id` (ON DELETE CASCADE), Unique.
   - `department`: `String(100)`, Not Null.
   - `designation`: `String(100)`, Not Null.

4. **`companies` Table:**
   - `id`: `Integer`, Primary Key.
   - `name`: `String(255)`, Unique, Not Null.
   - `industry`: `String(100)`, Not Null.
   - `website`: `String(255)`, Nullable.

5. **`internships` Table:**
   - `id`: `Integer`, Primary Key.
   - `title`: `String(255)`, Not Null.
   - `description`: `Text`, Not Null.
   - `company_id`: `Integer`, Foreign Key $\rightarrow$ `companies.id`.
   - `mentor_id`: `Integer`, Foreign Key $\rightarrow$ `mentors.id`, Nullable.
   - `student_id`: `Integer`, Foreign Key $\rightarrow$ `students.id`, Nullable (assigned when approved).
   - `status`: `Enum('AVAILABLE', 'APPLIED', 'ACTIVE', 'COMPLETED')`, Default `'AVAILABLE'`.
   - `start_date`: `Date`, Nullable.
   - `end_date`: `Date`, Nullable.

6. **`internship_skills` Table:**
   - `id`: `Integer`, Primary Key.
   - `internship_id`: `Integer`, Foreign Key $\rightarrow$ `internships.id` (ON DELETE CASCADE).
   - `skill_name`: `String(100)`, Not Null.

7. **`student_skills` Table:**
   - `id`: `Integer`, Primary Key.
   - `student_id`: `Integer`, Foreign Key $\rightarrow$ `students.id` (ON DELETE CASCADE).
   - `skill_name`: `String(100)`, Not Null.

8. **`applications` Table:**
   - `id`: `Integer`, Primary Key.
   - `student_id`: `Integer`, Foreign Key $\rightarrow$ `students.id`.
   - `internship_id`: `Integer`, Foreign Key $\rightarrow$ `internships.id`.
   - `status`: `Enum('PENDING', 'APPROVED', 'REJECTED')`, Default `'PENDING'`.
   - `applied_at`: `DateTime`, Default UTC.

9. **`tasks` Table:**
   - `id`: `Integer`, Primary Key.
   - `internship_id`: `Integer`, Foreign Key $\rightarrow$ `internships.id` (ON DELETE CASCADE).
   - `title`: `String(255)`, Not Null.
   - `description`: `Text`, Nullable.
   - `is_completed`: `Boolean`, Default `False`.
   - `due_date`: `Date`, Nullable.

10. **`weekly_reports` Table:**
    - `id`: `Integer`, Primary Key.
    - `internship_id`: `Integer`, Foreign Key $\rightarrow$ `internships.id` (ON DELETE CASCADE).
    - `week_number`: `Integer`, Not Null.
    - `content`: `Text`, Not Null.
    - `hours_worked`: `Float`, Default 0.0.
    - `status`: `Enum('SUBMITTED', 'REVIEWED')`, Default `'SUBMITTED'`.
    - `mentor_feedback`: `Text`, Nullable.
    - `mentor_score`: `Float`, Nullable (0 to 100).
    - `submitted_at`: `DateTime`, Default UTC.

---

## 5. Intelligence Layer Integration Bridge

The backend acts as an orchestrator bridging relational database data with the pure Python intelligence engines:

```python
# Conceptual Bridge: AnalyticsService
class AnalyticsService:
    @staticmethod
    def get_student_progress_attention(db: Session, internship_id: int):
        internship = db.query(Internship).filter_by(id=internship_id).first()
        tasks_total = db.query(Task).filter_by(internship_id=internship_id).count()
        tasks_completed = db.query(Task).filter_by(internship_id=internship_id, is_completed=True).count()
        reports_expected = calculate_expected_weeks(internship.start_date)
        reports_submitted = db.query(WeeklyReport).filter_by(internship_id=internship_id).count()
        
        # Calculate raw 0-100 indicators
        task_completion = (tasks_completed / tasks_total * 100) if tasks_total > 0 else 100
        report_submission = min(100, (reports_submitted / reports_expected * 100)) if reports_expected > 0 else 100
        mentor_feedback = calculate_average_feedback(db, internship_id) # 0-100 or neutral pending policy
        progress_consistency = calculate_consistency(db, internship_id)   # 0-100
        
        # Invoke Intelligence Engine
        return evaluate_progress_attention(
            progress_consistency=progress_consistency,
            task_completion=task_completion,
            report_submission=report_submission,
            mentor_feedback=mentor_feedback
        )
```

---

## 6. Migration Strategy: SQLite $\rightarrow$ PostgreSQL

1. **Dialect Neutrality:** All models use standard SQLAlchemy column types (`Integer`, `String`, `DateTime`, `Text`, `Boolean`, `Float`) avoiding SQLite-specific dynamic types.
2. **Environment Configuration:** The database URL is configured via environment variable:
   - Development: `DATABASE_URL="sqlite:///./smart_internship.db"`
   - Production: `DATABASE_URL="postgresql://user:password@host:5432/smart_internship"`
3. **Connection Handling:** SQLite engine uses `connect_args={"check_same_thread": False}`; PostgreSQL skips this argument automatically.
