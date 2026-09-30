# Automated Testing Documentation (Pytest & Playwright)

## Overview

The **Smart Internship Management & Monitoring System (SIMMS / EduIntern)** maintains a comprehensive, dual-tiered automated testing architecture:
1. **Pytest Suite:** 75 fast unit, integration, ML pipeline, and contract verification tests covering the FastAPI backend, SQLAlchemy ORM, deterministic 4-factor scoring, Scikit-Learn early-warning model, and SHAP explainability engine.
2. **Playwright E2E Suite:** 118 unique end-to-end browser specifications (354 cross-browser executions) verifying complete real-world user workflows, RBAC guards, security tamper resistance, responsiveness, and database lifecycle persistence.

---

## 1. Pytest Automated Test Suite (75 Tests)

The pytest suite verifies the core business logic, API endpoints, and intelligence layer in 14–16 seconds.

### Test Breakdown by Subsystem

| Test Suite File | Subsystem | Tests | Status | Scope |
| :--- | :--- | :---: | :---: | :--- |
| `backend/tests/test_api_integration.py` | FastAPI Backend | **23** | ✅ PASS | Auth registration/login, RBAC 403s, task toggling, report submissions, mentor reviews, live attention calculation, triage sorting, duplicate conflict handling (409). |
| `intelligence/tests/test_ml_pipeline.py` | ML Early-Warning & SHAP | **21** | ✅ PASS | Synthetic dataset distributions, preprocessor bounds and one-hot encoding, RandomForest training and calibration, SHAP feature attributions, hybrid decision invariants (inactivity override, ML escalation), deterministic fallback. |
| `intelligence/tests/test_progress_analysis.py` | Deterministic Progress Core | **17** | ✅ PASS | 4-factor linear scoring math, boundary clamps $[0, 100]$, division-by-zero protection, threshold status transitions, input validation, reason deduplication. |
| `intelligence/tests/test_skill_gap.py` | Skill Gap Algebra | **14** | ✅ PASS | Case insensitivity, whitespace trimming, set deduplication, zero required skills edge case, rule-based recommendations, batch pandas DataFrame analytics. |
| **TOTAL** | **Full Pytest Suite** | **75** | ✅ **75/75 (100%)** | Zero failures, zero skips across all 4 suites. |

### Running Pytest

```powershell
# From repository root with virtual environment:
venv\Scripts\python -m pytest backend/tests intelligence/tests -v
```

---

## 2. Playwright Automated E2E Test Suite (118 Tests)

### Test Architecture

The E2E suite is structured cleanly into 14 modular categories with reusable Page Object Models, custom fixtures, and isolated test data generators:

```text
smart-internship-management/
├── package.json                   # Root package with test:e2e runner scripts
├── playwright.config.ts           # Multi-browser, webServer, and reporter configuration
├── playwright-report/             # Self-contained visual HTML test reports
├── tests/
│   ├── fixtures/                  # Reusable test utilities & page objects
│   │   ├── test-data.ts           # Pre-seeded credentials & dynamic test generators
│   │   ├── auth.fixture.ts        # Authenticated student/mentor/admin contexts
│   │   └── page-objects/          # Page Object Models
│   │       ├── LandingPage.ts
│   │       ├── LoginPage.ts
│   │       ├── RegisterPage.ts
│   │       ├── StudentDashboardPage.ts
│   │       ├── MentorDashboardPage.ts
│   │       └── AdminDashboardPage.ts
│   ├── health/                    # Startup & system health (5 tests)
│   ├── auth/                      # Login, SSO personas, sessions & logout (9 tests)
│   ├── navigation/                # Route protection, history & 404 handling (7 tests)
│   ├── ui/                        # Visual components, cards, banners & badges (6 tests)
│   ├── forms/                     # Form controls, role toggles & inputs (7 tests)
│   ├── crud/                      # Tasks, reports, opportunities & reviews (6 tests)
│   ├── api/                       # REST API integration & AI analytics endpoints (8 tests)
│   ├── validation/                # Boundary constraints & input validation (6 tests)
│   ├── security/                  # RBAC role guards & token tampering safety (5 tests)
│   ├── responsive/                # Desktop, Tablet & Mobile drawer testing (6 tests)
│   ├── error-handling/            # Fault tolerance, bad input & network errors (5 tests)
│   ├── accessibility/             # Form labels, aria attributes & keyboard navigation (5 tests)
│   ├── workflows/                 # Complete end-to-end multi-role journeys (4 tests)
│   └── security/security-audit.spec.ts # Deep security, brute force, XSS & privilege tests (39 tests)
```

### Playwright Test Statistics

| Category | Suite | Test Cases | Scope / Highlights |
| :--- | :--- | :---: | :--- |
| **A** | Startup & Health Checks | 5 | Backend `/health`, frontend HTTP 200, zero console errors, branding, meta SEO. |
| **B** | Authentication & Session Management | 9 | Quick-login personas, JWT storage, credential validation, logout cleanup. |
| **C** | Navigation & Route Protection | 7 | Cross-role redirection, unauthenticated bouncing, 404 handling, browser back/forward. |
| **D** | UI Components & Visual Elements | 6 | GlassCard render, status badges, hero banner, interactive preview tabs, modal open. |
| **E** | Form Controls & Interactive Inputs | 7 | Dynamic task toggling, weekly report inputs, skill additions, radio selectors. |
| **F** | Real Application CRUD Operations | 6 | Live task creation/toggling, report submission, mentor review score persistence. |
| **G** | Backend REST API Integration | 8 | Direct API calls verifying JWT headers, JSON contracts, and intelligence payloads. |
| **H** | Input Validation & Boundary Checks | 6 | Malformed email formats, password length rules, required inputs, whitespace trimming. |
| **I** | Role-Based Access Control | 5 | Student $\to$ Admin blocked, Mentor $\to$ Admin blocked, token manipulation safety. |
| **J** | Responsive & Multi-Viewport Testing | 6 | Mobile viewport (375px), Tablet (768px), Desktop (1280px), slide-in mobile drawer. |
| **K** | Error Handling & Fault Tolerance | 5 | Network error resiliency, invalid route recovery, backend offline handling. |
| **L** | Accessibility (a11y) & Usability | 5 | Label associations, ARIA roles, tab order, focus rings, minimum tap targets ($\ge 44\text{px}$). |
| **M** | End-to-End User Workflows | 4 | Multi-role journeys: Student submit $\to$ Mentor review $\to$ Admin approve. |
| **N** | Deep Security Audit Suite | 39 | Login rate limiting, SQLi/XSS payloads, admin registration blocking, parameter pollution. |
| **TOTAL** | **Unique Test Cases** | **118** | **118 unique test specifications in 14 spec files** |
| **MATRIX**| **Cross-Browser Executions** | **354** | **118 tests &times; 3 browser targets (Chromium, Firefox, Mobile Chrome)** |

---

## 3. Quick Start Guide

### Prerequisites
- Node.js 18+ & npm
- Python 3.10+ (Tested with Python 3.14)

### Running Playwright Tests

From the project root:

```powershell
# 1. Recommended: Fast Chromium-only run (118 tests)
npm run test:e2e:chromium
# or: npx playwright test --project=chromium

# 2. Run with Interactive Visual UI mode (recommended for debugging)
npm run test:e2e:ui

# 3. Run full cross-browser matrix (354 tests across Chromium, Firefox, Mobile Chrome)
npm run test:e2e

# 4. View generated HTML visual test report
npm run test:e2e:report
```

### Running Specific Test Categories

```powershell
# Run only Health & Startup checks
npx playwright test tests/health/health.spec.ts

# Run only Security Audit tests (39 tests)
npx playwright test tests/security/security-audit.spec.ts

# Run only End-to-End Workflows
npx playwright test tests/workflows/workflows.spec.ts

# Run only Authentication tests
npx playwright test tests/auth/auth.spec.ts
```

---

## 4. Quality & Reliability Invariants

- **Automated WebServer Orchestration:** `playwright.config.ts` automatically detects whether backend (port 8000) and frontend (port 3000) are already active. If active, it attaches seamlessly (`reuseExistingServer: true`).
- **SQLite Concurrency Protection:** Configured with `workers: 1` and `fullyParallel: false` to eliminate database file lock contention on SQLite during rapid writes.
- **Zero Fragile Locators:** Uses semantic accessibility selectors (`getByRole`, `getByLabel`, `getByPlaceholder`, `getByText`).
- **Deterministic Test Data:** Uses isolated timestamps and pre-seeded student personas without destroying demo evaluation records.
