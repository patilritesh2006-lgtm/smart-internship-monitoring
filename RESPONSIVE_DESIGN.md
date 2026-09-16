# RESPONSIVE_DESIGN.md — Mobile + Web Architecture

## ED-06: Smart Internship Management & Monitoring System (SIMS)

This document details the responsive design architecture, breakpoint strategy, mobile-first design patterns, and viewport verification guidelines implemented for the SIMS platform.

---

## 1. Core Philosophy: Single Unified Responsive Platform

The application uses a **single, responsive codebase** that adapts dynamically across:
1. 💻 **Desktop Displays** (1440px, 1920px, 4K)
2. 💻 **Laptops** (1024px – 1366px)
3. 📱 **Tablets & iPads** (768px – 1024px, portrait & landscape)
4. 📱 **Mobile Smartphones** (360px – 430px: iPhone 12/13/14/15/Pro Max, Samsung Galaxy, Pixel)

Zero duplicated codebases, zero separate mobile subdomains, zero loss of backend or intelligence engine connectivity.

---

## 2. Breakpoint Architecture

| Target Device | Breakpoint | Layout Mechanics |
|:---|:---|:---|
| **Mobile Phones** | `< 768px` | Off-screen drawer sidebar, role-aware bottom navigation bar, card lists replacing tables, single-column forms, touch targets ≥ 44px. |
| **Tablets** | `768px – 1023px` | Drawer navigation with hamburger trigger, responsive tables, 2-column card grids, flexible top header. |
| **Desktop / Laptop** | `≥ 1024px` (`lg:`) | Persistent fixed 240px sidebar, bottom navigation hidden, full multi-column dashboard tables and analytics charts. |

---

## 3. Key Responsive Components

### A. Navigation Drawer & Mobile Backdrop
- **Desktop (`≥ 1024px`)**: The sidebar (`.sims-sidebar`) is fixed on the left at `240px` width.
- **Mobile (`< 1024px`)**: The sidebar is positioned off-screen (`transform: translateX(-100%)`). Tapping the hamburger button in `TopHeader` adds the `.drawer-open` class, sliding the menu in smoothly via CSS transition.
- **Backdrop Overlay (`.sims-backdrop`)**: A dimmed, blurred backdrop (`rgba(0, 0, 0, 0.45)`) appears over the main content. Tapping anywhere outside the drawer dismisses it immediately.

### B. Role-Aware Bottom Navigation (`.bottom-nav`)
- Appears fixed to the bottom of the viewport exclusively on mobile screens (`< 1024px`).
- Includes safe area padding for notched smartphones (`padding-bottom: env(safe-area-inset-bottom, 0px)`).
- Custom 5-tab configuration dynamically mapped to the authenticated user's role:
  - **Student**: Home (`overview`), Milestones (`milestones`), Reports (`reports`), Skills (`feedback`), Profile (`settings`)
  - **Faculty Mentor**: Overview (`overview`), Students (`milestones`), Reports (`reports`), Feedback (`feedback`), Settings (`settings`)
  - **Admin**: Dashboard (`overview`), Analytics (`milestones`), Post Job (`reports`), Mentors (`feedback`), Settings (`settings`)
- Displays active state indicators with an accent indicator bar and highlight color.

### C. Tables to Touch Cards Pattern
Dense data tables can degrade on mobile screens. SIMS applies a responsive layout switch:
- **Priority Triage Roster (Mentor Portal)**: Displays as rich, stacked cards with status badges and quick action buttons on `< 768px`, switching to `sims-table` on desktop.
- **Application History (Admin Portal)**: Touch cards displaying student name, status, role, and application timestamp on mobile; tabular data on desktop.
- **Faculty Mentor Directory (Admin Portal)**: Compact mentor cards on mobile; tabular view on desktop.

### D. Hero Banners & KPI Metric Cards
- **Hero Headers**: Switch from horizontal `flex-row` on desktop to `flex-col` with full-width primary CTA on mobile.
- **Mobile Greeting Card**: On mobile devices, a personalized welcome card ("Welcome back, {Name} 👋") is displayed with live status.
- **Metric Cards**: Fluid grid layout (`grid-cols-2 lg:grid-cols-4`) ensuring readable numbers and icons on 360px+ screens without cramping.

### E. Touch-Friendly Targets & Form Inputs
- All buttons, select menus, and input fields maintain a minimum touch target of 42–44px.
- Select inputs feature custom SVG arrows styled for touch ergonomics.
- Forms automatically wrap into single columns on mobile screens (`grid-cols-1 sm:grid-cols-2`).

---

## 4. Verification & Testing Matrix

| Page / Route | Mobile (375px) | Tablet (768px) | Desktop (1280px+) |
|:---|:---:|:---:|:---:|
| **Landing (`/`)** | Verified ✓ | Verified ✓ | Verified ✓ |
| **Login (`/login`)** | Verified ✓ | Verified ✓ | Verified ✓ |
| **Register (`/register`)** | Verified ✓ | Verified ✓ | Verified ✓ |
| **Student Dashboard (`/student`)** | Verified ✓ | Verified ✓ | Verified ✓ |
| **Mentor Dashboard (`/mentor`)** | Verified ✓ | Verified ✓ | Verified ✓ |
| **Admin Dashboard (`/admin`)** | Verified ✓ | Verified ✓ | Verified ✓ |

---

## 5. Verification Commands

Verify compilation and test integrity:
```powershell
# Run all backend unit and intelligence tests (61 tests)
python -m pytest

# Build frontend production bundle with Next.js & TypeScript
cd frontend
npm run build
```
