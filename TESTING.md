# Automated E2E Testing Documentation (Playwright)

## Overview

The **Smart Internship Management & Monitoring System (SIMMS)** includes a complete, production-quality automated End-to-End (E2E) testing suite powered by [Playwright](https://playwright.dev/).

The testing system verifies actual application workflows, role-based access security, deterministic AI intelligence engine analytics, form submissions, and database state across all core personas (**Student**, **Faculty Mentor**, and **Administrator**).

---

## Test Suite Architecture

The test suite is structured cleanly into 13 modular categories with reusable Page Object Models, custom fixtures, and isolated test data generators:

```text
smart-internship-management/
├── package.json                   # Root package with test:e2e runner scripts
├── playwright.config.ts           # Multi-browser, webServer, and reporter configuration
├── playwright-report/             # Self-contained visual HTML test reports
│   └── index.html
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
│   └── workflows/                 # Complete end-to-end multi-role journeys (4 tests)
```

---

## Test Statistics

| Category | Suite | Test Cases | Status |
| :--- | :--- | :--- | :--- |
| **A** | Startup & Health Checks | 5 | ✅ PASSED |
| **B** | Authentication & Session Management | 9 | ✅ PASSED |
| **C** | Navigation & Route Protection | 7 | ✅ PASSED |
| **D** | UI Components & Visual Elements | 6 | ✅ PASSED |
| **E** | Form Controls & Interactive Inputs | 7 | ✅ PASSED |
| **F** | Real Application CRUD Operations | 6 | ✅ PASSED |
| **G** | Backend REST API Integration | 8 | ✅ PASSED |
| **H** | Input Validation & Boundary Checks | 6 | ✅ PASSED |
| **I** | Role-Based Access Control & Security | 5 | ✅ PASSED |
| **J** | Responsive & Multi-Viewport Testing | 6 | ✅ PASSED |
| **K** | Error Handling & Fault Tolerance | 5 | ✅ PASSED |
| **L** | Accessibility (a11y) & Usability Checks | 5 | ✅ PASSED |
| **M** | End-to-End User Workflows | 4 | ✅ PASSED |
| **TOTAL** | **Comprehensive Full Suite** | **79** | **79 / 79 PASSED (100%)** |

---

## Quick Start Guide for Beginners

### 1. Prerequisites

Ensure you have Node.js (v18+) and Python (v3.10+) installed on your machine.

```powershell
node -v
npm -v
python --version
```

### 2. Install Dependencies

From the project root (`smart-internship-management`):

```powershell
# Install root Playwright test runner dependencies
npm install

# Install Playwright browser engines
npx playwright install chromium
```

### 3. Run the Backend & Frontend

Playwright is configured with automated `webServer` detection and will reuse already running servers or launch them automatically.

To start them manually if desired:

**Terminal 1 (Backend):**
```powershell
.\venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

**Terminal 2 (Frontend):**
```powershell
npm run start --prefix frontend
# or
npm run dev --prefix frontend
```

---

## Running the Tests

All commands can be run directly from the project root directory:

### Run All 79 Tests Headless
```powershell
npm run test:e2e
# or
npm run test:e2e:chromium
```

### Run Tests with Interactive UI Mode
Allows step-by-step visual inspection, DOM time travel, and locator playground:
```powershell
npm run test:e2e:ui
```

### Run Tests in Headed Browser
Watch the real Chrome browser open and interact with the pages:
```powershell
npm run test:e2e:headed
```

### Run Tests in Debug Mode
Opens the Playwright Inspector with breakpoints:
```powershell
npm run test:e2e:debug
```

### View Interactive HTML Test Report
```powershell
npm run test:e2e:report
# or
npx playwright show-report
```

---

## Running Specific Test Suites

```powershell
# Run only Authentication tests
npx playwright test tests/auth

# Run only REST API integration tests
npx playwright test tests/api

# Run only End-to-End User Workflows
npx playwright test tests/workflows

# Run only CRUD operations tests
npx playwright test tests/crud

# Run only Responsive multi-device tests
npx playwright test tests/responsive

# Run a single specific test file
npx playwright test tests/health/health.spec.ts
```

---

## How to Change the Base URL

By default, tests run against `http://localhost:3000`. You can point tests to an alternative host or port using the `PLAYWRIGHT_TEST_BASE_URL` environment variable:

```powershell
$env:PLAYWRIGHT_TEST_BASE_URL="http://localhost:3001"
npx playwright test
```

---

## How to Add a New Test

1. Pick or create a category folder under `tests/` (e.g. `tests/forms/my-feature.spec.ts`).
2. Import `test` and `expect` from `@playwright/test`.
3. Utilize existing Page Objects from `tests/fixtures/page-objects/` or demo accounts from `tests/fixtures/test-data.ts`.
4. Example:

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../fixtures/page-objects/LoginPage';
import { DEMO_USERS } from '../fixtures/test-data';

test('Verify student portal title', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.quickLoginAs('student');
  await page.waitForURL('**/student');
  await expect(page).toHaveTitle(/EduIntern|SIMMS/i);
});
```

---

## Application Issues Discovered & Fixed During Integration

1. **Missing Backend Dependency (`email-validator`)**:
   - *Issue*: Pydantic schemas in `backend/app/schemas` use `EmailStr`. The virtual environment lacked `email-validator` causing FastAPI startup failure.
   - *Fix*: Installed `email-validator` into `venv` (`pip install email-validator`), matching `requirements.txt`.

2. **Client-Side Registration SPA Desynchronization**:
   - *Issue*: In `frontend/src/app/register/page.tsx`, successful registration stored authentication tokens into `localStorage` and called client-side `router.push('/student')`. Because `AuthContext` was not mounted or updated in-memory, the destination portal detected `user === null` and bounced the new user straight back to `/login`.
   - *Fix*: Updated `register/page.tsx` to use full window navigation (`window.location.href`), ensuring `AuthContext` initializes with the new session immediately.

---

## Quality Highlights

- **Zero Fragile Selectors**: Semantic queries (`getByRole`, `getByLabel`, `getByPlaceholder`, `getByText`) and stable class boundaries.
- **No Arbitrary Sleep Timers**: Tests rely on Playwright auto-waiting, `waitForURL`, and locator visibility assertions.
- **Safe Test Isolation**: Generated test records use unique timestamps (`test.student.<timestamp>@university.edu`) preventing collision or destruction of pre-seeded evaluation demo data.
- **Zero Paid Dependencies**: 100% local execution on standard Windows localhost.
