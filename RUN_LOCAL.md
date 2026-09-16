# RUN_LOCAL.md — Beginner Localhost Startup Guide (Windows 10 / 11)

Welcome to the **Smart Internship Management and Monitoring System (SIMMS)** — Problem Statement **ED-06**.

This guide is written for judges, evaluators, and developers to run the complete prototype on a standard Windows laptop using **100% offline, local execution** with **zero paid APIs, zero cloud setup, and zero API keys**.

---

## System Architecture

```text
       Frontend (Next.js 14 + Tailwind CSS)
            http://localhost:3000
                     │
             REST API (FastAPI)
            http://localhost:8000
                     │
             SQLite Database
              internship.db
                     │
     Deterministic Intelligence Engine
  (4-Factor Attention Scoring & Skill Gap Analysis)
```

---

## Prerequisites Verification

Before starting, open a PowerShell terminal and verify that **Python** and **Node.js** are installed.

### Step 1 — Verify Python
```powershell
python --version
```
* **Expected Output:** `Python 3.10.x`, `3.11.x`, `3.12.x`, `3.13.x`, or `3.14.x`
* *If not recognized, see [Troubleshooting Section](#troubleshooting-common-windows-errors).*

### Step 2 — Verify Node.js and npm
```powershell
node --version
npm --version
```
* **Expected Output:** `v18.x`, `v20.x`, or higher; npm `v9.x` or higher.
* *If not recognized, install from [nodejs.org](https://nodejs.org).*

---

## Step 3 — Backend Setup & Startup (Terminal 1)

Open **PowerShell Window #1**, navigate to the project directory, and run:

```powershell
cd c:\Users\Rajnandini\Desktop\smart-internship-management

# 1. (Optional) Create and activate a Python virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Initialize and seed SQLite database (creates internship.db with demo data)
python backend/seed.py

# 4. Start the FastAPI backend server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

* **Expected Terminal 1 Output:**
  ```text
  INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
  INFO:     Application startup complete.
  ```
* **Health Check URL:** Open [http://localhost:8000/health](http://localhost:8000/health) to verify backend is active.
* **Interactive OpenAPI Documentation:** Open [http://localhost:8000/docs](http://localhost:8000/docs).

---

## Step 4 — Frontend Setup & Startup (Terminal 2)

Open **PowerShell Window #2**, navigate to the `frontend` folder, and run:

```powershell
cd c:\Users\Rajnandini\Desktop\smart-internship-management\frontend

# 1. Install Node.js dependencies (only needed first time)
npm install

# 2. Start Next.js development server
npm run dev
```

* **Expected Terminal 2 Output:**
  ```text
  ▲ Next.js 14.2.35
  - Local:        http://localhost:3000
  ✓ Ready in 2.5s
  ```

---

## Step 5 — Open the Application in Browser

Open Google Chrome, Edge, or Firefox and go to:

👉 **[http://localhost:3000](http://localhost:3000)**

You will see the **Smart Internship Management & Monitoring System** enterprise landing page.

---

## Step 6 — Demo Accounts & Login Credentials

On the login page ([http://localhost:3000/login](http://localhost:3000/login)), you can click any of the **One-Click Quick Login Cards** or type credentials manually:

| Role | Name | Email | Password | Pre-seeded Progress State |
| :--- | :--- | :--- | :--- | :--- |
| **Student (On Track)** | **Rohan Patil** | `student@demo.com` | `Student@123` | **ON_TRACK (82.4%)** — AI/ML Intern at Quantum AI Labs |
| **Student (Monitor)** | **Sneha Kulkarni** | `student.sara@university.edu` | `Student@123` | **MONITOR (53.5%)** — Python Intern at TechNova Labs |
| **Student (Attention)** | **Aditya Joshi** | `student.david@university.edu` | `Student@123` | **NEEDS_ATTENTION (24.0%)** — UX Intern at FinEdge Solutions |
| **Faculty Mentor** | **Dr. Alan Turing** | `mentor@demo.com` | `Mentor@123` | **3 Assigned Interns** triaged by Attention Priority |
| **Administrator** | **Dean of Engineering** | `admin@demo.com` | `Admin@123` | **Full Institutional Dashboard** (Placements, Health, Approvals) |

---

## Step 7 — Step-by-Step Judge Demonstration Flow

Follow this exact walkthrough to demonstrate the complete end-to-end lifecycle to judges in under 4 minutes:

### 1. Student Dashboard & Live Intelligence (Rohan Patil)
1. Click **"Sign In as Student (Rohan Patil)"** on `/login`.
2. **Dashboard Overview:**
   - Notice the **Active Internship Card**: *AI/ML Intern* at *Quantum AI Labs*.
   - View the **Live Intelligence Banner**: Status is **ON TRACK (82.4%)**.
   - Review the **Explainable Factors Breakdown**:
     - Task Completion: $80.0\%$ (4 of 5 tasks finished).
     - Report Submission: $100.0\%$ (4 of 4 reports filed).
     - Mentor Feedback: $92.3\%$ average.
     - Progress Consistency: $90.0\%$.
   - Read the **Transparent Reasons**: *"Progress is consistent."*
3. **Milestone Task Management:**
   - Click the **"Milestone Tasks"** tab.
   - Click the checkbox next to `"Package service and deploy to staging cluster"`.
   - Watch the task immediately toggle to completed and the overall progress bar update!
4. **Weekly Reports Workflow:**
   - Click the **"Weekly Reports"** tab.
   - Click **"Submit Weekly Report"**.
   - Enter Week 5 achievements: `"Benchmarked inference latency on staging cluster. Passed throughput tests."`
   - Click **"Submit Report to Mentor"**. Notice the report appears instantly under submitted reports.
5. **Skill Gap Analysis:**
   - Click the **"Discover Opportunities"** tab.
   - Click on the *DevOps & Cloud Infrastructure Intern* opportunity.
   - Click **"Analyze Skill Gap"**.
   - Notice the real deterministic engine output:
     - Matched skills: `Git`
     - Missing skills: `Docker`, `Kubernetes`, `AWS`, `CI/CD`
     - Match percentage: $20.0\%$
     - Recommendation: Specific guidance on missing technologies!
6. Click **Logout** in the top navigation bar.

---

### 2. Mentor Monitoring & Triage Dashboard (Dr. Alan Turing)
1. Click **"Sign In as Faculty Mentor (Dr. Alan Turing)"** on `/login`.
2. **Intelligent Intern Triage:**
   - The system automatically sorts students by attention urgency:
     1. **Aditya Joshi** — Flagged as `NEEDS_ATTENTION` ($24.0\%$) with specific reasons:
        - *"Task completion is below the expected level."*
        - *"Weekly reports are pending."*
        - *"Mentor feedback is pending."*
        - *"Progress updates are inconsistent."*
     2. **Sneha Kulkarni** — Flagged as `MONITOR` ($53.5\%$).
     3. **Rohan Patil** — `ON_TRACK` ($82.4\%$).
3. **Intern Deep-Dive Drawer:**
   - Click **"View Analysis"** next to Aditya Joshi.
   - View detailed milestone checklist, report history, and actionable recommendations.
4. **Evaluate Submitted Reports:**
   - Click the **"Report Reviews"** tab.
   - Click **"Review Report"** on any pending submission.
   - Enter Score: `90`, Feedback: `"Great progress this week, clean Docker setup."`
   - Click **"Submit Evaluation"**.
   - Notice the report status updates to `REVIEWED` and the student's attention score dynamically recalculates!
5. Click **Logout**.

---

### 3. Administrator Institutional Oversight & Opportunity Posting (Dean)
1. Click **"Sign In as Administrator (Dean)"** on `/login`.
2. **Institutional Analytics:**
   - View macro metrics: Total Students (7), Total Opportunities (8), Active Placements (6), Average Institutional Health ($65.8\%$).
   - Notice the attention distribution cards: On Track, Monitor, and Needs Attention counts.
3. **Application Review & Mentor Assignment:**
   - Click the **"Application Review"** tab.
   - Locate Maya Patel's pending application for *DevOps & Cloud Infrastructure Intern*.
   - Select Mentor: `Dr. Alan Turing`.
   - Click **"Approve Application"**.
   - Instantly, Maya Patel's application becomes `APPROVED`, she is allocated an active placement, and standard milestone tasks are automatically provisioned!
4. **Post a New Internship Opportunity:**
   - Click the **"Post Opportunity"** tab.
   - Fill in:
     - Title: `Autonomous AI Systems Engineer`
     - Company: `Quantum AI Labs`
     - Required Skills: `Python, FastAPI, PyTorch, Docker`
     - Stipend: `4000`
   - Click **"Publish Internship Opportunity"**.
   - Instantly available for student discovery and skill gap evaluation!

---

## Troubleshooting Common Windows Errors

### 1. `'python'` is not recognized as an internal or external command
* **Meaning:** Python is installed, but its directory is not included in the Windows system `PATH` environment variable.
* **Fix:**
  1. Press `Win + S`, search for **"Environment Variables"**, and click **"Edit the system environment variables"**.
  2. Click **"Environment Variables..."** $\to$ Select `Path` under User variables $\to$ Click **Edit**.
  3. Add the path to your Python installation, for example:
     - `C:\Users\<YourUsername>\AppData\Local\Programs\Python\Python312`
     - `C:\Users\<YourUsername>\AppData\Local\Programs\Python\Python312\Scripts`
  4. Restart your PowerShell terminal and run `python --version`.

---

### 2. `'node'` or `'npm'` is not recognized
* **Meaning:** Node.js is not installed or not in your Windows `PATH`.
* **Fix:**
  1. Download the LTS installer from [nodejs.org](https://nodejs.org).
  2. Run the installer and ensure **"Add to PATH"** checkbox is checked.
  3. Open a **new** PowerShell window and verify: `node --version`.

---

### 3. Execution of scripts is disabled on this system (`Activate.ps1`)
* **Meaning:** Windows PowerShell restricts running scripts by default policy.
* **Fix:**
  Run this command in PowerShell as Administrator or current user:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```
  Then re-run `.\venv\Scripts\Activate.ps1`.

---

### 4. Port 8000 already in use
* **Meaning:** A previous backend process or other local service is holding port 8000.
* **Fix:**
  Find and terminate the process on port 8000:
  ```powershell
  # Find PID
  netstat -ano | findstr :8000
  # Kill process by PID (e.g. 14956)
  taskkill /PID <PID> /F
  ```
  Alternatively, run backend on another port:
  ```powershell
  python -m uvicorn backend.app.main:app --port 8001
  ```

---

### 5. Port 3000 already in use
* **Meaning:** Another Next.js dev server is running on port 3000.
* **Fix:**
  Next.js can automatically run on another port:
  ```powershell
  npm run dev -- -p 3001
  ```
  Or kill the process on port 3000:
  ```powershell
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  ```

---

### 6. CORS error in Browser Console (`Access-Control-Allow-Origin`)
* **Meaning:** Frontend on port 3000 is calling port 8000, but origins do not match.
* **Fix:**
  The backend already includes `http://localhost:3000` in `backend/app/core/config.py`.
  If you are running on custom ports, set `CORS_ORIGINS` in your environment:
  ```powershell
  $env:CORS_ORIGINS="http://localhost:3000,http://localhost:3001"
  python -m uvicorn backend.app.main:app --port 8000
  ```

---

### 7. `ModuleNotFoundError: No module named 'fastapi'` or similar
* **Meaning:** Required packages are not installed in the currently active Python environment.
* **Fix:**
  Make sure your virtual environment is activated (`.\venv\Scripts\activate`) and run:
  ```powershell
  pip install -r backend/requirements.txt
  ```

---

### 8. `Database error` or `Table does not exist`
* **Meaning:** `internship.db` was not initialized or was partially created.
* **Fix:**
  Re-initialize cleanly:
  ```powershell
  python backend/seed.py
  ```
  This creates all tables and populates all demo personas in seconds.

---

### 9. Frontend cannot connect to Backend (`Failed to fetch`)
* **Meaning:** Backend on `http://127.0.0.1:8000` is not running.
* **Fix:**
  1. Verify backend terminal shows `Application startup complete`.
  2. Open [http://localhost:8000/health](http://localhost:8000/health) in browser.
  3. Ensure `NEXT_PUBLIC_API_URL` points to `http://localhost:8000/api` (default in `frontend/src/lib/api.ts`).

---

## Hackathon Scoring Alignment Summary

| Criteria | How It Is Solved in SIMMS |
| :--- | :--- |
| **Real Institutional Workflow** | Full lifecycle: Student Application $\to$ Admin Review $\to$ Mentor Assignment $\to$ Milestone Tasks $\to$ Weekly Reports $\to$ Mentor Evaluation. |
| **Differentiating Intelligence** | 4-factor deterministic scoring ($30\%$ consistency, $30\%$ tasks, $20\%$ reports, $20\%$ mentor feedback) + Normalized Skill Gap Engine. |
| **Zero Mock / 100% Real DB** | Every click writes to and reads from real SQLite database tables with atomic transactions. |
| **Enterprise UI Design** | Rich dark-mode glassmorphic interface, Lucide icons, responsive drawer modals, and live badges. |
| **100% Localhost & Offline** | Zero external API calls, zero credit card/API key requirements, fully runnable on any Windows laptop. |
