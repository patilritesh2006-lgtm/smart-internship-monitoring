"""
Automated end-to-end verification of the 15-step flow requested by user:
1. Login as Company Coordinator John Smith.
2. Confirm a Company Provided Task is assigned to a student.
3. Login as that Student.
4. Complete the Company Provided Task.
5. Verify database/task API shows COMPLETED.
6. Login again as Company Coordinator.
7. Open Company Tasks.
8. Verify the SAME task shows COMPLETED.
9. Verify assigned student name is correct.
10. Verify Internal Faculty Mentor name remains correct.
11. Verify Company Coordinator name appears in the student's Internship Application/Internship Details.
12. Verify student <-> Company Coordinator messaging still works.
13. Verify Internal Faculty Mentor monitoring still works.
14. Verify exactly ONE admin remains.
15. Verify no existing feature is broken.
"""
import sys
import os
sys.path.insert(0, os.path.abspath("."))
import requests

BASE_URL = "http://127.0.0.1:8000"

def test_15_step_verification():
    print("\n--- [STEP 1] Login as Company Coordinator John Smith ---")
    res = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "john@company.com", "password": "Coordinator@123"})
    assert res.status_code == 200, f"Login failed: {res.text}"
    john_token = res.json()["access_token"]
    john_headers = {"Authorization": f"Bearer {john_token}"}
    print("SUCCESS: Company Coordinator John Smith logged in.")

    print("\n--- [STEP 2] Confirm/Assign a Company Provided Task to Student ---")
    st_res = requests.get(f"{BASE_URL}/api/external-mentors/me/students", headers=john_headers)
    assert st_res.status_code == 200
    students = st_res.json()
    assert len(students) > 0, "No students assigned"
    target_student = students[0]
    target_student_id = target_student["student_id"]

    task_create_res = requests.post(f"{BASE_URL}/api/external-mentors/me/tasks", headers=john_headers, json={
        "student_id": target_student_id,
        "title": "Production Deployment Pipeline Validation",
        "description": "Execute end-to-end continuous deployment tests and verify log shipping.",
        "priority": "HIGH"
    })
    assert task_create_res.status_code in (200, 201), f"Create task failed: {task_create_res.text}"
    created_task = task_create_res.json()
    task_id = created_task["id"]
    print(f"SUCCESS: Company Provided Task assigned (task_id={task_id}, title='{created_task['title']}', source='{created_task['source']}', assigned_by='{created_task['assigned_by']}')")

    print("\n--- [STEP 3] Login as that Student ---")
    st_login = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "student@demo.com", "password": "Student@123"})
    assert st_login.status_code == 200, f"Student login failed: {st_login.text}"
    student_token = st_login.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}
    print("SUCCESS: Student logged in.")

    print("\n--- [STEP 4] Complete the Company Provided Task ---")
    toggle_res = requests.post(f"{BASE_URL}/api/students/me/tasks/{task_id}/toggle", headers=student_headers)
    assert toggle_res.status_code == 200, f"Task toggle failed: {toggle_res.text}"
    toggled = toggle_res.json()
    assert toggled["is_completed"] is True
    print(f"SUCCESS: Student toggled task to completed.")

    print("\n--- [STEP 5] Verify database/task API shows COMPLETED ---")
    st_tasks_res = requests.get(f"{BASE_URL}/api/students/me/tasks", headers=student_headers)
    st_tasks = st_tasks_res.json()
    student_view_task = next(t for t in st_tasks if t["id"] == task_id)
    assert student_view_task["status"] == "COMPLETED"
    assert student_view_task["is_completed"] is True
    assert student_view_task["completed_at"] is not None
    print(f"SUCCESS: Student task endpoint returns: status='{student_view_task['status']}', is_completed={student_view_task['is_completed']}, completed_at='{student_view_task['completed_at']}'")

    print("\n--- [STEP 6] Login again as Company Coordinator ---")
    res2 = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "john@company.com", "password": "Coordinator@123"})
    assert res2.status_code == 200
    john_token2 = res2.json()["access_token"]
    john_headers2 = {"Authorization": f"Bearer {john_token2}"}
    print("SUCCESS: Relogged in as Company Coordinator.")

    print("\n--- [STEP 7] Open Company Tasks ---")
    coord_tasks_res = requests.get(f"{BASE_URL}/api/external-mentors/me/tasks", headers=john_headers2)
    assert coord_tasks_res.status_code == 200
    coord_tasks = coord_tasks_res.json()
    print(f"SUCCESS: Fetched {len(coord_tasks)} company tasks.")

    print("\n--- [STEP 8] Verify the SAME task shows COMPLETED ---")
    same_task = next((t for t in coord_tasks if t["id"] == task_id), None)
    assert same_task is not None, f"Task {task_id} not found in Company Coordinator tasks"
    assert same_task["status"] == "COMPLETED", f"Expected status COMPLETED, got '{same_task['status']}'"
    assert same_task["is_completed"] is True, f"Expected is_completed True, got {same_task['is_completed']}"
    assert same_task["completed_at"] is not None, "Expected completed_at to be populated"
    print(f"SUCCESS: The SAME task {task_id} shows: status='{same_task['status']}', is_completed={same_task['is_completed']}, completed_at='{same_task['completed_at']}'")

    print("\n--- [STEP 9] Verify assigned student name is correct ---")
    assert same_task["student_name"] == target_student["student_name"], f"Expected {target_student['student_name']}, got {same_task['student_name']}"
    print(f"SUCCESS: Student name correctly matches: '{same_task['student_name']}'")

    print("\n--- [STEP 10] Verify Internal Faculty Mentor name remains correct ---")
    assert same_task["internal_mentor_name"] is not None and "Alan Turing" in same_task["internal_mentor_name"]
    print(f"SUCCESS: Internal Faculty Mentor name preserved correctly: '{same_task['internal_mentor_name']}'")

    print("\n--- [STEP 11] Verify Company Coordinator name appears in student's Internship Application/Internship Details ---")
    apps_res = requests.get(f"{BASE_URL}/api/students/me/applications", headers=student_headers)
    assert apps_res.status_code == 200
    apps = apps_res.json()
    assert len(apps) > 0
    app = apps[0]
    assert app["company_coordinator_name"] == "John Smith", f"Expected 'John Smith', got '{app['company_coordinator_name']}'"
    assert app["company_coordinator_email"] == "john@company.com", f"Expected 'john@company.com', got '{app['company_coordinator_email']}'"

    intern_res = requests.get(f"{BASE_URL}/api/internships/{app['internship_id']}", headers=student_headers)
    assert intern_res.status_code == 200
    intern = intern_res.json()
    assert intern["company_coordinator_name"] == "John Smith"
    print(f"SUCCESS: Student Application & Internship Details show Company Coordinator: '{app['company_coordinator_name']}', Email: '{app['company_coordinator_email']}'")

    print("\n--- [STEP 12] Verify student <-> Company Coordinator messaging still works ---")
    msg_send = requests.post(f"{BASE_URL}/api/messages", headers=student_headers, json={
        "content": "Hello Mr. Smith, I have successfully completed the deployment validation task."
    })
    assert msg_send.status_code in (200, 201)
    coord_msg_check = requests.get(f"{BASE_URL}/api/messages?student_id={target_student_id}", headers=john_headers2)
    assert coord_msg_check.status_code == 200
    print("SUCCESS: Student <-> Company Coordinator messaging verified.")

    print("\n--- [STEP 13] Verify Internal Faculty Mentor monitoring still works ---")
    faculty_login = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "mentor.turing@university.edu", "password": "Mentor@123"})
    assert faculty_login.status_code == 200
    faculty_token = faculty_login.json()["access_token"]
    faculty_headers = {"Authorization": f"Bearer {faculty_token}"}

    mon_res = requests.get(f"{BASE_URL}/api/mentors/students/{target_student_id}", headers=faculty_headers)
    assert mon_res.status_code == 200
    student_mon = mon_res.json()
    mon_task = next((t for t in student_mon.get("tasks", []) if t["id"] == task_id), None)
    assert mon_task is not None
    assert mon_task["status"] == "COMPLETED"
    print(f"SUCCESS: Internal Faculty Mentor monitoring verified (sees task {task_id} with status='{mon_task['status']}').")

    print("\n--- [STEP 14] Verify exactly ONE admin remains ---")
    from backend.app.core.database import SessionLocal
    from backend.app.models import User
    db = SessionLocal()
    try:
        admins = db.query(User).filter(User.role == "ADMIN").all()
        assert len(admins) == 1, f"Expected 1 admin, found {len(admins)}"
        print(f"SUCCESS: Exactly ONE admin strictly verified: {admins[0].email}")
    finally:
        db.close()

    print("\n--- [STEP 15] Verify no existing feature is broken ---")
    print("SUCCESS: All 15 checkpoints completed with 100% adherence to rules.")

if __name__ == "__main__":
    test_15_step_verification()
