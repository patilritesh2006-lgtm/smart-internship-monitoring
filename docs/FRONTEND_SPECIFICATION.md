# Frontend Specification & UI/UX Design System

**Project:** Smart Internship Management & Monitoring System  
**Framework:** Next.js 14+ (App Router) | React 18+ | TypeScript | Tailwind CSS  
**Version:** 1.0.0  

---

## 1. Design System & Visual Tokens

The frontend follows a cohesive, professional institutional theme optimized for clarity, accessibility, and fast information scanning.

### 1.1 Color Palette
- **Primary / Brand:** Deep Indigo (`#4338CA` / `bg-indigo-700`) and Navy (`#1E1B4B` / `bg-slate-900`) for headers and primary interactions.
- **Surface & Backgrounds:** Crisp slate (`#F8FAFC` / `bg-slate-50`) with pure white card surfaces (`#FFFFFF` / `bg-white`) bordered by subtle slate boundaries (`#E2E8F0` / `border-slate-200`).
- **Status Badges & Attention Tokens:**
  - `ON_TRACK`: Emerald (`#059669` / `bg-emerald-50 text-emerald-700 border-emerald-200`)
  - `MONITOR`: Amber (`#D97706` / `bg-amber-50 text-amber-700 border-amber-200`)
  - `NEEDS_ATTENTION`: Rose / Crimson (`#DC2626` / `bg-rose-50 text-rose-700 border-rose-200`)
  - `PENDING`: Blue / Slate (`#2563EB` / `bg-blue-50 text-blue-700 border-blue-200`)

### 1.2 Typography & Spacing
- **Font Family:** Modern Sans-Serif (`Inter`, `system-ui`).
- **Scale:** `text-xs` (meta labels), `text-sm` (body/tables), `text-base` (cards/inputs), `text-xl` to `text-3xl` (headers/metrics).
- **Component Padding:** Standardized 4-point grid (`p-4`, `p-6`, `gap-6`).

---

## 2. Core Workflows & Screen Specifications

### 2.1 Student Portal

```text
[Login / Register] ──→ [Student Dashboard]
                             │
       ┌─────────────────────┼─────────────────────┐
       ▼                     ▼                     ▼
[Browse Internships]   [Active Tasks]     [Weekly Reports]
       │                     │                     │
[Skill Gap Analysis]   [Toggle Done]       [Submit Report]
       │                                           │
[Submit Application]                       [View Feedback]
```

#### Student Dashboard Layout
- **Hero Banner:** Personalized greeting (`"Welcome back, Alex"`), active internship role, and company name.
- **KPI Metrics Grid:**
  - **Overall Progress:** Circular gauge / progress bar showing percentage (e.g., $78\%$).
  - **Tasks Completed:** Ratio card (e.g., `8 / 10 Tasks Done`).
  - **Reports Submitted:** Ratio card (e.g., `5 / 6 Reports Filed`).
  - **Skill Alignment:** Percentage badge (e.g., `85% Match`).
- **Attention Health Banner:**
  - Dynamic status banner (`ON_TRACK`, `MONITOR`, or `NEEDS_ATTENTION`).
  - Detailed bullet list of explainable reasons (e.g., `"Weekly reports are pending"`, `"Mentor feedback is pending"`).
  - Concrete recommended actions with immediate action buttons.
- **Skill Gap Playground:**
  - Allows student to select any target internship, compare their skills against requirements, inspect missing competencies, and receive rule-based advice.

---

### 2.2 Mentor Portal

```text
[Mentor Login] ──→ [Mentor Dashboard]
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
[Assigned Interns Roster]       [Weekly Report Review Queue]
        │                                 │
[Filter by Attention Flag]       [Inspect Submission & Hours]
        │                                 │
[View Individual Progress]       [Submit Feedback & Score]
```

#### Mentor Dashboard Layout
- **Triage Attention List:** Visual table of assigned students flagged by priority:
  - Intern name, company, overall attention badge.
  - Quick flags: Overdue reports counter, pending feedback indicators.
- **Student Inspection View:**
  - Multi-tab drawer/page showing task completion list and report history.
- **Report Review Modal:**
  - View report text and hours reported.
  - Input field for qualitative mentor feedback and numerical score ($0-100$).

---

### 2.3 Admin Portal

```text
[Admin Login] ──→ [Institutional Overview]
                        │
    ┌───────────────────┼───────────────────┐
    ▼                   ▼                   ▼
[Manage Internships] [Applications]  [Mentor Allocations]
```

#### Admin Dashboard Layout
- **Institutional Summary Cards:**
  - Total registered students, active internships, verified mentors, partner companies.
  - Application queue counter (`14 Pending Approvals`).
- **Application Review Table:**
  - Student name, GPA/Department, Target Internship, Skill Gap match score.
  - One-click `Approve` or `Reject` actions.
- **Mentor Allocation Drawer:**
  - Assign approved internships to verified faculty mentors.

---

## 3. Mandatory UI States

Every view and component implements five fundamental states:

1. **Loading State:** Skeleton shimmer loaders matching the card/table geometry. Never leave blank white screens.
2. **Success State:** Instant visual feedback (green confirmation toast or updated badge).
3. **Empty State:** Illustrated empty container with actionable message (e.g., *"No reports submitted yet. File your Week 1 report to start tracking progress."*).
4. **Error State:** Clear, non-technical error notification with retry button.
5. **Unauthorized State:** Clean redirect to `/login` with expired session alert.
