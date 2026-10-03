import uuid
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert response.json()["intelligence_engine"] == "online"


def test_auth_login_student(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "student.alex@university.edu", "password": "Student@123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "STUDENT"
    assert "access_token" in data
    assert data["email"] == "student.alex@university.edu"


def test_auth_login_mentor(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "mentor.turing@university.edu", "password": "Mentor@123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "MENTOR"
    assert "access_token" in data


def test_auth_login_admin(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@university.edu", "password": "Admin@123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "ADMIN"
    assert "access_token" in data


def test_auth_invalid_credentials(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@university.edu", "password": "WrongPassword!"},
    )
    assert response.status_code == 401


def test_student_profile_and_active_internship(client):
    login = client.post(
        "/api/auth/login",
        json={"email": "student.alex@university.edu", "password": "Student@123"},
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Profile
    profile_res = client.get("/api/students/me", headers=headers)
    assert profile_res.status_code == 200
    assert profile_res.json()["roll_number"] == "CS-2023-042"
    assert "Python" in profile_res.json()["skills"]

    # Active Internship
    internship_res = client.get("/api/students/me/internship", headers=headers)
    assert internship_res.status_code == 200
    assert internship_res.json()["title"] == "Full Stack Cloud Software Engineer"
    assert internship_res.json()["company_name"] == "Google Cloud"


def test_student_tasks_and_toggle(client):
    login = client.post(
        "/api/auth/login",
        json={"email": "student.alex@university.edu", "password": "Student@123"},
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    tasks_res = client.get("/api/students/me/tasks", headers=headers)
    assert tasks_res.status_code == 200
    tasks = tasks_res.json()
    assert len(tasks) > 0

    first_task = tasks[0]
    task_id = first_task["id"]

    is_company = (first_task.get("source") == "Company Provided") or bool(first_task.get("external_mentor_id"))
    if is_company:
        # Direct toggle for Company Provided Tasks is strictly rejected (400 Bad Request)
        toggle_res = client.post(f"/api/students/me/tasks/{task_id}/toggle", headers=headers)
        assert toggle_res.status_code == 400
        assert "Direct completion is disabled for Company Provided Tasks" in toggle_res.json()["detail"]

        if not first_task["is_completed"]:
            # Valid timesheet submission completes the company task
            ts_res = client.post(
                "/api/students/me/timesheet/task",
                headers=headers,
                json={
                    "task_id": task_id,
                    "task_title": first_task["title"],
                    "task_link": "https://github.com/alex/cloud-pipeline-task",
                },
            )
            assert ts_res.status_code == 200
            assert ts_res.json()["is_completed"] is True
            assert ts_res.json()["status"] == "COMPLETED"
    else:
        initial_completed = first_task["is_completed"]
        toggle_res = client.post(f"/api/students/me/tasks/{task_id}/toggle", headers=headers)
        assert toggle_res.status_code == 200
        assert toggle_res.json()["is_completed"] != initial_completed
        client.post(f"/api/students/me/tasks/{task_id}/toggle", headers=headers)


def test_student_live_attention_calculation(client):
    login = client.post(
        "/api/auth/login",
        json={"email": "student.alex@university.edu", "password": "Student@123"},
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    attention_res = client.get("/api/students/me/attention", headers=headers)
    assert attention_res.status_code == 200
    data = attention_res.json()
    assert data["attention_status"] == "ON_TRACK"
    assert data["attention_score"] >= 75
    assert "factors" in data
    assert "progress_consistency" in data["factors"]
    assert len(data["reasons"]) > 0


def test_mentor_intern_triage(client):
    login = client.post(
        "/api/auth/login",
        json={"email": "mentor.turing@university.edu", "password": "Mentor@123"},
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    interns_res = client.get("/api/mentors/me/interns", headers=headers)
    assert interns_res.status_code == 200
    interns = interns_res.json()
    assert len(interns) >= 2  # Alex and David
    # Ensure sorted with NEEDS_ATTENTION prioritized first
    statuses = [i["attention_status"] for i in interns]
    if "NEEDS_ATTENTION" in statuses:
        assert statuses[0] == "NEEDS_ATTENTION"


def test_admin_institutional_analytics(client):
    login = client.post(
        "/api/auth/login",
        json={"email": "admin@university.edu", "password": "Admin@123"},
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    analytics_res = client.get("/api/admin/analytics", headers=headers)
    assert analytics_res.status_code == 200
    data = analytics_res.json()
    assert data["total_students"] >= 4
    assert data["active_internships"] >= 3
    assert data["on_track_count"] >= 1
    assert data["needs_attention_count"] >= 1


def test_skill_gap_analysis_endpoint(client):
    login = client.post(
        "/api/auth/login",
        json={"email": "student.maya@university.edu", "password": "Student@123"},
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post(
        "/api/analytics/skill-gap",
        json={
            "student_skills": ["Python", "SQL"],
            "required_skills": ["Python", "SQL", "Docker", "AWS"],
        },
        headers=headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["match_percentage"] == 50.0
    assert set(data["matched_skills"]) == {"Python", "SQL"}
    assert set(data["missing_skills"]) == {"Docker", "AWS"}
    assert "Consider improving Docker and AWS skills." in data["recommendation"]


def test_authorization_unauthenticated_request_rejected(client):
    """Endpoints requiring authentication must reject unauthenticated requests with 401."""
    res = client.get("/api/students/me")
    assert res.status_code == 401
    assert "Authentication token required" in res.json()["detail"]


def test_authorization_student_forbidden_from_admin_endpoints(client):
    """Students attempting to access Admin endpoints must receive 403 Forbidden."""
    login = client.post(
        "/api/auth/login",
        json={"email": "student.alex@university.edu", "password": "Student@123"},
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/admin/analytics", headers=headers)
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]


def test_authorization_student_forbidden_from_mentor_endpoints(client):
    """Students attempting to access Mentor endpoints must receive 403 Forbidden."""
    login = client.post(
        "/api/auth/login",
        json={"email": "student.alex@university.edu", "password": "Student@123"},
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/mentors/me/interns", headers=headers)
    assert res.status_code == 403


def test_authorization_mentor_forbidden_from_admin_endpoints(client):
    """Mentors attempting to access Admin endpoints must receive 403 Forbidden."""
    login = client.post(
        "/api/auth/login",
        json={"email": "mentor.turing@university.edu", "password": "Mentor@123"},
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/admin/analytics", headers=headers)
    assert res.status_code == 403


def test_resource_ownership_student_cannot_access_other_student_attention(client):
    """Student A (Alex) cannot access Student B's (David) attention metrics via ID manipulation."""
    login = client.post(
        "/api/auth/login",
        json={"email": "student.alex@university.edu", "password": "Student@123"},
    )
    token = login.json()["access_token"]
    alex_headers = {"Authorization": f"Bearer {token}"}

    # Find David's student ID
    admin_login = client.post(
        "/api/auth/login",
        json={"email": "admin@university.edu", "password": "Admin@123"},
    )
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    apps = client.get("/api/admin/applications", headers=admin_headers).json()

    # Query David directly via admin or login as David to get his student_id
    david_login = client.post(
        "/api/auth/login",
        json={"email": "student.david@university.edu", "password": "Student@123"},
    )
    david_token = david_login.json()["access_token"]
    david_prof = client.get("/api/students/me", headers={"Authorization": f"Bearer {david_token}"}).json()
    david_student_id = david_prof["id"]

    # Alex tries to query David's attention score
    res = client.get(f"/api/analytics/progress-attention/{david_student_id}", headers=alex_headers)
    assert res.status_code == 403
    assert "Forbidden" in res.json()["detail"]


def test_resource_ownership_student_cannot_toggle_other_student_task(client):
    """Student A cannot toggle Student B's milestone task."""
    # Login as David and get David's tasks
    david_login = client.post(
        "/api/auth/login",
        json={"email": "student.david@university.edu", "password": "Student@123"},
    )
    david_token = david_login.json()["access_token"]
    david_tasks = client.get("/api/students/me/tasks", headers={"Authorization": f"Bearer {david_token}"}).json()
    assert len(david_tasks) > 0
    david_task_id = david_tasks[0]["id"]

    # Login as Alex and try to toggle David's task
    alex_login = client.post(
        "/api/auth/login",
        json={"email": "student.alex@university.edu", "password": "Student@123"},
    )
    alex_token = alex_login.json()["access_token"]
    res = client.post(
        f"/api/students/me/tasks/{david_task_id}/toggle",
        headers={"Authorization": f"Bearer {alex_token}"},
    )
    assert res.status_code == 403
    assert "Forbidden" in res.json()["detail"]


def test_persona_david_miller_needs_attention(client):
    """Verify Student David Miller accurately calculates NEEDS_ATTENTION based on real low milestones."""
    login = client.post(
        "/api/auth/login",
        json={"email": "student.david@university.edu", "password": "Student@123"},
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    attention_res = client.get("/api/students/me/attention", headers=headers)
    assert attention_res.status_code == 200
    data = attention_res.json()
    assert data["attention_status"] == "NEEDS_ATTENTION"
    assert data["attention_score"] < 50
    # Must have explainable reasons reflecting low progress
    assert len(data["reasons"]) > 0
    assert any("Task completion" in r or "reports" in r or "feedback" in r or "Progress" in r for r in data["reasons"])


def test_persona_maya_applicant_flow(client):
    """Verify Maya Patel can explore open internships and view her pending application."""
    login = client.post(
        "/api/auth/login",
        json={"email": "student.maya@university.edu", "password": "Student@123"},
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Open internships exist
    internships = client.get("/api/internships?status=AVAILABLE", headers=headers).json()
    assert len(internships) >= 1

    # Maya has 1 pending application
    apps = client.get("/api/students/me/applications", headers=headers).json()
    assert len(apps) >= 1
    assert any(a["status"] == "PENDING" for a in apps)


def test_duplicate_operations_prevention(client):
    """Test prevention of duplicate email registration and duplicate applications."""
    # 1. Duplicate email registration
    dup_reg = client.post(
        "/api/auth/register",
        json={
            "email": "student.alex@university.edu",
            "password": "NewPassword123!",
            "full_name": "Duplicate Alex",
            "role": "STUDENT",
        },
    )
    assert dup_reg.status_code == 409
    assert "already exists" in dup_reg.json()["detail"]

    # 2. Duplicate application to same internship
    maya_login = client.post(
        "/api/auth/login",
        json={"email": "student.maya@university.edu", "password": "Student@123"},
    )
    maya_token = maya_login.json()["access_token"]
    maya_headers = {"Authorization": f"Bearer {maya_token}"}
    maya_apps = client.get("/api/students/me/applications", headers=maya_headers).json()
    applied_internship_id = maya_apps[0]["internship_id"]

    dup_app = client.post(f"/api/internships/{applied_internship_id}/apply", headers=maya_headers)
    assert dup_app.status_code == 409
    assert "already applied" in dup_app.json()["detail"]


def test_real_database_persistence_cycle(client):
    """Verify write -> database persistence -> re-query cycle for report submission and review."""
    # 1. Login as Alex and submit a new weekly report (e.g. week 5)
    alex_login = client.post(
        "/api/auth/login",
        json={"email": "student.alex@university.edu", "password": "Student@123"},
    )
    alex_token = alex_login.json()["access_token"]
    alex_headers = {"Authorization": f"Bearer {alex_token}"}

    existing_reports = client.get("/api/students/me/reports", headers=alex_headers).json()
    next_week = max([r["week_number"] for r in existing_reports]) + 1

    new_report_res = client.post(
        "/api/students/me/reports",
        json={
            "week_number": next_week,
            "achievements": "Containerized microservices and drafted Kubernetes manifests.",
            "challenges": "Configuring ingress controller DNS.",
            "hours_spent": 42.0,
        },
        headers=alex_headers,
    )
    assert new_report_res.status_code == 201
    report_id = new_report_res.json()["id"]

    # 2. Re-query reports to verify report persisted in database
    refreshed_reports = client.get("/api/students/me/reports", headers=alex_headers).json()
    persisted = next((r for r in refreshed_reports if r["id"] == report_id), None)
    assert persisted is not None
    assert persisted["status"] == "SUBMITTED"
    assert persisted["week_number"] == next_week

    # 3. Login as mentor Alan Turing and review the report
    turing_login = client.post(
        "/api/auth/login",
        json={"email": "mentor.turing@university.edu", "password": "Mentor@123"},
    )
    turing_token = turing_login.json()["access_token"]
    turing_headers = {"Authorization": f"Bearer {turing_token}"}

    review_res = client.post(
        f"/api/mentors/reports/{report_id}/review",
        json={
            "mentor_feedback": "Excellent work with containerization. Ready for staging deployment.",
            "mentor_score": 96.0,
        },
        headers=turing_headers,
    )
    assert review_res.status_code == 200
    assert review_res.json()["status"] == "REVIEWED"
    assert review_res.json()["mentor_score"] == 96.0

    # 4. Verify report review is persisted for student
    alex_reports_after = client.get("/api/students/me/reports", headers=alex_headers).json()
    reviewed_report = next((r for r in alex_reports_after if r["id"] == report_id), None)
    assert reviewed_report["status"] == "REVIEWED"
    assert reviewed_report["mentor_score"] == 96.0


def test_mentor_get_student_detail(client):
    """Test full student monitoring detail endpoint returning 7-section aggregated data."""
    turing_login = client.post(
        "/api/auth/login",
        json={"email": "mentor.turing@university.edu", "password": "Mentor@123"},
    )
    token = turing_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get student Alex Chen (student_id 2 or 1 in DB)
    interns = client.get("/api/mentors/me/interns", headers=headers).json()
    assert len(interns) > 0
    target_student_id = interns[0]["student_id"]

    detail_res = client.get(f"/api/mentors/students/{target_student_id}", headers=headers)
    assert detail_res.status_code == 200
    data = detail_res.json()

    # Verify Profile
    assert data["student_id"] == target_student_id
    assert "student_name" in data
    assert "department" in data
    assert "company_name" in data
    assert "internship_title" in data

    # Verify Progress & Attention
    assert "attention_score" in data
    assert "attention_status" in data
    assert "factors" in data
    assert "reasons" in data
    assert "recommendations" in data

    # Verify Tasks and Reports
    assert isinstance(data["tasks"], list)
    assert isinstance(data["reports"], list)

    # Verify Skill Gap
    assert "skill_gap" in data
    assert "match_percentage" in data["skill_gap"]
    assert "matched_skills" in data["skill_gap"]


def test_mentor_record_and_get_interventions(client):
    """Test recording faculty intervention and re-querying intervention history."""
    turing_login = client.post(
        "/api/auth/login",
        json={"email": "mentor.turing@university.edu", "password": "Mentor@123"},
    )
    token = turing_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    interns = client.get("/api/mentors/me/interns", headers=headers).json()
    assert len(interns) > 0
    target_student_id = interns[0]["student_id"]

    # Record intervention
    create_res = client.post(
        f"/api/mentors/students/{target_student_id}/interventions",
        json={
            "intervention_type": "1-on-1 Academic Check-in",
            "notes": "Met with student to review backend architecture and report submissions.",
            "action_taken": "Agreed on weekly Friday sync schedule.",
        },
        headers=headers,
    )
    assert create_res.status_code == 201
    intervention_data = create_res.json()
    assert intervention_data["student_id"] == target_student_id
    assert intervention_data["intervention_type"] == "1-on-1 Academic Check-in"

    # Get interventions list
    list_res = client.get(f"/api/mentors/students/{target_student_id}/interventions", headers=headers)
    assert list_res.status_code == 200
    interventions = list_res.json()
    assert len(interventions) >= 1
    assert any(i["notes"] == "Met with student to review backend architecture and report submissions." for i in interventions)


def test_single_admin_enforcement_and_rejection_of_admin_registration(client):
    """Enforce that Admin registration is rejected with HTTP 409 Conflict and exactly one admin exists."""
    # Attempting to register another admin must be rejected with 409 Conflict
    res = client.post(
        "/api/auth/register",
        json={
            "email": "second_admin@university.edu",
            "password": "Password123!",
            "full_name": "Rogue Admin",
            "role": "ADMIN",
        },
    )
    assert res.status_code == 409
    assert "Admin registration is forbidden" in res.json()["detail"]

    # Verify admin count
    admin_login = client.post(
        "/api/auth/login",
        json={"email": "admin@university.edu", "password": "Admin@123"},
    )
    assert admin_login.status_code == 200
    assert admin_login.json()["role"] == "ADMIN"


def test_student_apply_and_duplicate_handling(client):
    """Test student applying to an available internship and rejection of duplicate application."""
    # Register new student — or login if already registered from a previous run (idempotent)
    student_email = "applicant.student@university.edu"
    reg = client.post(
        "/api/auth/register",
        json={
            "email": student_email,
            "password": "Password123!",
            "full_name": "Applicant Student",
            "role": "STUDENT",
            "department": "Computer Science & Engineering",
            "academic_year": 3,
        },
    )
    if reg.status_code == 201:
        stu_token = reg.json()["access_token"]
    elif reg.status_code == 409:
        # User already exists from a previous test run — just log in
        login_res = client.post(
            "/api/auth/login",
            json={"email": student_email, "password": "Password123!"},
        )
        assert login_res.status_code == 200, f"Re-login failed: {login_res.text}"
        stu_token = login_res.json()["access_token"]
    else:
        raise AssertionError(f"Registration returned unexpected status {reg.status_code}: {reg.text}")
    stu_headers = {"Authorization": f"Bearer {stu_token}"}

    # Get available internships
    internships = client.get("/api/internships?status=AVAILABLE").json()
    assert len(internships) > 0
    target_internship = internships[0]

    # Apply — may already be applied from a prior run (idempotent test)
    apply_res = client.post(f"/api/internships/{target_internship['id']}/apply", headers=stu_headers)
    assert apply_res.status_code in (200, 409), f"Unexpected apply status: {apply_res.status_code} {apply_res.text}"
    if apply_res.status_code == 200:
        assert apply_res.json()["status"] == "PENDING"

    # Verify listed in my applications (whether new or pre-existing)
    my_apps = client.get("/api/students/me/applications", headers=stu_headers).json()
    assert len(my_apps) >= 1
    assert any(a["internship_id"] == target_internship["id"] for a in my_apps)

    # Duplicate application attempt (must always reject with 409)
    dup_res = client.post(f"/api/internships/{target_internship['id']}/apply", headers=stu_headers)
    assert dup_res.status_code == 409
    assert "already applied" in dup_res.json()["detail"]


def test_international_companies_present_and_idempotent(client):
    """Verify at least 5 international companies (Microsoft, Google, IBM, Amazon, Adobe) exist with AVAILABLE internships."""
    internships = client.get("/api/internships?status=AVAILABLE").json()
    company_names = {i["company_name"] for i in internships}
    required_international = {"Microsoft", "Google", "IBM", "Amazon", "Adobe"}
    assert required_international.issubset(company_names), (
        f"Missing international companies: {required_international - company_names}"
    )


def test_admin_mentor_list_and_student_mentor_assignment_workflow(client):
    """Verify Admin can view mentors, assign/change/unassign student mentors, RBAC blocks non-admins, and notifications are generated."""
    admin_login = client.post(
        "/api/auth/login",
        json={"email": "admin@university.edu", "password": "Admin@123"},
    ).json()
    admin_headers = {"Authorization": f"Bearer {admin_login['access_token']}"}

    student_login = client.post(
        "/api/auth/login",
        json={"email": "student.alex@university.edu", "password": "Student@123"},
    ).json()
    student_headers = {"Authorization": f"Bearer {student_login['access_token']}"}

    mentor_login = client.post(
        "/api/auth/login",
        json={"email": "mentor.turing@university.edu", "password": "Mentor@123"},
    ).json()
    mentor_headers = {"Authorization": f"Bearer {mentor_login['access_token']}"}

    lovelace_login = client.post(
        "/api/auth/login",
        json={"email": "mentor.lovelace@university.edu", "password": "Mentor@123"},
    ).json()
    lovelace_headers = {"Authorization": f"Bearer {lovelace_login['access_token']}"}

    # 1. Admin fetches mentors list with counts
    mentors_res = client.get("/api/admin/mentors", headers=admin_headers)
    assert mentors_res.status_code == 200
    mentors = mentors_res.json()
    assert len(mentors) >= 3
    turing_mentor = next(m for m in mentors if m["email"] == "mentor.turing@university.edu")
    lovelace_mentor = next(m for m in mentors if m["email"] == "mentor.lovelace@university.edu")
    assert "assigned_students_count" in turing_mentor
    assert "is_active" in turing_mentor

    # 2. Admin fetches students list
    students_res = client.get("/api/admin/students", headers=admin_headers)
    assert students_res.status_code == 200
    students = students_res.json()
    assert len(students) >= 3
    alex_student = next(s for s in students if s["email"] == "student.alex@university.edu")

    # 3. RBAC: Student and Mentor cannot assign mentors or list admin students
    stu_forbidden = client.put(
        f"/api/admin/students/{alex_student['id']}/mentor",
        headers=student_headers,
        json={"mentor_id": lovelace_mentor["id"]},
    )
    assert stu_forbidden.status_code == 403

    men_forbidden = client.put(
        f"/api/admin/students/{alex_student['id']}/mentor",
        headers=mentor_headers,
        json={"mentor_id": turing_mentor["id"]},
    )
    assert men_forbidden.status_code == 403

    # 4. Invalid mentor ID returns 404
    bad_mentor_res = client.put(
        f"/api/admin/students/{alex_student['id']}/mentor",
        headers=admin_headers,
        json={"mentor_id": 999999},
    )
    assert bad_mentor_res.status_code == 404

    # 5. Admin reassigns Alex Chen to Prof. Ada Lovelace
    assign_lovelace = client.put(
        f"/api/admin/students/{alex_student['id']}/mentor",
        headers=admin_headers,
        json={"mentor_id": lovelace_mentor["id"]},
    )
    assert assign_lovelace.status_code == 200
    assert assign_lovelace.json()["mentor_id"] == lovelace_mentor["id"]
    assert assign_lovelace.json()["mentor_name"] == "Prof. Ada Lovelace"

    # Verify Student /me immediately reflects Prof. Ada Lovelace
    alex_me = client.get("/api/students/me", headers=student_headers).json()
    assert alex_me["mentor_name"] == "Prof. Ada Lovelace"

    # Verify Prof. Ada Lovelace now sees Alex Chen in her assigned interns
    lovelace_interns = client.get("/api/mentors/me/interns", headers=lovelace_headers).json()
    assert any(i["student_id"] == alex_student["id"] for i in lovelace_interns)

    # 6. Admin assigns Alex Chen back to Dr. Alan Turing (preserving default state)
    assign_turing = client.put(
        f"/api/admin/students/{alex_student['id']}/mentor",
        headers=admin_headers,
        json={"mentor_id": turing_mentor["id"]},
    )
    assert assign_turing.status_code == 200
    assert assign_turing.json()["mentor_name"] == "Dr. Alan Turing"

    # 7. Verify notifications were generated for Student and Mentor
    stu_notifs = client.get("/api/notifications", headers=student_headers).json()
    assert any("has been assigned as your mentor" in n["message"] for n in stu_notifs)
    assert any(n["notification_type"] == "PENDING_WORK" for n in stu_notifs)
    assert any(n["notification_type"] == "REMINDER" for n in stu_notifs)

    men_notifs = client.get("/api/notifications", headers=mentor_headers).json()
    assert any("Admin assigned Alex Chen to you." in n["message"] for n in men_notifs)

    # Test marking a notification as read
    unread_notif = stu_notifs[0]
    read_res = client.post(f"/api/notifications/{unread_notif['id']}/read", headers=student_headers)
    assert read_res.status_code == 200
    assert read_res.json()["is_read"] is True


def test_student_mentor_communication_and_authorization(client):
    """Verify assigned Student and Mentor can exchange DB-persisted messages, and unauthorized access is blocked."""
    student_login = client.post(
        "/api/auth/login",
        json={"email": "student.alex@university.edu", "password": "Student@123"},
    ).json()
    student_headers = {"Authorization": f"Bearer {student_login['access_token']}"}

    turing_login = client.post(
        "/api/auth/login",
        json={"email": "mentor.turing@university.edu", "password": "Mentor@123"},
    ).json()
    turing_headers = {"Authorization": f"Bearer {turing_login['access_token']}"}

    lovelace_login = client.post(
        "/api/auth/login",
        json={"email": "mentor.lovelace@university.edu", "password": "Mentor@123"},
    ).json()
    lovelace_headers = {"Authorization": f"Bearer {lovelace_login['access_token']}"}

    alex_profile = client.get("/api/students/me", headers=student_headers).json()
    alex_id = alex_profile["id"]

    # 1. Student sends a message to their assigned mentor (Dr. Alan Turing)
    stu_msg_res = client.post(
        "/api/messages",
        headers=student_headers,
        json={"content": "Hello Dr. Turing, I have pushed the Week 4 vector database benchmark results."},
    )
    assert stu_msg_res.status_code == 201
    stu_msg = stu_msg_res.json()
    assert stu_msg["sender_role"] == "STUDENT"
    assert "vector database benchmark" in stu_msg["content"]

    # 2. Assigned Mentor (Dr. Alan Turing) reads messages and replies
    turing_msgs = client.get(f"/api/messages?student_id={alex_id}", headers=turing_headers)
    assert turing_msgs.status_code == 200
    assert any("vector database benchmark" in m["content"] for m in turing_msgs.json())

    mentor_reply_res = client.post(
        "/api/messages",
        headers=turing_headers,
        json={
            "student_id": alex_id,
            "content": "Excellent work Alex! I will review the benchmark metrics this afternoon.",
        },
    )
    assert mentor_reply_res.status_code == 201
    assert mentor_reply_res.json()["sender_role"] == "MENTOR"

    # 3. Student sees Mentor's reply in conversation history
    updated_thread = client.get("/api/messages", headers=student_headers).json()
    assert any("Excellent work Alex!" in m["content"] for m in updated_thread)

    # 4. Unauthorized Mentor (Prof. Ada Lovelace) cannot view or send messages to Alex Chen
    unauth_get = client.get(f"/api/messages?student_id={alex_id}", headers=lovelace_headers)
    assert unauth_get.status_code == 403

    unauth_post = client.post(
        "/api/messages",
        headers=lovelace_headers,
        json={"student_id": alex_id, "content": "Unauthorized mentor message"},
    )
    assert unauth_post.status_code == 403


def test_admin_company_management_and_rbac(client):
    """Verify Admin can manage companies (including Microsoft, Google, IBM, Amazon, Adobe) and non-admins are blocked."""
    admin_login = client.post(
        "/api/auth/login",
        json={"email": "admin@university.edu", "password": "Admin@123"},
    ).json()
    admin_headers = {"Authorization": f"Bearer {admin_login['access_token']}"}

    student_login = client.post(
        "/api/auth/login",
        json={"email": "student.alex@university.edu", "password": "Student@123"},
    ).json()
    student_headers = {"Authorization": f"Bearer {student_login['access_token']}"}

    mentor_login = client.post(
        "/api/auth/login",
        json={"email": "mentor.turing@university.edu", "password": "Mentor@123"},
    ).json()
    mentor_headers = {"Authorization": f"Bearer {mentor_login['access_token']}"}

    # 1. Verify international companies are present in DB
    comps_res = client.get("/api/admin/companies", headers=admin_headers)
    assert comps_res.status_code == 200
    comp_names = {c["name"] for c in comps_res.json()}
    for required_comp in ["Microsoft", "Google", "IBM", "Amazon", "Adobe"]:
        assert required_comp in comp_names

    # 2. RBAC: Student and Mentor cannot create or modify companies
    assert (
        client.post(
            "/api/admin/companies",
            headers=student_headers,
            json={"name": "Unauthorized Corp"},
        ).status_code
        == 403
    )
    assert (
        client.post(
            "/api/companies",
            headers=mentor_headers,
            json={"name": "Unauthorized Corp"},
        ).status_code
        == 403
    )

    # 3. Admin creates, edits, and toggles a company
    unique_name = f"Oracle Cloud Labs {uuid.uuid4().hex[:6]}"
    create_res = client.post(
        "/api/admin/companies",
        headers=admin_headers,
        json={
            "name": unique_name,
            "industry": "Enterprise Cloud & Databases",
            "location": "Austin, TX (Hybrid)",
            "website": "https://www.oracle.com",
            "is_active": True,
        },
    )
    assert create_res.status_code == 201
    created_comp = create_res.json()
    assert created_comp["name"] == unique_name
    assert created_comp["is_active"] is True

    # Edit & deactivate company
    update_res = client.put(
        f"/api/admin/companies/{created_comp['id']}",
        headers=admin_headers,
        json={"location": "Redwood Shores, CA", "is_active": False},
    )
    assert update_res.status_code == 200
    assert update_res.json()["location"] == "Redwood Shores, CA"
    assert update_res.json()["is_active"] is False

    # Re-activate company
    reactivate_res = client.patch(
        f"/api/companies/{created_comp['id']}",
        headers=admin_headers,
        json={"is_active": True},
    )
    assert reactivate_res.status_code == 200
    assert reactivate_res.json()["is_active"] is True


def test_admin_internship_publishing_and_notifications(client):
    """Verify Admin internship creation, editing, publishing, unpublishing, RBAC, and automatic Student & Mentor notifications."""
    admin_login = client.post(
        "/api/auth/login",
        json={"email": "admin@university.edu", "password": "Admin@123"},
    ).json()
    admin_headers = {"Authorization": f"Bearer {admin_login['access_token']}"}

    student_login = client.post(
        "/api/auth/login",
        json={"email": "student.alex@university.edu", "password": "Student@123"},
    ).json()
    student_headers = {"Authorization": f"Bearer {student_login['access_token']}"}

    mentor_login = client.post(
        "/api/auth/login",
        json={"email": "mentor.turing@university.edu", "password": "Mentor@123"},
    ).json()
    mentor_headers = {"Authorization": f"Bearer {mentor_login['access_token']}"}

    # 1. RBAC: Student and Mentor cannot create or publish internships
    assert (
        client.post(
            "/api/internships",
            headers=student_headers,
            json={"title": "Fake Role", "company_name": "Microsoft", "description": "Test"},
        ).status_code
        == 403
    )
    assert (
        client.post(
            "/api/internships",
            headers=mentor_headers,
            json={"title": "Fake Role", "company_name": "Microsoft", "description": "Test"},
        ).status_code
        == 403
    )

    # 2. Admin creates a DRAFT internship first
    role_title = f"Software Engineering Intern {uuid.uuid4().hex[:4]}"
    draft_res = client.post(
        "/api/admin/internships",
        headers=admin_headers,
        json={
            "title": role_title,
            "company_name": "Microsoft",
            "industry": "Cloud & AI",
            "description": "Build scalable distributed cloud microservices on Azure.",
            "location": "Redmond, WA / Remote",
            "is_remote": True,
            "stipend": 4200,
            "duration_weeks": 12,
            "required_skills": ["Python", "Azure", "Docker", "Kubernetes"],
            "publish": False,
            "status": "DRAFT",
        },
    )
    assert draft_res.status_code == 201
    intern_id = draft_res.json()["id"]
    assert draft_res.json()["status"] == "DRAFT"

    # RBAC: Non-admin cannot publish
    assert client.post(f"/api/internships/{intern_id}/publish", headers=student_headers).status_code == 403
    assert client.post(f"/api/internships/{intern_id}/publish", headers=mentor_headers).status_code == 403

    # 3. Admin publishes the internship
    pub_res = client.post(f"/api/internships/{intern_id}/publish", headers=admin_headers)
    assert pub_res.status_code == 200
    assert pub_res.json()["status"] == "AVAILABLE"

    # 4. Verify Student receives "New Internship Published" notification
    stu_notifs = client.get("/api/notifications", headers=student_headers).json()
    assert any(
        n["title"] == "New Internship Published"
        and f"Microsoft has published a {role_title} opportunity." in n["message"]
        for n in stu_notifs
    )

    # 5. Verify Mentor receives "New Internship Opportunity" notification
    men_notifs = client.get("/api/notifications", headers=mentor_headers).json()
    assert any(
        n["title"] == "New Internship Opportunity"
        and f"Microsoft — {role_title} has been published." in n["message"]
        for n in men_notifs
    )

    # 6. Verify published internship appears in Student available internships feed
    avail_list = client.get("/api/internships?status=AVAILABLE", headers=student_headers).json()
    assert any(i["id"] == intern_id for i in avail_list)


def test_real_pdf_export_endpoint(client):
    """Verify /api/reports/export-pdf returns a valid binary %PDF-1.4 document for Student, Mentor, and Admin."""
    for email, pwd, expected_filename in [
        ("student.alex@university.edu", "Student@123", "Student_Progress_Report.pdf"),
        ("mentor.turing@university.edu", "Mentor@123", "Mentor_Weekly_Report.pdf"),
        ("admin@university.edu", "Admin@123", "Internship_Report.pdf"),
    ]:
        login_res = client.post("/api/auth/login", json={"email": email, "password": pwd}).json()
        headers = {"Authorization": f"Bearer {login_res['access_token']}"}
        pdf_res = client.get("/api/reports/export-pdf", headers=headers)
        assert pdf_res.status_code == 200
        assert pdf_res.headers["content-type"] == "application/pdf"
        assert expected_filename in pdf_res.headers.get("content-disposition", "")
        assert pdf_res.content.startswith(b"%PDF-1.4")
        assert b"%%EOF" in pdf_res.content
        assert len(pdf_res.content) > 400


def test_admin_sidebar_data_endpoints_and_publish_apply_flow(client):
    """
    Verify:
    - GET /api/admin/reports and GET /api/admin/interventions return real database records for Admin
      and return 403 for Student/Mentor.
    - Admin creates & publishes an internship -> Student sees it in AVAILABLE feed -> Student applies ->
      Duplicate application returns 409 -> Student sees PENDING status -> Admin sees application in queue.
    """
    admin_login = client.post(
        "/api/auth/login",
        json={"email": "admin@university.edu", "password": "Admin@123"},
    ).json()
    admin_headers = {"Authorization": f"Bearer {admin_login['access_token']}"}

    student_login = client.post(
        "/api/auth/login",
        json={"email": "student.alex@university.edu", "password": "Student@123"},
    ).json()
    student_headers = {"Authorization": f"Bearer {student_login['access_token']}"}

    mentor_login = client.post(
        "/api/auth/login",
        json={"email": "mentor.turing@university.edu", "password": "Mentor@123"},
    ).json()
    mentor_headers = {"Authorization": f"Bearer {mentor_login['access_token']}"}

    # 1. RBAC & data check for /api/admin/reports and /api/admin/interventions
    assert client.get("/api/admin/reports", headers=student_headers).status_code == 403
    assert client.get("/api/admin/reports", headers=mentor_headers).status_code == 403
    assert client.get("/api/admin/interventions", headers=student_headers).status_code == 403
    assert client.get("/api/admin/interventions", headers=mentor_headers).status_code == 403

    reports_res = client.get("/api/admin/reports", headers=admin_headers)
    assert reports_res.status_code == 200
    assert isinstance(reports_res.json(), list)
    assert len(reports_res.json()) > 0

    intervs_res = client.get("/api/admin/interventions", headers=admin_headers)
    assert intervs_res.status_code == 200
    assert isinstance(intervs_res.json(), list)

    # 2. Admin publishes a new internship
    role_title = f"AI Systems Intern {uuid.uuid4().hex[:6]}"
    create_res = client.post(
        "/api/admin/internships",
        headers=admin_headers,
        json={
            "title": role_title,
            "company_name": "Google",
            "industry": "Search, Cloud & AI",
            "description": "Design and evaluate distributed AI inference pipelines.",
            "location": "Mountain View, CA / Remote",
            "is_remote": True,
            "stipend": 4500,
            "duration_weeks": 12,
            "required_skills": ["Python", "PyTorch", "Kubernetes"],
            "publish": True,
            "status": "AVAILABLE",
        },
    )
    assert create_res.status_code == 201
    new_intern_id = create_res.json()["id"]
    assert create_res.json()["status"] == "AVAILABLE"

    # 3. Student sees the published internship in GET /api/internships?status=AVAILABLE
    avail_res = client.get("/api/internships?status=AVAILABLE", headers=student_headers)
    assert avail_res.status_code == 200
    assert any(i["id"] == new_intern_id and i["title"] == role_title for i in avail_res.json())

    # 4. Student applies for the published internship
    apply_res = client.post(f"/api/internships/{new_intern_id}/apply", headers=student_headers)
    assert apply_res.status_code in (200, 201)
    assert apply_res.json()["internship_id"] == new_intern_id
    assert apply_res.json()["status"] == "PENDING"

    # 5. Duplicate application is prevented with 409 Conflict
    dup_res = client.post(f"/api/internships/{new_intern_id}/apply", headers=student_headers)
    assert dup_res.status_code == 409

    # 6. Student sees the application in /api/students/me/applications
    stu_apps = client.get("/api/students/me/applications", headers=student_headers)
    assert stu_apps.status_code == 200
    assert any(a["internship_id"] == new_intern_id and a["status"] == "PENDING" for a in stu_apps.json())

    # 7. Admin sees the application in /api/admin/applications
    adm_apps = client.get("/api/admin/applications", headers=admin_headers)
    assert adm_apps.status_code == 200
    assert any(a["internship_id"] == new_intern_id and a["status"] == "PENDING" for a in adm_apps.json())


def test_mentor_accounts_unique_ids_and_new_mentor_registration(client):
    """
    Verify:
    1. Demo mentor accounts mentor@demo.com and mentor.turing@university.edu both log in and have permanent MNT-XXX IDs.
    2. Admin GET /api/admin/mentors returns all registered mentors with unique MNT-XXX IDs (no duplicates).
    3. Registering a new MENTOR automatically generates the next unique MNT-XXX ID, persists it across logout/login,
       allows the mentor to access their portal (/api/mentors/me and /api/mentors/me/interns), and automatically
       displays the new mentor in Admin -> GET /api/admin/mentors.
    4. Mentors cannot view /api/admin/mentors or assign students to themselves.
    """
    import re

    # A. Login: mentor@demo.com / Mentor@123
    demo_login_1 = client.post(
        "/api/auth/login",
        json={"email": "mentor@demo.com", "password": "Mentor@123"},
    )
    assert demo_login_1.status_code == 200
    demo_data_1 = demo_login_1.json()
    assert demo_data_1["role"] == "MENTOR"
    assert demo_data_1.get("mentor_id") and re.match(r"^MNT-\d{3,}$", demo_data_1["mentor_id"])
    demo_headers = {"Authorization": f"Bearer {demo_data_1['access_token']}"}

    demo_me = client.get("/api/mentors/me", headers=demo_headers)
    assert demo_me.status_code == 200
    assert demo_me.json()["mentor_id"] == demo_data_1["mentor_id"]

    # Re-login to confirm Mentor ID remains identical
    demo_login_2 = client.post(
        "/api/auth/login",
        json={"email": "mentor@demo.com", "password": "Mentor@123"},
    )
    assert demo_login_2.status_code == 200
    assert demo_login_2.json()["mentor_id"] == demo_data_1["mentor_id"]

    # B. Login: mentor.turing@university.edu / Mentor@123
    turing_login = client.post(
        "/api/auth/login",
        json={"email": "mentor.turing@university.edu", "password": "Mentor@123"},
    )
    assert turing_login.status_code == 200
    turing_data = turing_login.json()
    assert turing_data["role"] == "MENTOR"
    assert turing_data.get("mentor_id") and re.match(r"^MNT-\d{3,}$", turing_data["mentor_id"])
    assert turing_data["mentor_id"] != demo_data_1["mentor_id"]

    # C. Admin login: admin@university.edu / Admin@123
    admin_login = client.post(
        "/api/auth/login",
        json={"email": "admin@university.edu", "password": "Admin@123"},
    )
    assert admin_login.status_code == 200
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    mentors_before_res = client.get("/api/admin/mentors", headers=admin_headers)
    assert mentors_before_res.status_code == 200
    mentors_before = mentors_before_res.json()
    emails_before = {m["email"] for m in mentors_before}
    assert "mentor@demo.com" in emails_before
    assert "mentor.turing@university.edu" in emails_before

    ids_before = [m["mentor_id"] for m in mentors_before]
    assert len(ids_before) == len(set(ids_before)), "Duplicate Mentor IDs found!"
    for mid in ids_before:
        assert re.match(r"^MNT-\d{3,}$", mid), f"Invalid Mentor ID format: {mid}"

    # D. Register a NEW mentor
    new_mentor_email = f"prof.dijkstra.{uuid.uuid4().hex[:6]}@university.edu"
    reg_res = client.post(
        "/api/auth/register",
        json={
            "email": new_mentor_email,
            "password": "MentorPassword123!",
            "full_name": "Prof. Edsger Dijkstra",
            "role": "MENTOR",
            "department": "Computer Science & Algorithms",
            "designation": "Full Professor",
        },
    )
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    new_mnt_id = reg_data.get("mentor_id") or reg_data.get("employee_id")
    assert new_mnt_id and re.match(r"^MNT-\d{3,}$", new_mnt_id)
    assert new_mnt_id not in ids_before

    # E. Verify new mentor can log in, keeps the same Mentor ID, sees their portal, and appears in Admin list
    relogin_res = client.post(
        "/api/auth/login",
        json={"email": new_mentor_email, "password": "MentorPassword123!"},
    )
    assert relogin_res.status_code == 200
    assert relogin_res.json()["mentor_id"] == new_mnt_id
    new_mentor_headers = {"Authorization": f"Bearer {relogin_res.json()['access_token']}"}

    prof_res = client.get("/api/mentors/me", headers=new_mentor_headers)
    assert prof_res.status_code == 200
    assert prof_res.json()["mentor_id"] == new_mnt_id
    assert prof_res.json()["full_name"] == "Prof. Edsger Dijkstra"
    assert prof_res.json()["department"] == "Computer Science & Algorithms"
    assert prof_res.json()["designation"] == "Full Professor"

    interns_res = client.get("/api/mentors/me/interns", headers=new_mentor_headers)
    assert interns_res.status_code == 200
    assert isinstance(interns_res.json(), list)

    # Verify Mentor cannot access Admin mentor list or self-assign students
    assert client.get("/api/admin/mentors", headers=new_mentor_headers).status_code == 403
    assert client.put("/api/admin/students/1/mentor", headers=new_mentor_headers, json={"mentor_id": prof_res.json()["id"]}).status_code == 403

    # Verify Admin automatically sees the newly registered mentor with all required fields
    mentors_after_res = client.get("/api/admin/mentors", headers=admin_headers)
    assert mentors_after_res.status_code == 200
    mentors_after = mentors_after_res.json()
    new_entry = next((m for m in mentors_after if m["email"] == new_mentor_email), None)
    assert new_entry is not None
    assert new_entry["mentor_id"] == new_mnt_id
    assert new_entry["employee_id"] == new_mnt_id
    assert new_entry["full_name"] == "Prof. Edsger Dijkstra"
    assert new_entry["department"] == "Computer Science & Algorithms"
    assert new_entry["designation"] == "Full Professor"
    assert new_entry["assigned_students_count"] == 0
    assert new_entry["status"] == "ACTIVE"

    all_ids_after = [m["mentor_id"] for m in mentors_after]
    assert len(all_ids_after) == len(set(all_ids_after)), "Duplicate Mentor IDs found after registration!"


def test_complete_internship_application_skill_match_gap_and_task_workflow(client):
    """Verify full student application form, skill match %, skill gap, auto task generation, mentor task assignment, and notifications."""
    import uuid

    # 1. Register a fresh student
    stu_email = f"skillmatch.student.{uuid.uuid4().hex[:6]}@university.edu"
    stu_reg = client.post(
        "/api/auth/register",
        json={
            "email": stu_email,
            "password": "StudentPassword123!",
            "full_name": "Kiran Deshmukh",
            "role": "STUDENT",
            "department": "Computer Science & Engineering",
            "academic_year": 3,
            "skills": ["Python", "SQL"],
        },
    )
    assert stu_reg.status_code == 201
    stu_headers = {"Authorization": f"Bearer {stu_reg.json()['access_token']}"}
    student_id = client.get("/api/students/me", headers=stu_headers).json()["id"]

    # 2. Admin & Mentor headers
    admin_login = client.post(
        "/api/auth/login",
        json={"email": "admin@university.edu", "password": "Admin@123"},
    ).json()
    admin_headers = {"Authorization": f"Bearer {admin_login['access_token']}"}

    mentor_login = client.post(
        "/api/auth/login",
        json={"email": "mentor@demo.com", "password": "Mentor@123"},
    ).json()
    mentor_headers = {"Authorization": f"Bearer {mentor_login['access_token']}"}
    mentor_profile = client.get("/api/mentors/me", headers=mentor_headers).json()
    mentor_id = mentor_profile["id"]

    # 3. Admin creates & publishes an internship with 4 required skills: Python, SQL, Docker, Power BI
    companies = client.get("/api/admin/companies", headers=admin_headers).json()
    target_company_id = companies[0]["id"]
    create_intern_res = client.post(
        "/api/admin/internships",
        headers=admin_headers,
        json={
            "company_id": target_company_id,
            "title": "Data Analytics & Engineering Intern",
            "description": "Build analytical data pipelines and BI dashboards.",
            "location": "Bangalore (Hybrid)",
            "is_remote": True,
            "stipend": 1800,
            "duration_weeks": 10,
            "status": "AVAILABLE",
            "required_skills": ["Python", "SQL", "Docker", "Power BI"],
        },
    )
    assert create_intern_res.status_code == 201
    internship_id = create_intern_res.json()["id"]

    # 4. Student submits full Internship Application Form with Python & SQL (2 of 4 required skills => 50% match)
    app_payload = {
        "full_name": "Kiran Deshmukh",
        "email": stu_email,
        "phone": "+91-9811122233",
        "college": "COEP Technological University",
        "degree": "B.Tech",
        "department": "Computer Science & Engineering",
        "current_year": 3,
        "graduation_year": 2027,
        "technical_skills": ["Python", "SQL"],
        "programming_languages": ["Python", "SQL"],
        "frameworks": ["FastAPI"],
        "tools": ["Git"],
        "soft_skills": ["Problem Solving", "Communication"],
        "skills": ["Python", "SQL", "FastAPI", "Git"],
        "cgpa": "9.1",
        "relevant_coursework": "DBMS, Data Warehousing, Algorithms",
        "previous_internship_experience": "Summer Research Intern at College Lab",
        "project_title": "Automated ETL Pipeline",
        "project_description": "Built SQL and Python data transformation scripts.",
        "project_technologies": "Python, SQL",
        "github_url": "https://github.com/kirandeshmukh",
        "linkedin_url": "https://linkedin.com/in/kirandeshmukh",
    }
    apply_res = client.post(
        f"/api/internships/{internship_id}/apply",
        headers=stu_headers,
        json=app_payload,
    )
    assert apply_res.status_code == 200, apply_res.text
    app_data = apply_res.json()

    # Verify Skill Match % and Skill Gap
    assert app_data["skill_match_percentage"] == 50.0
    assert set(app_data["matched_skills"]) == {"Python", "SQL"}
    assert set(app_data["missing_skills"]) == {"Docker", "Power BI"}
    assert "Docker" in app_data["skill_recommendation"]
    assert app_data["application_data"]["cgpa"] == "9.1"
    assert app_data["application_data"]["college"] == "COEP Technological University"

    # Verify Internship-Specific Tasks were automatically generated
    assert app_data["tasks_total"] >= 3
    assert len(app_data["tasks"]) >= 3
    assert any("Data Analytics & Engineering Intern" in t["title"] for t in app_data["tasks"])

    # 5. Admin views application and approves it with mentor assignment
    admin_apps = client.get("/api/admin/applications", headers=admin_headers).json()
    admin_app_entry = next((a for a in admin_apps if a["id"] == app_data["id"]), None)
    assert admin_app_entry is not None
    assert admin_app_entry["skill_match_percentage"] == 50.0

    approve_res = client.patch(
        f"/api/admin/applications/{app_data['id']}",
        headers=admin_headers,
        json={
            "status": "APPROVED",
            "mentor_id": mentor_id,
            "review_notes": "Strong Python/SQL foundation. Assigned to mentor.",
        },
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "APPROVED"
    assert approve_res.json()["mentor_id"] == mentor_id

    # 6. Mentor views student applications and assigns a custom internship-specific task
    mentor_stu_apps = client.get(
        f"/api/mentors/students/{student_id}/applications",
        headers=mentor_headers,
    )
    assert mentor_stu_apps.status_code == 200
    assert len(mentor_stu_apps.json()) >= 1
    assert mentor_stu_apps.json()[0]["skill_match_percentage"] == 50.0

    assign_task_res = client.post(
        f"/api/mentors/students/{student_id}/tasks",
        headers=mentor_headers,
        json={
            "title": "Build Power BI Executive KPI Dashboard",
            "description": "Connect SQL dataset to Power BI and publish interactive visualizations.",
            "priority": "HIGH",
            "internship_id": internship_id,
            "application_id": app_data["id"],
        },
    )
    assert assign_task_res.status_code == 201, assign_task_res.text
    assigned_task = assign_task_res.json()
    assert assigned_task["title"] == "Build Power BI Executive KPI Dashboard"
    assert assigned_task["priority"] == "HIGH"

    # 7. Student sees the newly assigned task and completes it
    stu_tasks = client.get("/api/students/me/tasks", headers=stu_headers).json()
    assert any(t["id"] == assigned_task["id"] for t in stu_tasks)

    toggle_res = client.patch(
        f"/api/students/me/tasks/{assigned_task['id']}/toggle",
        headers=stu_headers,
    )
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_completed"] is True
    assert toggle_res.json()["status"] == "COMPLETED"


def test_attention_queue_cases_a_b_c_d_no_false_positive_needs_attention(client):
    """
    Verify Part 9 Cases A, B, C, D:
    - Case A: Newly assigned student with 0 overdue tasks and 0 missed reports is ON_TRACK (95%), NOT Needs Attention (30%).
    - Case B: Active student completing tasks and weekly reports on time is ON_TRACK.
    - Case C & D: Student with overdue tasks or missing weekly reports is accurately flagged in Attention Queue.
    """
    import uuid

    admin_login = client.post(
        "/api/auth/login",
        json={"email": "admin@university.edu", "password": "Admin@123"},
    ).json()
    admin_headers = {"Authorization": f"Bearer {admin_login['access_token']}"}

    mentor_login = client.post(
        "/api/auth/login",
        json={"email": "mentor.turing@university.edu", "password": "Mentor@123"},
    ).json()
    mentor_headers = {"Authorization": f"Bearer {mentor_login['access_token']}"}
    turing_id = client.get("/api/mentors/me", headers=mentor_headers).json()["id"]

    # Case A: Register a brand-new student, assign mentor, and check attention status immediately
    new_stu_email = f"casea.student.{uuid.uuid4().hex[:6]}@university.edu"
    reg = client.post(
        "/api/auth/register",
        json={
            "email": new_stu_email,
            "password": "StudentPassword123!",
            "full_name": "CaseA Fresh Student",
            "role": "STUDENT",
            "department": "Information Technology",
            "academic_year": 3,
        },
    ).json()
    new_stu_headers = {"Authorization": f"Bearer {reg['access_token']}"}
    new_stu_id = client.get("/api/students/me", headers=new_stu_headers).json()["id"]

    # Assign to Prof. Alan Turing
    assign_res = client.put(
        f"/api/admin/students/{new_stu_id}/mentor",
        headers=admin_headers,
        json={"mentor_id": turing_id},
    )
    assert assign_res.status_code == 200

    # Check Student's own attention endpoint
    stu_att = client.get("/api/students/me/attention", headers=new_stu_headers).json()
    assert stu_att["attention_status"] == "ON_TRACK", f"Expected ON_TRACK for new student, got {stu_att}"
    assert stu_att["attention_score"] >= 85.0

    # Check Mentor's intern list for CaseA student and Rukmini Raut (if assigned)
    interns = client.get("/api/mentors/me/interns", headers=mentor_headers).json()
    case_a_intern = next((i for i in interns if i["student_id"] == new_stu_id), None)
    assert case_a_intern is not None
    assert case_a_intern["attention_status"] == "ON_TRACK"
    assert case_a_intern["attention_score"] >= 85.0

    for intern in interns:
        if intern["student_name"] == "Rukmini Raut":
            assert intern["attention_status"] == "ON_TRACK", f"Rukmini Raut should be ON_TRACK, got {intern}"
            assert intern["attention_score"] >= 85.0

    # Case B: Active student completing tasks & reports (Alex Chen / Rohan Patil)
    alex_intern = next((i for i in interns if "Alex Chen" in i["student_name"]), None)
    if alex_intern:
        assert alex_intern["attention_status"] == "ON_TRACK"
        assert alex_intern["attention_score"] >= 75.0

    # Case C & D: Students with genuine overdue tasks or missed weekly reports (Aditya Joshi / Sneha Kulkarni / Priya Deshmukh)
    aditya_intern = next((i for i in interns if "Aditya Joshi" in i["student_name"]), None)
    if aditya_intern:
        assert aditya_intern["attention_status"] in ("NEEDS_ATTENTION", "MONITOR")
        assert aditya_intern["attention_score"] < 75.0
        assert len(aditya_intern["reasons"]) > 0

    # Check Admin Attention Queue: newly assigned CaseA student and Rukmini Raut must NOT be in the attention queue
    att_queue = client.get("/api/admin/attention-queue", headers=admin_headers).json()
    flagged_names = {item["student_name"] for item in att_queue}
    assert "CaseA Fresh Student" not in flagged_names
    assert "Rukmini Raut" not in flagged_names


def test_feature_1_domain_based_internship_search_and_filter(client):
    """Verify Feature 1: Domain-Based Internship Search & Filter across Admin and Student APIs."""
    import uuid

    admin_login = client.post(
        "/api/auth/login",
        json={"email": "admin@university.edu", "password": "Admin@123"},
    ).json()
    admin_headers = {"Authorization": f"Bearer {admin_login['access_token']}"}

    stu_login = client.post(
        "/api/auth/login",
        json={"email": "student.alex@university.edu", "password": "Student@123"},
    ).json()
    stu_headers = {"Authorization": f"Bearer {stu_login['access_token']}"}

    # 1. Verify /api/internships/domains returns standard & DB domains
    domains_res = client.get("/api/internships/domains", headers=stu_headers)
    assert domains_res.status_code == 200
    domains_list = domains_res.json()
    assert "Artificial Intelligence" in domains_list
    assert "Web Development" in domains_list
    assert "Cloud Computing" in domains_list

    # 2. Admin creates an internship in "Cyber Security" domain
    unique_tag = uuid.uuid4().hex[:6]
    create_res = client.post(
        "/api/admin/internships",
        headers=admin_headers,
        json={
            "title": f"Zero-Trust Security Intern {unique_tag}",
            "domain": "Cyber Security",
            "company_name": "Microsoft",
            "industry": "Cyber Security",
            "description": "Implement network security and SIEM rules.",
            "location": "Remote",
            "is_remote": True,
            "stipend": 3200,
            "duration_weeks": 10,
            "required_skills": ["Linux", "Networking", "Cyber Security"],
            "publish": True,
            "status": "AVAILABLE",
        },
    )
    assert create_res.status_code == 201
    created_intern = create_res.json()
    assert created_intern["domain"] == "Cyber Security"

    # 3. Filter by domain="Cyber Security"
    cyber_res = client.get(
        "/api/internships?status=AVAILABLE&domain=Cyber%20Security",
        headers=stu_headers,
    )
    assert cyber_res.status_code == 200
    cyber_items = cyber_res.json()
    assert len(cyber_items) >= 1
    assert all(item["domain"] == "Cyber Security" for item in cyber_items)
    assert any(item["id"] == created_intern["id"] for item in cyber_items)

    # 4. Search by keyword + domain filter
    search_res = client.get(
        f"/api/internships?status=AVAILABLE&domain=Cyber%20Security&search={unique_tag}",
        headers=stu_headers,
    )
    assert search_res.status_code == 200
    assert len(search_res.json()) == 1
    assert search_res.json()[0]["id"] == created_intern["id"]


def test_compulsory_weekly_report_evidence_validation(client):
    """Verify Weekly Report submission enforces evidence_url when require_evidence=True and persists evidence_url."""
    stu_login = client.post(
        "/api/auth/login",
        json={"email": "student.alex@university.edu", "password": "Student@123"},
    ).json()
    stu_headers = {"Authorization": f"Bearer {stu_login['access_token']}"}

    existing_reports = client.get("/api/students/me/reports", headers=stu_headers).json()
    used_weeks = {r["week_number"] for r in existing_reports}
    target_week = next(w for w in range(1, 53) if w not in used_weeks)

    # 1. Missing evidence_url when require_evidence=True must return 400
    bad_res = client.post(
        "/api/students/me/reports",
        headers=stu_headers,
        json={
            "week_number": target_week,
            "achievements": "Completed distributed cache benchmark suite.",
            "challenges": "Tuned Redis connection pool.",
            "plans": "Deploy benchmark dashboard.",
            "hours_spent": 40,
            "evidence_url": "",
            "require_evidence": True,
        },
    )
    assert bad_res.status_code == 400
    assert "evidence" in bad_res.json()["detail"].lower()

    # 2. Valid evidence_url succeeds and persists in DB
    good_res = client.post(
        "/api/students/me/reports",
        headers=stu_headers,
        json={
            "week_number": target_week,
            "achievements": "Completed distributed cache benchmark suite.",
            "challenges": "Tuned Redis connection pool.",
            "plans": "Deploy benchmark dashboard.",
            "hours_spent": 40,
            "evidence_url": "https://github.com/alexchen/redis-benchmarks/pull/19",
            "require_evidence": True,
        },
    )
    assert good_res.status_code == 201
    assert good_res.json()["evidence_url"] == "https://github.com/alexchen/redis-benchmarks/pull/19"


def test_feature_2_knowledge_handoff_lifecycle_and_rbac(client):
    """Verify Feature 2: Knowledge Handoff create, update, mentor review, admin view, and RBAC."""
    import uuid

    # Student 1: Alex Chen (assigned to Prof. Alan Turing)
    alex_login = client.post(
        "/api/auth/login",
        json={"email": "student.alex@university.edu", "password": "Student@123"},
    ).json()
    alex_headers = {"Authorization": f"Bearer {alex_login['access_token']}"}
    alex_profile = client.get("/api/students/me", headers=alex_headers).json()

    # Student 2: Fresh student
    stu2_email = f"other.student.{uuid.uuid4().hex[:6]}@university.edu"
    stu2_reg = client.post(
        "/api/auth/register",
        json={
            "email": stu2_email,
            "password": "StudentPassword123!",
            "full_name": "Other Student",
            "role": "STUDENT",
            "department": "Computer Science",
            "academic_year": 3,
        },
    ).json()
    stu2_headers = {"Authorization": f"Bearer {stu2_reg['access_token']}"}

    # Mentor 1: Prof. Alan Turing (assigned to Alex Chen)
    turing_login = client.post(
        "/api/auth/login",
        json={"email": "mentor.turing@university.edu", "password": "Mentor@123"},
    ).json()
    turing_headers = {"Authorization": f"Bearer {turing_login['access_token']}"}

    # Mentor 2: Unassigned newly registered mentor
    m2_email = f"unassigned.mentor.{uuid.uuid4().hex[:6]}@university.edu"
    m2_reg = client.post(
        "/api/auth/register",
        json={
            "email": m2_email,
            "password": "MentorPassword123!",
            "full_name": "Prof. Unassigned Mentor",
            "role": "MENTOR",
            "department": "Electrical Engineering",
            "designation": "Assistant Professor",
        },
    ).json()
    m2_headers = {"Authorization": f"Bearer {m2_reg['access_token']}"}

    # Admin
    admin_login = client.post(
        "/api/auth/login",
        json={"email": "admin@university.edu", "password": "Admin@123"},
    ).json()
    admin_headers = {"Authorization": f"Bearer {admin_login['access_token']}"}

    # 1. Alex creates a Knowledge Handoff
    create_res = client.post(
        "/api/students/me/handoffs",
        headers=alex_headers,
        json={
            "title": "Telemetry Ingestion Service Architecture Handoff",
            "overview": "End-to-end documentation of the FastAPI telemetry service.",
            "completed_work": "Implemented async ingestion endpoints and Prometheus metrics.",
            "technologies": ["Python", "FastAPI", "Docker", "PostgreSQL"],
            "learned_concepts": "Async event loops, connection pooling, and RBAC.",
            "implementation_notes": "Configured SQLAlchemy pool_pre_ping for resilience.",
            "challenges": "Burst traffic backpressure.",
            "solutions": "Added bounded async queue batching.",
            "resources": "https://github.com/alexchen/telemetry-service/wiki",
            "repository_url": "https://github.com/alexchen/telemetry-service",
            "deployment_url": "https://telemetry.internal.demo",
            "pending_work": "Add OpenTelemetry trace exporter.",
            "recommendations": "Keep worker concurrency at 4 per container.",
            "known_issues": "None.",
            "final_notes": "Ready for next intern cohort.",
            "status": "SUBMITTED",
        },
    )
    assert create_res.status_code == 201, create_res.text
    handoff = create_res.json()
    handoff_id = handoff["id"]
    assert handoff["title"] == "Telemetry Ingestion Service Architecture Handoff"
    assert handoff["status"] == "SUBMITTED"

    # 2. RBAC: Other student cannot update Alex's handoff
    forbidden_stu = client.put(
        f"/api/students/me/handoffs/{handoff_id}",
        headers=stu2_headers,
        json={"title": "Hacked Title"},
    )
    assert forbidden_stu.status_code == 403

    # 3. RBAC: Unassigned mentor cannot view or review Alex's handoff
    assert (
        client.get(
            f"/api/mentors/students/{alex_profile['id']}/handoffs",
            headers=m2_headers,
        ).status_code
        == 403
    )
    assert (
        client.patch(
            f"/api/mentors/handoffs/{handoff_id}/review",
            headers=m2_headers,
            json={"status": "APPROVED", "mentor_feedback": "Unauthorized approval"},
        ).status_code
        == 403
    )

    # 4. Assigned mentor views and approves Alex's handoff
    mentor_view = client.get(
        f"/api/mentors/students/{alex_profile['id']}/handoffs",
        headers=turing_headers,
    )
    assert mentor_view.status_code == 200
    assert any(h["id"] == handoff_id for h in mentor_view.json())

    review_res = client.patch(
        f"/api/mentors/handoffs/{handoff_id}/review",
        headers=turing_headers,
        json={
            "status": "APPROVED",
            "mentor_feedback": "Comprehensive architecture handoff and clear operational runbook.",
        },
    )
    assert review_res.status_code == 200
    assert review_res.json()["status"] == "APPROVED"
    assert "Comprehensive architecture handoff" in review_res.json()["mentor_feedback"]

    # 5. Admin views all handoffs
    admin_handoffs = client.get("/api/admin/handoffs", headers=admin_headers)
    assert admin_handoffs.status_code == 200
    assert any(h["id"] == handoff_id and h["status"] == "APPROVED" for h in admin_handoffs.json())


def test_feature_3_skill_dependency_graph_and_learning_order(client):
    """Verify Feature 3: Skill Dependency Graph prerequisite chain computation and Admin CRUD."""
    stu_login = client.post(
        "/api/auth/login",
        json={"email": "student.alex@university.edu", "password": "Student@123"},
    ).json()
    stu_headers = {"Authorization": f"Bearer {stu_login['access_token']}"}

    admin_login = client.post(
        "/api/auth/login",
        json={"email": "admin@university.edu", "password": "Admin@123"},
    ).json()
    admin_headers = {"Authorization": f"Bearer {admin_login['access_token']}"}

    # 1. Verify seeded skill dependencies exist in database
    deps_res = client.get("/api/skill-dependencies", headers=stu_headers)
    assert deps_res.status_code == 200
    deps = deps_res.json()
    assert len(deps) >= 15
    assert any(
        d["skill"] == "Deep Learning" and d["prerequisite_skill"] == "Machine Learning"
        for d in deps
    )
    assert any(
        d["skill"] == "Machine Learning" and d["prerequisite_skill"] == "Python"
        for d in deps
    )

    # 2. Compute Skill Dependency Graph for student who has Python, targeting Deep Learning & Kubernetes
    graph_res = client.post(
        "/api/skill-dependencies/graph",
        headers=stu_headers,
        json={
            "student_skills": ["Python", "Linux"],
            "required_skills": ["Python", "Deep Learning", "Kubernetes"],
        },
    )
    assert graph_res.status_code == 200, graph_res.text
    graph = graph_res.json()
    assert "Python" in graph["matched_skills"]
    assert "Deep Learning" in graph["missing_target_skills"]
    assert "Machine Learning" in graph["missing_prerequisite_skills"]
    assert "Docker" in graph["missing_prerequisite_skills"]

    # Recommended learning order must place foundational prerequisites BEFORE advanced target skills
    order = graph["recommended_learning_order"]
    assert order.index("Machine Learning") < order.index("Deep Learning")
    assert order.index("Docker") < order.index("Kubernetes")

    # Verify prerequisite chain for Deep Learning is Python -> Machine Learning -> Deep Learning
    dl_chain = next((c for c in graph["chains"] if c["target_skill"] == "Deep Learning"), None)
    assert dl_chain is not None
    assert dl_chain["chain"] == ["Python", "Machine Learning", "Deep Learning"]

    # 3. Admin CRUD for skill dependencies + RBAC
    assert (
        client.post(
            "/api/admin/skill-dependencies",
            headers=stu_headers,
            json={"skill": "LangChain", "prerequisite_skill": "Python"},
        ).status_code
        == 403
    )

    add_dep = client.post(
        "/api/admin/skill-dependencies",
        headers=admin_headers,
        json={
            "skill": "LangChain",
            "prerequisite_skill": "Python",
            "relationship": "REQUIRES",
            "description": "Python is required before building LangChain agents.",
        },
    )
    assert add_dep.status_code == 201
    dep_id = add_dep.json()["id"]

    del_dep = client.delete(f"/api/admin/skill-dependencies/{dep_id}", headers=admin_headers)
    assert del_dep.status_code == 200


def test_feature_4_completion_certificate_eligibility_generation_pdf_and_rbac(client):
    """
    Verify Feature 4:
    1. Certificate generation is blocked (400) before all tasks & weekly reports are completed.
    2. Once tasks and weekly reports are completed and Mentor confirms completion, a unique CERT-YYYY-XXXX
       certificate is generated and stored in the database.
    3. Duplicate certificate generation is prevented (idempotent).
    4. Certificate PDF download returns a real %PDF-1.4 document.
    5. Strict RBAC: another student or unassigned mentor receives 403 Forbidden.
    """
    import uuid
    import re

    admin_login = client.post(
        "/api/auth/login",
        json={"email": "admin@university.edu", "password": "Admin@123"},
    ).json()
    admin_headers = {"Authorization": f"Bearer {admin_login['access_token']}"}

    turing_login = client.post(
        "/api/auth/login",
        json={"email": "mentor.turing@university.edu", "password": "Mentor@123"},
    ).json()
    turing_headers = {"Authorization": f"Bearer {turing_login['access_token']}"}
    turing_id = client.get("/api/mentors/me", headers=turing_headers).json()["id"]

    # Register a student for full end-to-end completion & certificate test
    stu_email = f"cert.student.{uuid.uuid4().hex[:6]}@university.edu"
    stu_reg = client.post(
        "/api/auth/register",
        json={
            "email": stu_email,
            "password": "StudentPassword123!",
            "full_name": "Ananya Deshpande",
            "role": "STUDENT",
            "department": "Computer Science & Engineering",
            "academic_year": 4,
            "skills": ["Python", "FastAPI", "Docker"],
        },
    ).json()
    stu_headers = {"Authorization": f"Bearer {stu_reg['access_token']}"}
    student_id = client.get("/api/students/me", headers=stu_headers).json()["id"]

    # Register another student & unassigned mentor for RBAC check
    other_stu_reg = client.post(
        "/api/auth/register",
        json={
            "email": f"other.cert.{uuid.uuid4().hex[:6]}@university.edu",
            "password": "StudentPassword123!",
            "full_name": "Unauthorized Student",
            "role": "STUDENT",
            "department": "IT",
            "academic_year": 3,
        },
    ).json()
    other_stu_headers = {"Authorization": f"Bearer {other_stu_reg['access_token']}"}

    unassigned_mentor_reg = client.post(
        "/api/auth/register",
        json={
            "email": f"unassigned.cert.{uuid.uuid4().hex[:6]}@university.edu",
            "password": "MentorPassword123!",
            "full_name": "Prof. Unassigned",
            "role": "MENTOR",
            "department": "Mechanical",
            "designation": "Professor",
        },
    ).json()
    unassigned_mentor_headers = {"Authorization": f"Bearer {unassigned_mentor_reg['access_token']}"}

    # Admin creates & publishes an internship
    intern_res = client.post(
        "/api/admin/internships",
        headers=admin_headers,
        json={
            "title": "Cloud Native Backend Intern",
            "domain": "Cloud Computing",
            "company_name": "Microsoft",
            "industry": "Cloud & AI",
            "description": "Build cloud-native microservices.",
            "location": "Hyderabad / Remote",
            "is_remote": True,
            "stipend": 3500,
            "duration_weeks": 8,
            "required_skills": ["Python", "FastAPI", "Docker"],
            "publish": True,
            "status": "AVAILABLE",
        },
    )
    assert intern_res.status_code == 201
    internship_id = intern_res.json()["id"]

    # Student applies -> Admin approves and assigns Prof. Alan Turing
    apply_res = client.post(
        f"/api/internships/{internship_id}/apply",
        headers=stu_headers,
        json={
            "full_name": "Ananya Deshpande",
            "email": stu_email,
            "technical_skills": ["Python", "FastAPI", "Docker"],
            "skills": ["Python", "FastAPI", "Docker"],
        },
    )
    assert apply_res.status_code == 200
    app_id = apply_res.json()["id"]

    approve_res = client.patch(
        f"/api/admin/applications/{app_id}",
        headers=admin_headers,
        json={"status": "APPROVED", "mentor_id": turing_id},
    )
    assert approve_res.status_code == 200

    # 1. Attempting to generate certificate BEFORE tasks & reports are done must fail with 400
    premature_cert = client.post(
        f"/api/students/internships/{internship_id}/certificate",
        headers=stu_headers,
    )
    assert premature_cert.status_code == 400
    assert "completion" in premature_cert.json()["detail"].lower() or "task" in premature_cert.json()["detail"].lower()

    # 2. Student completes all assigned tasks and submits weekly report with evidence
    tasks = client.get("/api/students/me/tasks", headers=stu_headers).json()
    assert len(tasks) >= 3
    for t in tasks:
        if not t["is_completed"]:
            is_company = (t.get("source") == "Company Provided") or bool(t.get("external_mentor_id"))
            if is_company:
                tog = client.post(
                    "/api/students/me/timesheet/task",
                    headers=stu_headers,
                    json={
                        "task_id": t["id"],
                        "task_title": t["title"],
                        "task_link": f"https://github.com/ananya/task-{t['id']}",
                    },
                )
                assert tog.status_code == 200
            else:
                tog = client.patch(f"/api/students/me/tasks/{t['id']}/toggle", headers=stu_headers)
                assert tog.status_code == 200

    rep_res = client.post(
        "/api/students/me/reports",
        headers=stu_headers,
        json={
            "week_number": 1,
            "achievements": "Completed all cloud-native backend milestones and deployment.",
            "challenges": "None",
            "plans": "Final handoff",
            "hours_spent": 40,
            "evidence_url": "https://github.com/ananya/cloud-native-intern/releases/tag/v1.0",
            "require_evidence": True,
        },
    )
    assert rep_res.status_code == 201

    # 3. Assigned Mentor confirms internship completion & issues certificate
    confirm_res = client.post(
        f"/api/mentors/students/{student_id}/confirm-completion",
        headers=turing_headers,
    )
    assert confirm_res.status_code == 200, confirm_res.text
    confirm_payload = confirm_res.json()
    cert_data = confirm_payload.get("certificate") or confirm_payload
    cert_code = cert_data["certificate_id"]
    assert re.match(r"^CERT-\d{4}-\d{4,}$", cert_code)
    assert cert_data["student_name"] == "Ananya Deshpande"
    assert cert_data["internship_title"] == "Cloud Native Backend Intern"
    assert cert_data["company_name"] == "Microsoft"
    assert cert_data["domain"] == "Cloud Computing"
    assert "Alan Turing" in cert_data["mentor_name"]

    # 4. Duplicate certificate request returns the existing certificate (no duplicate row created)
    dup_cert = client.post(
        f"/api/students/internships/{internship_id}/certificate",
        headers=stu_headers,
    )
    assert dup_cert.status_code == 200
    assert dup_cert.json()["certificate_id"] == cert_code

    stu_certs = client.get("/api/students/me/certificates", headers=stu_headers).json()
    assert len([c for c in stu_certs if c["internship_id"] == internship_id]) == 1

    # 5. Student, Assigned Mentor, and Admin can download the certificate PDF (%PDF-1.4)
    for hdrs in (stu_headers, turing_headers, admin_headers):
        pdf_res = client.get(f"/api/certificates/{cert_code}/download", headers=hdrs)
        assert pdf_res.status_code == 200
        assert pdf_res.headers["content-type"] == "application/pdf"
        assert pdf_res.content.startswith(b"%PDF-1.4")
        assert b"%%EOF" in pdf_res.content

    # 6. RBAC: Other student and unassigned mentor get 403 Forbidden
    assert (
        client.get(
            f"/api/students/certificates/{cert_code}/download",
            headers=other_stu_headers,
        ).status_code
        == 403
    )
    assert (
        client.get(
            f"/api/certificates/{cert_code}/download",
            headers=unassigned_mentor_headers,
        ).status_code
        == 403
    )







