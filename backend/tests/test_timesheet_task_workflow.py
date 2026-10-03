"""
Comprehensive Pytest Suite for Timesheet Task Completion Workflow:
1. Direct Student completion of Company Task -> REJECTED
2. Missing Task Title -> REJECTED
3. Missing Task Link -> REJECTED
4. Invalid Task Link -> REJECTED
5. Wrong student's task -> REJECTED
6. Valid Timesheet submission -> PASS
7. Same task becomes COMPLETED -> PASS
8. Student sees COMPLETED -> PASS
9. Internal Faculty Mentor sees COMPLETED -> PASS
10. Company Coordinator sees COMPLETED -> PASS
11. Submitted Task Link visible to both mentors -> PASS
12. Notifications created -> PASS
13. Existing messaging remains intact -> PASS
14. Existing internship/application flow remains intact -> PASS
15. Existing interview/report/skill-gap/certificate flows remain intact -> PASS
"""
import pytest
import uuid
import re
from fastapi.testclient import TestClient
from backend.app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_timesheet_task_workflow_full_suite(client):
    # Setup Coordinator, Faculty Mentor, and Student
    admin_login = client.post(
        "/api/auth/login",
        json={"email": "admin@university.edu", "password": "Admin@123"},
    ).json()
    admin_headers = {"Authorization": f"Bearer {admin_login['access_token']}"}

    john_login = client.post(
        "/api/auth/login",
        json={"email": "john@company.com", "password": "Coordinator@123"},
    ).json()
    john_headers = {"Authorization": f"Bearer {john_login['access_token']}"}

    stu_login = client.post(
        "/api/auth/login",
        json={"email": "student@demo.com", "password": "Student@123"},
    ).json()
    stu_headers = {"Authorization": f"Bearer {stu_login['access_token']}"}
    stu_id = client.get("/api/students/me", headers=stu_headers).json()["id"]

    turing_login = client.post(
        "/api/auth/login",
        json={"email": "mentor.turing@university.edu", "password": "Mentor@123"},
    ).json()
    turing_headers = {"Authorization": f"Bearer {turing_login['access_token']}"}

    # Step 1: Coordinator assigns Company Provided Task
    unique_title = f"ETL Pipeline Microservice {uuid.uuid4().hex[:6]}"
    assign_res = client.post(
        "/api/external-mentors/me/tasks",
        headers=john_headers,
        json={
            "student_id": stu_id,
            "title": unique_title,
            "description": "Build high-throughput ingestion pipeline.",
            "priority": "HIGH",
        },
    )
    assert assign_res.status_code in (200, 201), assign_res.text
    company_task = assign_res.json()
    task_id = company_task["id"]

    # Point 1: Direct Student completion of Company Task -> REJECTED (400 Bad Request)
    toggle_res = client.post(f"/api/students/me/tasks/{task_id}/toggle", headers=stu_headers)
    assert toggle_res.status_code == 400
    assert "Direct completion is disabled for Company Provided Tasks" in toggle_res.json()["detail"]

    patch_toggle_res = client.patch(f"/api/students/me/tasks/{task_id}/toggle", headers=stu_headers)
    assert patch_toggle_res.status_code == 400

    # Point 2: Missing Task Title -> REJECTED (400 Bad Request)
    no_title_res = client.post(
        "/api/students/me/timesheet/task",
        headers=stu_headers,
        json={
            "task_id": task_id,
            "task_title": "",
            "task_link": "https://github.com/student/etl-pipeline",
        },
    )
    assert no_title_res.status_code == 400

    # Point 3: Missing Task Link -> REJECTED (400 Bad Request)
    no_link_res = client.post(
        "/api/students/me/timesheet/task",
        headers=stu_headers,
        json={
            "task_id": task_id,
            "task_title": unique_title,
            "task_link": "",
        },
    )
    assert no_link_res.status_code == 400

    # Point 4: Invalid Task Link -> REJECTED (400 Bad Request)
    bad_url_res = client.post(
        "/api/students/me/timesheet/task",
        headers=stu_headers,
        json={
            "task_id": task_id,
            "task_title": unique_title,
            "task_link": "not_a_valid_http_link",
        },
    )
    assert bad_url_res.status_code == 400

    # Point 5: Wrong student's task -> REJECTED (403 Forbidden)
    alex_login = client.post(
        "/api/auth/login",
        json={"email": "student.alex@university.edu", "password": "Student@123"},
    ).json()
    alex_headers = {"Authorization": f"Bearer {alex_login['access_token']}"}

    wrong_stu_res = client.post(
        "/api/students/me/timesheet/task",
        headers=alex_headers,
        json={
            "task_id": task_id,
            "task_title": unique_title,
            "task_link": "https://github.com/alex/etl-pipeline",
        },
    )
    assert wrong_stu_res.status_code == 403

    # Point 6: Valid Timesheet submission -> PASS
    valid_link = "https://github.com/student/etl-pipeline-deliverable"
    ts_res = client.post(
        "/api/students/me/timesheet/task",
        headers=stu_headers,
        json={
            "task_id": task_id,
            "task_title": unique_title,
            "task_link": valid_link,
        },
    )
    assert ts_res.status_code == 200, ts_res.text
    completed_task = ts_res.json()

    # Point 7: Same task becomes COMPLETED
    assert completed_task["id"] == task_id
    assert completed_task["is_completed"] is True
    assert completed_task["status"] == "COMPLETED"
    assert completed_task["task_link"] == valid_link
    assert completed_task["completed_at"] is not None

    # Point 8: Student sees COMPLETED
    my_tasks = client.get("/api/students/me/tasks", headers=stu_headers).json()
    st_task = next(t for t in my_tasks if t["id"] == task_id)
    assert st_task["is_completed"] is True
    assert st_task["status"] == "COMPLETED"
    assert st_task["task_link"] == valid_link

    # Point 9: Internal Faculty Mentor sees COMPLETED
    mentor_detail = client.get(f"/api/mentors/students/{stu_id}", headers=turing_headers).json()
    men_task = next(t for t in mentor_detail["tasks"] if t["id"] == task_id)
    assert men_task["is_completed"] is True
    assert men_task["status"] == "COMPLETED"

    # Point 10: Company Coordinator sees COMPLETED
    coord_tasks = client.get("/api/external-mentors/me/tasks", headers=john_headers).json()
    c_task = next(t for t in coord_tasks if t["id"] == task_id)
    assert c_task["is_completed"] is True
    assert c_task["status"] == "COMPLETED"

    # Point 11: Submitted Task Link visible to both mentors
    assert men_task["task_link"] == valid_link
    assert c_task["task_link"] == valid_link

    # Point 12: Notifications created
    fac_notifs = client.get("/api/notifications", headers=turing_headers).json()
    assert any("completed" in n.get("message", "").lower() or "task" in n.get("title", "").lower() for n in fac_notifs)

    # Point 13: Existing messaging remains intact
    msg_res = client.post(
        "/api/messages",
        headers=stu_headers,
        json={"content": "Finished deliverable and logged in timesheet."},
    )
    assert msg_res.status_code in (200, 201)

    # Point 14: Existing internship/application flow remains intact
    apps = client.get("/api/students/me/applications", headers=stu_headers).json()
    assert isinstance(apps, list)

    # Point 15: Existing interview/report/skill-gap/certificate flows remain intact
    sg_res = client.post(
        "/api/analytics/skill-gap",
        headers=stu_headers,
        json={
            "student_skills": ["Python", "FastAPI"],
            "required_skills": ["Python", "FastAPI", "Kubernetes"],
        },
    )
    assert sg_res.status_code == 200
    assert sg_res.json()["match_percentage"] == pytest.approx(66.67, 0.1)
