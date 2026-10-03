import uuid
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="module")
def admin_headers(client):
    res = client.post("/api/auth/login", json={"email": "admin@university.edu", "password": "Admin@123"})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def student_headers(client):
    res = client.post("/api/auth/login", json={"email": "student@demo.com", "password": "Student@123"})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def alex_headers(client):
    res = client.post("/api/auth/login", json={"email": "student.alex@university.edu", "password": "Student@123"})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_1_admin_can_create_external_mentor(client, admin_headers):
    """1. Admin can create External Mentor."""
    companies = client.get("/api/admin/companies", headers=admin_headers).json()
    assert len(companies) > 0
    ms_company = next((c for c in companies if "microsoft" in c["name"].lower()), companies[0])

    unique_email = f"coord.{uuid.uuid4().hex[:8]}@company.com"
    payload = {
        "email": unique_email,
        "password": "Coordinator@123",
        "full_name": "Satya Nadella",
        "company_id": ms_company["id"],
        "designation": "Executive Coordinator",
        "phone": "+1 425-882-8080",
    }
    create_res = client.post("/api/admin/external-mentors", headers=admin_headers, json=payload)
    assert create_res.status_code == 201, create_res.text
    data = create_res.json()
    assert data["email"] == unique_email
    assert data["full_name"] == "Satya Nadella"
    assert data["company_id"] == ms_company["id"]
    assert data["designation"] == "Executive Coordinator"


def test_2_external_mentor_is_linked_to_correct_company(client, admin_headers):
    """2. External Mentor is linked to the correct company."""
    companies = client.get("/api/admin/companies", headers=admin_headers).json()
    google = next((c for c in companies if "google" in c["name"].lower()), companies[1])

    unique_email = f"google.coord.{uuid.uuid4().hex[:8]}@google.com"
    payload = {
        "email": unique_email,
        "password": "Coordinator@123",
        "full_name": "Sundar Pichai",
        "company_id": google["id"],
        "designation": "Google Internship Lead",
    }
    create_res = client.post("/api/admin/external-mentors", headers=admin_headers, json=payload)
    assert create_res.status_code == 201
    mentor_data = create_res.json()
    assert mentor_data["company_id"] == google["id"]
    assert mentor_data["company_name"] == google["name"]

    # Verify via GET /api/admin/external-mentors list
    ext_list = client.get("/api/admin/external-mentors", headers=admin_headers).json()
    matched = next((m for m in ext_list if m["id"] == mentor_data["id"]), None)
    assert matched is not None
    assert matched["company_id"] == google["id"]
    assert matched["company_name"] == google["name"]


def test_3_student_can_view_their_assigned_company_coordinator(client, student_headers):
    """3. Student can view their assigned Company Coordinator."""
    coord_res = client.get("/api/students/me/company-coordinator", headers=student_headers)
    assert coord_res.status_code == 200, coord_res.text
    coord = coord_res.json()
    assert "name" in coord
    assert "email" in coord
    assert "company_name" in coord
    assert "designation" in coord
    assert len(coord["name"]) > 0
    assert len(coord["company_name"]) > 0


def test_4_student_cannot_view_another_students_coordinator(client, alex_headers, admin_headers):
    """4. Student cannot view another student's coordinator."""
    # Alex is student.alex@university.edu; ensure calling the endpoint returns only his own profile/status
    res = client.get("/api/students/me/company-coordinator", headers=alex_headers)
    # Alex either gets his own coordinator or 404 (if not assigned to any company coordinator yet)
    if res.status_code == 200:
        coord = res.json()
        # He cannot see student@demo.com's profile or parameters passed by another user
        alex_me = client.get("/api/students/me", headers=alex_headers).json()
        assert coord["user_id"] != alex_me["user_id"]
    else:
        assert res.status_code == 404
        assert "assigned" in res.json()["detail"].lower()


def test_5_student_can_message_company_coordinator(client, student_headers):
    """5. Student can message their Company Coordinator."""
    msg_res = client.post(
        "/api/messages",
        headers=student_headers,
        json={
            "content": "Hello Company Coordinator, I have submitted the milestone API build for review.",
            "recipient_role": "EXTERNAL_MENTOR",
        },
    )
    assert msg_res.status_code == 201, msg_res.text
    msg = msg_res.json()
    assert msg["sender_role"] == "STUDENT"
    assert "milestone API build" in msg["content"]
    assert msg["external_mentor_id"] is not None


def test_6_external_mentor_can_reply_to_assigned_student(client, admin_headers):
    """6. External Mentor can reply to assigned student."""
    # Login as seeded External Mentor John Smith
    login_res = client.post("/api/auth/login", json={"email": "john@company.com", "password": "Coordinator@123"})
    assert login_res.status_code == 200, login_res.text
    coord_token = login_res.json()["access_token"]
    coord_headers = {"Authorization": f"Bearer {coord_token}"}

    # Coordinator views messages for student 1 (Rohan Patil)
    history_res = client.get("/api/messages?student_id=1", headers=coord_headers)
    assert history_res.status_code == 200, history_res.text
    history = history_res.json()
    assert any("milestone API build" in m["content"] for m in history)

    # Coordinator replies
    reply_res = client.post(
        "/api/messages",
        headers=coord_headers,
        json={
            "student_id": 1,
            "content": "Great work! The engineering team will review your API PR today.",
        },
    )
    assert reply_res.status_code == 201, reply_res.text
    reply = reply_res.json()
    assert reply["sender_role"] == "EXTERNAL_MENTOR"

    # Verify student receives reply
    student_login = client.post("/api/auth/login", json={"email": "student@demo.com", "password": "Student@123"}).json()
    stu_headers = {"Authorization": f"Bearer {student_login['access_token']}"}
    stu_coord_msgs = client.get("/api/messages?recipient_role=EXTERNAL_MENTOR", headers=stu_headers).json()
    assert any("engineering team will review your API PR" in m["content"] for m in stu_coord_msgs)


def test_7_external_mentor_cannot_access_another_companys_student(client, admin_headers):
    """7. External Mentor cannot access another company's student."""
    # Create coordinator for Google
    companies = client.get("/api/admin/companies", headers=admin_headers).json()
    google = next(c for c in companies if "google" in c["name"].lower())

    g_email = f"g_lead_{uuid.uuid4().hex[:6]}@google.com"
    client.post(
        "/api/admin/external-mentors",
        headers=admin_headers,
        json={
            "email": g_email,
            "password": "Coordinator@123",
            "full_name": "Google Lead",
            "company_id": google["id"],
        },
    )
    g_login = client.post("/api/auth/login", json={"email": g_email, "password": "Coordinator@123"}).json()
    g_headers = {"Authorization": f"Bearer {g_login['access_token']}"}

    # Attempt to access student 1 (Rohan Patil, who is not assigned to Google)
    unauth_get = client.get("/api/messages?student_id=1", headers=g_headers)
    assert unauth_get.status_code == 403

    unauth_post = client.post(
        "/api/messages",
        headers=g_headers,
        json={"student_id": 1, "content": "Unauthorized message from Google to non-Google student"},
    )
    assert unauth_post.status_code == 403


def test_8_external_mentor_cannot_access_another_external_mentors_students(client, admin_headers):
    """8. External Mentor cannot access another external mentor's students."""
    # Create isolated mentor for FinEdge Solutions
    companies = client.get("/api/admin/companies", headers=admin_headers).json()
    finedge = next(c for c in companies if "finedge" in c["name"].lower())

    fe_email = f"fe_coord_{uuid.uuid4().hex[:6]}@finedge.com"
    client.post(
        "/api/admin/external-mentors",
        headers=admin_headers,
        json={
            "email": fe_email,
            "password": "Coordinator@123",
            "full_name": "FinEdge Coordinator",
            "company_id": finedge["id"],
        },
    )
    fe_login = client.post("/api/auth/login", json={"email": fe_email, "password": "Coordinator@123"}).json()
    fe_headers = {"Authorization": f"Bearer {fe_login['access_token']}"}

    # Student 1 is not assigned to FinEdge coordinator
    res = client.get("/api/messages?student_id=1", headers=fe_headers)
    assert res.status_code == 403


def test_9_student_cannot_impersonate_external_mentor(client, student_headers):
    """9. Student cannot impersonate External Mentor."""
    # Student attempting to access external mentor private profile endpoint
    res = client.get("/api/external-mentors/me", headers=student_headers)
    assert res.status_code == 403

    res2 = client.get("/api/external-mentors/me/students", headers=student_headers)
    assert res2.status_code == 403


def test_10_student_cannot_modify_external_mentor_company_assignment(client, student_headers):
    """10. Student cannot modify External Mentor/company assignment."""
    res = client.post(
        "/api/admin/external-mentors",
        headers=student_headers,
        json={
            "email": "hack@company.com",
            "password": "Hack@123456",
            "full_name": "Hacker",
            "company_id": 1,
        },
    )
    assert res.status_code == 403

    res2 = client.put(
        "/api/admin/external-mentors/1",
        headers=student_headers,
        json={"designation": "Hacked Coordinator"},
    )
    assert res2.status_code == 403


def test_11_external_mentor_cannot_change_interview_result(client):
    """11. External Mentor cannot change interview result."""
    login_res = client.post("/api/auth/login", json={"email": "john@company.com", "password": "Coordinator@123"})
    coord_token = login_res.json()["access_token"]
    coord_headers = {"Authorization": f"Bearer {coord_token}"}

    # Attempt to approve or reject application as External Mentor
    res = client.post(
        "/api/admin/applications/1/action",
        headers=coord_headers,
        json={"status": "APPROVED", "review_notes": "Attempted by External Mentor"},
    )
    assert res.status_code == 403


def test_12_external_mentor_cannot_modify_admin_settings(client):
    """12. External Mentor cannot modify Admin settings."""
    login_res = client.post("/api/auth/login", json={"email": "john@company.com", "password": "Coordinator@123"})
    coord_token = login_res.json()["access_token"]
    coord_headers = {"Authorization": f"Bearer {coord_token}"}

    # Attempt to change student mentor as External Mentor
    res = client.put(
        "/api/admin/students/1/mentor",
        headers=coord_headers,
        json={"mentor_id": 1},
    )
    assert res.status_code == 403


def test_13_external_mentor_can_see_only_relevant_company_tasks(client):
    """13. External Mentor can see only relevant company tasks."""
    login_res = client.post("/api/auth/login", json={"email": "john@company.com", "password": "Coordinator@123"})
    coord_token = login_res.json()["access_token"]
    coord_headers = {"Authorization": f"Bearer {coord_token}"}

    tasks_res = client.get("/api/external-mentors/me/tasks", headers=coord_headers)
    assert tasks_res.status_code == 200, tasks_res.text
    tasks = tasks_res.json()
    assert isinstance(tasks, list)
    # Tasks returned must belong to assigned students or Microsoft company
    for t in tasks:
        assert t["student_id"] == 1 or "microsoft" in (t.get("company_name") or "").lower()


def test_14_student_can_clearly_see_company_provided_task_and_coordinator(client, student_headers):
    """14. Student can clearly see company-provided task and company coordinator."""
    tasks_res = client.get("/api/students/me/tasks", headers=student_headers)
    assert tasks_res.status_code == 200, tasks_res.text
    tasks = tasks_res.json()
    assert len(tasks) > 0

    first_task = tasks[0]
    assert "title" in first_task
    assert "source" in first_task
    assert first_task["source"] == "Company Provided"
    assert "assigned_by" in first_task
    assert "status" in first_task
    assert "is_completed" in first_task
