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
    initial_completed = first_task["is_completed"]

    toggle_res = client.post(f"/api/students/me/tasks/{task_id}/toggle", headers=headers)
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_completed"] != initial_completed

    # Toggle back to maintain seeded state
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


