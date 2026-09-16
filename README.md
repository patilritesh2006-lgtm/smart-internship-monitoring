# Smart Internship Management & Monitoring System (SIMS)

[![Tests: 63 passed](https://img.shields.io/badge/Tests-63%20Passed-brightgreen)](https://github.com/patilritesh2006-lgtm/smart-internship-monitoring)
[![Build: Passed](https://img.shields.io/badge/Next.js%2014-Build%20Passed-blue)](https://github.com/patilritesh2006-lgtm/smart-internship-monitoring)
[![Responsive: Mobile%20%2B%20Web](https://img.shields.io/badge/Responsive-Mobile%20%2B%20Tablet%20%2B%20Web-purple)](https://github.com/patilritesh2006-lgtm/smart-internship-monitoring)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](https://github.com/patilritesh2006-lgtm/smart-internship-monitoring)

An end-to-end full-stack university internship management, monitoring, and deterministic intelligence platform bridging academic oversight with real-time student progress analytics.

$$\mathbf{Frontend\ (Next.js\ 14\ +\ Tailwind\ CSS)} \longleftrightarrow \mathbf{Backend\ (FastAPI\ +\ SQLAlchemy)} \longleftrightarrow \mathbf{Intelligence\ Engine\ (Deterministic\ Python)}$$

---

## 1. System Architecture

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    RESPONSIVE NEXT.JS 14 FRONTEND (Mobile + Web)                 │
│                                                                                  │
│   ┌─────────────────────┐  ┌──────────────────────┐  ┌───────────────────────┐   │
│   │   Student Portal    │  │ Faculty Mentor Portal│  │ Administrator Portal  │   │
│   │ • Milestone Toggles │  │ • Priority Triage    │  │ • Institutional KPIs  │   │
│   │ • Weekly Reports    │  │ • Report Review Form │  │ • Application Queue   │   │
│   │ • Skill Gap Check   │  │ • Supervisor Rating  │  │ • Mentor Allocation   │   │
│   └──────────┬──────────┘  └──────────┬───────────┘  └───────────┬───────────┘   │
│              │                         │                         │               │
│              └─────────┬───────────────┴─────────────────────────┘               │
│                        │ Mobile Drawer & Role-Aware Bottom Navigation            │
└────────────────────────┼─────────────────────────────────────────────────────────┘
                         │ Bearer JWT (Secure HTTP Requests)
                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             FASTAPI BACKEND SERVICE                              │
│                                                                                  │
│   • /api/auth          • /api/students        • /api/mentors                     │
│   • /api/internships   • /api/admin           • /api/analytics                   │
│                                                                                  │
│   ┌───────────────────────────────────┐  ┌───────────────────────────────────┐   │
│   │   SQLAlchemy 2.0 ORM (SQLite/PG)  │  │   Direct Intelligence Bridge      │   │
│   │   Users, Students, Mentors, Tasks │  │   evaluate_progress_attention()   │   │
│   │   Reports, Internships, Skills    │  │   analyze_skill_gap()             │   │
│   └───────────────────────────────────┘  └───────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Key Features & Innovations

### 2.1 Deterministic Intelligence Engine (`intelligence/`)
- **Skill Gap Self-Assessment:** Case-insensitive normalization, deduplication, and mathematical match calculation:
  $$\text{Match Percentage} = \left(\frac{|\text{Matched Required Skills}|}{|\text{Unique Required Skills}|}\right) \times 100$$
- **Internship Progress Attention Engine:** 4-factor explainable evaluation alerting supervisors before a term ends:
  $$\text{Score} = (\text{Consistency} \times 0.30) + (\text{Tasks} \times 0.30) + (\text{Reports} \times 0.20) + (\text{Mentor Feedback} \times 0.20)$$
  - $\mathbf{75 - 100} \implies \mathbf{ON\_TRACK}$ (Safe, meeting expected pace)
  - $\mathbf{50 - 74} \implies \mathbf{MONITOR}$ (Warning, minor overdue items)
  - $\mathbf{0 - 49} \implies \mathbf{NEEDS\_ATTENTION}$ (Critical early intervention needed)
- **100% Deterministic:** Zero external AI dependencies or opaque third-party black boxes. 40 dedicated unit and property tests.

### 2.2 Enterprise FastAPI Backend (`backend/`)
- Declarative SQLAlchemy models portable between SQLite (zero-config local dev) and PostgreSQL.
- Direct `bcrypt` password hashing and signed `PyJWT` access tokens with role guards.
- Dynamic lifespan startup with automatic table initialization and realistic multi-persona seed data.
- 21 comprehensive integration tests verifying end-to-end lifecycle, permissions, and analytics.

### 2.3 Premium Next.js 14 Frontend Application (`frontend/`)
- Built with **Next.js 14 App Router**, **TypeScript**, and **Tailwind CSS**.
- **Integrated Google Stitch Design System (EduIntern):**
  - **Student Workspace (Stitch Screens 1 & 3):**
    - *Weekly Activity & Timesheet Report* header with instant PDF export and weekly log submission.
    - 3 Stitch KPI Summary Cards (*Total Hours Logged* with progress bar, *Report Status* with due badge, *Supervisor Review* with accreditation score).
    - Mon–Fri Daily Task Checklist with day filter pills (`ALL`, `MON`, `TUE`, `WED`, `THU`, `FRI`), estimated hours, and live attention score recalculation on checkbox toggle.
    - *Key Learnings & Blockers* logging with real-time state persistence.
    - *Supporting Evidence & Artifacts* file preview cards and interactive upload dropzone.
    - Right rail stack showing *Latest Mentor Feedback* quote with supervisor credentials and *Submission History*.
  - **Faculty Mentor Workspace (Stitch Screen 5):**
    - 4 KPI summary cards (*Active Interns*, *Pending Reviews*, *Intervention Queue*, *Cohort Evaluation*).
    - *Action Recommended Alert Banner* flagging overdue student check-ins with one-click review and dismiss actions.
    - *Submissions Awaiting Review* cards grid with modal dialog for interactive 1–100 score rating, constructive feedback, and instant grading.
    - *Student Progress Monitor* table with live status filter pills (`ALL`, `ON_TRACK`, `MONITOR`, `NEEDS_ATTENTION`), search, and milestone progress bars.
    - Right rail showing *Faculty Coordination* schedule and *Institutional Milestones* timeline.
  - **Administrative Command Center (Stitch Screens 4 & 2):**
    - 4 Institutional KPI cards with trend chips and accreditation indicators.
    - *Active Intervention Queue* table displaying students flagged by the 4-factor intelligence engine, with severity chips (`CRITICAL`, `WARNING`, `MODERATE`) and direct mentor outreach triggers.
    - *Department Status Distribution* progress bars and enrollment distribution grid.
    - *Institutional Audit Trail* live activity stream.
    - *Pending Applications Approval Queue* with faculty mentor allocation and placement authorization controls.
- **Mobile-First Responsive Layout:**
  - Slide-in navigation drawer on mobile viewports (`< 1024px`) with outside tap dismissal backdrop.
  - Role-specific 5-tab **Bottom Navigation Bar** tailored for Students, Mentors, and Administrators.
  - Responsive **Tables to Touch Cards** pattern ensuring high usability on smartphones.
  - Touch-friendly tap targets ($\ge 44\text{px}$) and notch-safe areas (`env(safe-area-inset-bottom)`).
- **Quick 1-Click Demo Login:** Dedicated persona switcher cards on landing and login screens to switch between Student, Mentor, and Admin without typing.

---

## 3. Demo Credentials (Pre-Seeded)

| Persona | Name | Email | Password | Pre-seeded Progress State |
| :--- | :--- | :--- | :--- | :--- |
| **Student (On Track)** | **Rohan Patil** | `student@demo.com` | `Student@123` | Quantum AI Labs • 80% Tasks Done • High Ratings • **ON_TRACK (82.4%)** |
| **Student (On Track)** | Alex Chen | `student.alex@university.edu` | `Student@123` | Google Cloud Intern • 80% Tasks Done • High Ratings • **ON_TRACK (89.4%)** |
| **Student (Monitor)** | Sneha Kulkarni | `student.sara@university.edu` | `Student@123` | TechNova Labs Intern • 50% Tasks Done • Moderate • **MONITOR (53.5%)** |
| **Student (Needs Attention)** | Aditya Joshi | `student.david@university.edu` | `Student@123` | FinEdge Solutions • 20% Tasks Done • Overdue Reports • **NEEDS_ATTENTION (24.0%)** |
| **Faculty Mentor** | **Dr. Alan Turing** | `mentor@demo.com` | `Mentor@123` | Computer Science Professor • Supervises Interns • Priority Triage Roster |
| **Administrator** | **Dean of Engineering** | `admin@demo.com` | `Admin@123` | Full Institutional Oversight • Approvals & Mentor Allocator |

> 💡 **Windows Startup Guide:** For step-by-step instructions on Windows, refer to **[RUN_LOCAL.md](RUN_LOCAL.md)**.
> 📱 **Responsive Architecture:** For breakpoint details and mobile design patterns, refer to **[RESPONSIVE_DESIGN.md](RESPONSIVE_DESIGN.md)**.

---

## 4. Quickstart Guide

### Prerequisites
- Python 3.10+ (Tested with Python 3.14)
- Node.js 18+ & npm (Tested with Node v24.15 & npm 11.12)

### 4.1 Running the Backend Service
```powershell
# From repository root
uvicorn backend.app.main:app --reload --port 8000
```
- API Base URL: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

### 4.2 Running the Frontend Application
```powershell
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:3000`

### 4.3 Running Automated Tests
```powershell
# Run complete test suite (61 tests) across Intelligence and Backend
python -m pytest -v
```

### 4.4 Verifying End-to-End Live Application
```powershell
# Run live e2e verification against running servers
python verify_e2e_live.py
```

---

## 5. Verification & Testing Evidence

1. **Intelligence Engine:** 40 unit tests in `intelligence/tests/` covering boundary conditions, division-by-zero guards, case variations, duplicate normalization, and reason deduplication.
2. **Backend Integration:** 21 integration tests in `backend/tests/test_api_integration.py` covering authentication, role permissions, milestone toggling, live attention calculations, triage ranking, and skill gap endpoints.
3. **Frontend Production Build:** Verified via `npm run build` in `frontend/` with zero TypeScript errors and all 10 static routes generated.
4. **Responsive Mobile Verification:** Tested across mobile (< 768px), tablet (768px – 1024px), and desktop (≥ 1024px) viewports.
