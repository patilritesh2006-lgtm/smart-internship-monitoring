# API Contract Specification

**Service Name:** Smart Internship Management & Monitoring System API  
**Base URL:** `http://localhost:8000/api`  
**Authentication Scheme:** `Bearer <JWT>` in HTTP header `Authorization: Bearer <token>`  
**Specification Version:** 1.0.0  

---

## 1. Authentication Endpoints (`/api/auth`)

### 1.1 `POST /api/auth/register`
- **Description:** Registers a new user (Student, Mentor, or Admin) and provisions corresponding profile records.
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "email": "student.new@university.edu",
    "password": "SecurePassword@123",
    "full_name": "Jane Doe",
    "role": "STUDENT",
    "department": "Computer Science & Engineering",
    "academic_year": 3,
    "roll_number": "CS-2024-099",
    "designation": null,
    "employee_id": null
  }
  ```
- **Response Status:** `201 Created`
- **Response Body:**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "user_id": 5,
    "email": "student.new@university.edu",
    "full_name": "Jane Doe",
    "role": "STUDENT"
  }
  ```
- **Error Responses:**
  - `409 Conflict`: Email already exists.
  - `400 Bad Request`: Invalid role or password shorter than 6 characters.

### 1.2 `POST /api/auth/login`
- **Description:** Authenticates user credentials via direct bcrypt verification and returns signed JWT access token.
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "email": "student.alex@university.edu",
    "password": "Student@123"
  }
  ```
- **Response Status:** `200 OK`
- **Response Body:** Same as `TokenResponse` above.
- **Error Responses:**
  - `401 Unauthorized`: Invalid credentials.
  - `403 Forbidden`: Inactive account.

### 1.3 `GET /api/auth/me`
- **Description:** Returns authenticated profile of the calling user.
- **Auth Required:** Yes (Any authenticated role)
- **Response Status:** `200 OK`
- **Response Body:**
  ```json
  {
    "id": 1,
    "email": "admin@university.edu",
    "full_name": "Dean of Engineering (Admin)",
    "role": "ADMIN",
    "is_active": true,
    "created_at": "2026-09-16T13:20:00Z"
  }
  ```

---

## 2. Student Endpoints (`/api/students`)

### 2.1 `GET /api/students/me`
- **Description:** Fetches current student profile and technical skills list.
- **Auth Required:** Yes (`STUDENT`)
- **Response Status:** `200 OK`

### 2.2 `PUT /api/students/me`
- **Description:** Updates phone number, department, academic year, and acquired skills list.
- **Auth Required:** Yes (`STUDENT`)
- **Request Body:**
  ```json
  {
    "skills": ["Python", "FastAPI", "React", "Docker"]
  }
  ```
- **Response Status:** `200 OK`

### 2.3 `GET /api/students/me/internship`
- **Description:** Returns the active allocated internship, company profile, and assigned faculty supervisor.
- **Auth Required:** Yes (`STUDENT`)
- **Response Status:** `200 OK` (Returns `null` if no active placement).

### 2.4 `GET /api/students/me/applications`
- **Description:** Lists internship applications submitted by caller.
- **Auth Required:** Yes (`STUDENT`)
- **Response Status:** `200 OK`

### 2.5 `GET /api/students/me/tasks`
- **Description:** Returns assigned milestone tasks and completion statuses.
- **Auth Required:** Yes (`STUDENT`)
- **Response Status:** `200 OK`

### 2.6 `POST /api/students/me/tasks/{task_id}/toggle`
- **Description:** Toggles milestone task completion status (`is_completed`) and updates `completed_at` timestamp. Enforces ownership: students cannot toggle other students' tasks.
- **Auth Required:** Yes (`STUDENT`)
- **Response Status:** `200 OK`
- **Error Responses:**
  - `404 Not Found`: Task does not exist.
  - `403 Forbidden`: Task belongs to a different student.

### 2.7 `GET /api/students/me/reports`
- **Description:** Lists submitted weekly progress reports with mentor evaluations.
- **Auth Required:** Yes (`STUDENT`)
- **Response Status:** `200 OK`

### 2.8 `POST /api/students/me/reports`
- **Description:** Submits a new weekly progress report. Prevents duplicate submissions for the same week.
- **Auth Required:** Yes (`STUDENT`)
- **Request Body:**
  ```json
  {
    "week_number": 1,
    "achievements": "Configured local environment and dockerized microservices.",
    "challenges": null,
    "hours_spent": 40.0
  }
  ```
- **Response Status:** `201 Created`
- **Error Responses:**
  - `409 Conflict`: Report for this week number already submitted.
  - `400 Bad Request`: Caller has no active internship.

### 2.9 `GET /api/students/me/attention`
- **Description:** Triggers live recalculation of the 4-Factor Attention Engine directly from database milestone records.
- **Auth Required:** Yes (`STUDENT`)
- **Response Status:** `200 OK`
- **Response Body:**
  ```json
  {
    "attention_score": 82.24,
    "attention_status": "ON_TRACK",
    "factors": {
      "progress_consistency": 80.0,
      "task_completion": 80.0,
      "report_submission": 80.0,
      "mentor_feedback": 91.2
    },
    "reasons": ["Progress is consistent."],
    "recommendations": ["Maintain regular progress updates."]
  }
  ```

---

## 3. Mentor Endpoints (`/api/mentors`)

### 3.1 `GET /api/mentors/me/interns`
- **Description:** Returns roster of assigned interns prioritized by early-warning attention score (`NEEDS_ATTENTION` first).
- **Auth Required:** Yes (`MENTOR`)
- **Response Status:** `200 OK`

### 3.2 `GET /api/mentors/reports/pending`
- **Description:** Lists submitted weekly reports from assigned interns awaiting evaluation.
- **Auth Required:** Yes (`MENTOR`)
- **Response Status:** `200 OK`

### 3.3 `POST /api/mentors/reports/{report_id}/review`
- **Description:** Submits numeric score ($0-100$) and qualitative guidance for a weekly report, transitioning status to `REVIEWED`.
- **Auth Required:** Yes (`MENTOR`)
- **Request Body:**
  ```json
  {
    "mentor_feedback": "Excellent progress and proactive communication.",
    "mentor_score": 92.0
  }
  ```
- **Response Status:** `200 OK`
- **Error Responses:**
  - `403 Forbidden`: Caller is not assigned to supervise this internship.
  - `404 Not Found`: Report does not exist.

---

## 4. Admin Endpoints (`/api/admin`)

### 4.1 `GET /api/admin/applications`
- **Description:** Lists all internship applications submitted university-wide.
- **Auth Required:** Yes (`ADMIN`)
- **Response Status:** `200 OK`

### 4.2 `POST /api/admin/applications/{app_id}/action`
- **Description:** Approves or rejects an application. Approving assigns student and mentor, sets status to `ACTIVE`, and automatically provisions initial milestone tasks.
- **Auth Required:** Yes (`ADMIN`)
- **Request Body:**
  ```json
  {
    "status": "APPROVED",
    "mentor_id": 1,
    "review_notes": "Accepted based on academic standing and skill match."
  }
  ```
- **Response Status:** `200 OK`

### 4.3 `GET /api/admin/mentors`
- **Description:** Lists available faculty mentors for supervisor allocation dropdowns.
- **Auth Required:** Yes (`ADMIN`)
- **Response Status:** `200 OK`

### 4.4 `GET /api/admin/analytics`
- **Description:** Computes university-wide metrics: total students, opportunities, active placements, pending applications, cohort attention distribution (`on_track`, `monitor`, `needs_attention`), and average health score.
- **Auth Required:** Yes (`ADMIN`)
- **Response Status:** `200 OK`

---

## 5. Internship Endpoints (`/api/internships`)

### 5.1 `GET /api/internships`
- **Description:** Lists approved opportunities with optional `status` and `search` query parameters.
- **Auth Required:** No

### 5.2 `GET /api/internships/{id}`
- **Description:** Fetches full internship details including company description and required competency skills.
- **Auth Required:** No

### 5.3 `POST /api/internships`
- **Description:** Publishes a new corporate internship posting with required competencies.
- **Auth Required:** Yes (`ADMIN`)
- **Response Status:** `201 Created`

### 5.4 `POST /api/internships/{id}/apply`
- **Description:** Submits application for caller. Prevents duplicate applications.
- **Auth Required:** Yes (`STUDENT`)
- **Response Status:** `200 OK`
- **Error Responses:**
  - `409 Conflict`: Already applied to this position.

---

## 6. Analytics & Intelligence Endpoints (`/api/analytics`)

### 6.1 `POST /api/analytics/skill-gap`
- **Description:** Mounts `intelligence.app.analyze_skill_gap`. Performs case-insensitive matching, deduplication, and returns match percentage and actionable advice.
- **Auth Required:** Yes (Any authenticated role)

### 6.2 `GET /api/analytics/progress-attention/{student_id}`
- **Description:** Evaluates live database progress attention for `student_id`.
- **Auth Required:** Yes
- **Ownership Rules:**
  - Students may only view their own `student_id`.
  - Mentors may only view assigned interns.
  - Admins may view any student.
  - Violations return `403 Forbidden`.
