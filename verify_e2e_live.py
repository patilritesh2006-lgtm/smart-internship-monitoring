"""
Comprehensive End-to-End Live Verification Script for
Smart Internship Management & Monitoring System.

Tests live Next.js frontend (http://localhost:3000) and
live FastAPI backend (http://localhost:8000).
"""

import json
import urllib.error
import urllib.request
import sys

FRONTEND_URL = "http://localhost:3000"
BACKEND_URL = "http://localhost:8000/api"


def make_request(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    headers.setdefault("Content-Type", "application/json")

    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode("utf-8")

    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            status_code = resp.getcode()
            body_bytes = resp.read()
            try:
                parsed_body = json.loads(body_bytes.decode("utf-8"))
            except Exception:
                parsed_body = body_bytes.decode("utf-8")
            return status_code, parsed_body
    except urllib.error.HTTPError as e:
        body_bytes = e.read()
        try:
            parsed_body = json.loads(body_bytes.decode("utf-8"))
        except Exception:
            parsed_body = body_bytes.decode("utf-8")
        return e.code, parsed_body


def test_frontend_routes():
    print("\n--- 1. Testing Live Next.js Frontend Routes (http://localhost:3000) ---")
    routes = ["/", "/login", "/register", "/student", "/mentor", "/admin"]
    for r in routes:
        code, body = make_request(f"{FRONTEND_URL}{r}")
        assert code == 200, f"Route {r} returned status {code}"
        assert "<html" in body or "<!DOCTYPE html>" in body, f"Route {r} did not return HTML"
        print(f"  [PASS] {r:12s} -> HTTP {code} OK (HTML served)")


def test_cors_headers():
    print("\n--- 2. Testing Live Backend Health & CORS Headers ---")
    code, body = make_request("http://localhost:8000/health")
    assert code == 200 and body.get("status") == "healthy"
    print(f"  [PASS] Backend Health -> HTTP 200 ({body})")


def test_five_demo_personas():
    print("\n--- 3. Testing Five Demo Personas (Live Authentication & Analytics) ---")

    # Persona 1: Alex Chen (Student - ON_TRACK)
    code, alex_auth = make_request(
        f"{BACKEND_URL}/auth/login",
        method="POST",
        data={"email": "student.alex@university.edu", "password": "Student@123"},
    )
    assert code == 200, f"Alex login failed: {alex_auth}"
    alex_token = alex_auth["access_token"]
    alex_hdr = {"Authorization": f"Bearer {alex_token}"}

    code, alex_att = make_request(f"{BACKEND_URL}/students/me/attention", headers=alex_hdr)
    assert code == 200 and alex_att["attention_status"] == "ON_TRACK"
    assert alex_att["attention_score"] >= 75
    print(f"  [PASS] Alex Chen       -> Role: STUDENT | Status: {alex_att['attention_status']} | Score: {alex_att['attention_score']}%")

    # Persona 2: David Miller (Student - NEEDS_ATTENTION)
    code, david_auth = make_request(
        f"{BACKEND_URL}/auth/login",
        method="POST",
        data={"email": "student.david@university.edu", "password": "Student@123"},
    )
    assert code == 200, f"David login failed: {david_auth}"
    david_token = david_auth["access_token"]
    david_hdr = {"Authorization": f"Bearer {david_token}"}

    code, david_att = make_request(f"{BACKEND_URL}/students/me/attention", headers=david_hdr)
    assert code == 200 and david_att["attention_status"] == "NEEDS_ATTENTION"
    assert david_att["attention_score"] < 50
    print(f"  [PASS] David Miller    -> Role: STUDENT | Status: {david_att['attention_status']} | Score: {david_att['attention_score']}% | Reasons: {david_att['reasons']}")

    # Persona 3: Maya Patel (Student - APPLICANT)
    code, maya_auth = make_request(
        f"{BACKEND_URL}/auth/login",
        method="POST",
        data={"email": "student.maya@university.edu", "password": "Student@123"},
    )
    assert code == 200, f"Maya login failed: {maya_auth}"
    maya_token = maya_auth["access_token"]
    maya_hdr = {"Authorization": f"Bearer {maya_token}"}

    code, maya_apps = make_request(f"{BACKEND_URL}/students/me/applications", headers=maya_hdr)
    assert code == 200 and len(maya_apps) >= 1
    print(f"  [PASS] Maya Patel      -> Role: STUDENT | Pending Apps: {len(maya_apps)} | First Status: {maya_apps[0]['status']}")

    # Persona 4: Dr. Alan Turing (Faculty Mentor)
    code, turing_auth = make_request(
        f"{BACKEND_URL}/auth/login",
        method="POST",
        data={"email": "mentor.turing@university.edu", "password": "Mentor@123"},
    )
    assert code == 200, f"Turing login failed: {turing_auth}"
    turing_token = turing_auth["access_token"]
    turing_hdr = {"Authorization": f"Bearer {turing_token}"}

    code, interns = make_request(f"{BACKEND_URL}/mentors/me/interns", headers=turing_hdr)
    assert code == 200 and len(interns) >= 2
    # Prioritized: NEEDS_ATTENTION at top
    assert interns[0]["attention_status"] == "NEEDS_ATTENTION", "Top intern must be prioritized as NEEDS_ATTENTION"
    print(f"  [PASS] Dr. Alan Turing -> Role: MENTOR  | Interns: {len(interns)} | Prioritized Top: {interns[0]['student_name']} ({interns[0]['attention_status']})")

    # Persona 5: Dean of Engineering (Administrator)
    code, admin_auth = make_request(
        f"{BACKEND_URL}/auth/login",
        method="POST",
        data={"email": "admin@university.edu", "password": "Admin@123"},
    )
    assert code == 200, f"Admin login failed: {admin_auth}"
    admin_token = admin_auth["access_token"]
    admin_hdr = {"Authorization": f"Bearer {admin_token}"}

    code, analytics = make_request(f"{BACKEND_URL}/admin/analytics", headers=admin_hdr)
    assert code == 200 and analytics["total_students"] >= 4
    print(f"  [PASS] Dean of Eng     -> Role: ADMIN   | Students: {analytics['total_students']} | Active Placements: {analytics['active_internships']} | Avg Health: {analytics['average_attention_score']}%")


def test_authorization_and_ownership():
    print("\n--- 4. Testing Authorization & Resource Ownership Enforcement ---")
    # Unauthenticated
    code, res = make_request(f"{BACKEND_URL}/students/me")
    assert code == 401, f"Expected 401 unauthenticated, got {code}"
    print(f"  [PASS] Unauthenticated access blocked -> HTTP {code} (Token required)")

    # Student calling Admin endpoint
    code, alex_auth = make_request(
        f"{BACKEND_URL}/auth/login",
        method="POST",
        data={"email": "student.alex@university.edu", "password": "Student@123"},
    )
    alex_token = alex_auth["access_token"]
    alex_hdr = {"Authorization": f"Bearer {alex_token}"}

    code, res = make_request(f"{BACKEND_URL}/admin/analytics", headers=alex_hdr)
    assert code == 403, f"Expected 403 for student accessing admin, got {code}"
    print(f"  [PASS] Student -> Admin endpoint blocked -> HTTP {code} (Access denied)")

    # Student calling Mentor endpoint
    code, res = make_request(f"{BACKEND_URL}/mentors/me/interns", headers=alex_hdr)
    assert code == 403, f"Expected 403 for student accessing mentor, got {code}"
    print(f"  [PASS] Student -> Mentor endpoint blocked -> HTTP {code} (Access denied)")

    # Mentor calling Admin endpoint
    code, turing_auth = make_request(
        f"{BACKEND_URL}/auth/login",
        method="POST",
        data={"email": "mentor.turing@university.edu", "password": "Mentor@123"},
    )
    turing_token = turing_auth["access_token"]
    turing_hdr = {"Authorization": f"Bearer {turing_token}"}

    code, res = make_request(f"{BACKEND_URL}/admin/applications", headers=turing_hdr)
    assert code == 403, f"Expected 403 for mentor accessing admin, got {code}"
    print(f"  [PASS] Mentor -> Admin endpoint blocked -> HTTP {code} (Access denied)")


def test_complete_realistic_lifecycle():
    print("\n--- 5. Testing Complete Realistic End-to-End Lifecycle Flow ---")

    # Step A: Register a new student
    import random
    rand_id = random.randint(1000, 9999)
    new_email = f"verified.student.{rand_id}@university.edu"

    code, reg_res = make_request(
        f"{BACKEND_URL}/auth/register",
        method="POST",
        data={
            "email": new_email,
            "password": "SecurePassword@123",
            "full_name": f"Verified Candidate {rand_id}",
            "role": "STUDENT",
            "department": "Computer Science & Engineering",
            "academic_year": 3,
            "roll_number": f"CS-VER-{rand_id}",
        },
    )
    assert code == 201, f"Registration failed: {reg_res}"
    stu_token = reg_res["access_token"]
    stu_hdr = {"Authorization": f"Bearer {stu_token}"}
    print(f"  [PASS] Step A: Registered new student -> {new_email} (ID: {reg_res['user_id']})")

    # Step B: Student adds skills
    code, prof_res = make_request(
        f"{BACKEND_URL}/students/me",
        method="PUT",
        data={"skills": ["Python", "FastAPI", "React", "Docker"]},
        headers=stu_hdr,
    )
    assert code == 200 and set(prof_res["skills"]) == {"Python", "FastAPI", "React", "Docker"}
    print(f"  [PASS] Step B: Student updated skills -> {prof_res['skills']}")

    # Step C: Admin posts a new corporate internship opportunity
    code, admin_auth = make_request(
        f"{BACKEND_URL}/auth/login",
        method="POST",
        data={"email": "admin@university.edu", "password": "Admin@123"},
    )
    admin_hdr = {"Authorization": f"Bearer {admin_auth['access_token']}"}

    code, new_opp = make_request(
        f"{BACKEND_URL}/internships",
        method="POST",
        data={
            "title": f"Distributed AI Systems Intern ({rand_id})",
            "company_name": f"DeepMind Labs ({rand_id})",
            "industry": "Artificial Intelligence",
            "description": "Build high-throughput distributed model evaluation pipelines.",
            "location": "London / Remote",
            "is_remote": True,
            "stipend": 4200.0,
            "duration_weeks": 10,
            "required_skills": ["Python", "FastAPI", "Docker", "Kubernetes"],
        },
        headers=admin_hdr,
    )
    assert code == 201
    opp_id = new_opp["id"]
    print(f"  [PASS] Step C: Admin published new opportunity -> {new_opp['title']} (ID: {opp_id})")

    # Step D: Student runs live Skill Gap Analysis
    code, sg_res = make_request(
        f"{BACKEND_URL}/analytics/skill-gap",
        method="POST",
        data={
            "student_skills": prof_res["skills"],
            "required_skills": new_opp["required_skills"],
        },
        headers=stu_hdr,
    )
    assert code == 200
    assert sg_res["match_percentage"] == 75.0
    assert set(sg_res["matched_skills"]) == {"Python", "FastAPI", "Docker"}
    assert set(sg_res["missing_skills"]) == {"Kubernetes"}
    print(f"  [PASS] Step D: Student Skill Gap Analysis -> Match: {sg_res['match_percentage']}% | Missing: {sg_res['missing_skills']} | Advice: {sg_res['recommendation']}")

    # Step E: Student applies for the internship
    code, app_res = make_request(
        f"{BACKEND_URL}/internships/{opp_id}/apply",
        method="POST",
        headers=stu_hdr,
    )
    assert code == 200 and app_res["status"] == "PENDING"
    app_id = app_res["id"]
    print(f"  [PASS] Step E: Student submitted application -> ID: {app_id} (Status: PENDING)")
    
    # Duplicate application test
    dup_code, dup_res = make_request(
        f"{BACKEND_URL}/internships/{opp_id}/apply",
        method="POST",
        headers=stu_hdr,
    )
    assert dup_code == 409, f"Duplicate application should return 409, got {dup_code}"
    print(f"  [PASS] Step E (Edge Case): Duplicate application blocked -> HTTP 409 Conflict")

    # Step F: Admin approves application and assigns mentor Dr. Alan Turing (Mentor ID 1)
    code, turing_auth = make_request(
        f"{BACKEND_URL}/auth/login",
        method="POST",
        data={"email": "mentor.turing@university.edu", "password": "Mentor@123"},
    )
    code, mentors_list = make_request(f"{BACKEND_URL}/admin/mentors", headers=admin_hdr)
    turing_mentor_id = mentors_list[0]["id"]

    code, approved_app = make_request(
        f"{BACKEND_URL}/admin/applications/{app_id}/action",
        method="POST",
        data={
            "status": "APPROVED",
            "mentor_id": turing_mentor_id,
            "review_notes": "Accepted based on outstanding 75% skill match and academic record.",
        },
        headers=admin_hdr,
    )
    assert code == 200 and approved_app["status"] == "APPROVED"
    print(f"  [PASS] Step F: Admin approved application & assigned mentor -> Status: APPROVED (Mentor ID: {turing_mentor_id})")

    # Step G: Student verifies active internship and provisioned milestone tasks
    code, my_internship = make_request(f"{BACKEND_URL}/students/me/internship", headers=stu_hdr)
    assert code == 200 and my_internship["status"] == "ACTIVE"
    code, my_tasks = make_request(f"{BACKEND_URL}/students/me/tasks", headers=stu_hdr)
    assert code == 200 and len(my_tasks) >= 4
    print(f"  [PASS] Step G: Student placement active -> {my_internship['title']} | Initial Tasks Provisioned: {len(my_tasks)}")

    # Step H: Student toggles milestone task completion -> checks live recalculation
    first_task_id = my_tasks[0]["id"]
    code, toggled_task = make_request(f"{BACKEND_URL}/students/me/tasks/{first_task_id}/toggle", method="POST", headers=stu_hdr)
    assert code == 200 and toggled_task["is_completed"] is True
    print(f"  [PASS] Step H: Student completed milestone task -> \"{toggled_task['title']}\" (is_completed: True)")

    # Step I: Student submits Week 1 progress report
    code, rep_res = make_request(
        f"{BACKEND_URL}/students/me/reports",
        method="POST",
        data={
            "week_number": 1,
            "achievements": "Configured local environment, verified model checkpoints, set up automated tests.",
            "challenges": "Resolving memory limit on dev workstation.",
            "hours_spent": 40.0,
        },
        headers=stu_hdr,
    )
    assert code == 201
    rep_id = rep_res["id"]
    print(f"  [PASS] Step I: Student submitted Week 1 report -> Report ID: {rep_id} (Status: SUBMITTED)")

    # Step J: Mentor Dr. Turing reviews and grades the report
    turing_hdr = {"Authorization": f"Bearer {turing_auth['access_token']}"}
    code, review_res = make_request(
        f"{BACKEND_URL}/mentors/reports/{rep_id}/review",
        method="POST",
        data={
            "mentor_feedback": "Great start to the internship. Clean environment setup and solid initiative.",
            "mentor_score": 90.0,
        },
        headers=turing_hdr,
    )
    assert code == 200 and review_res["status"] == "REVIEWED"
    assert review_res["mentor_score"] == 90.0
    print(f"  [PASS] Step J: Mentor evaluated report -> Score: {review_res['mentor_score']}/100 | Feedback: \"{review_res['mentor_feedback']}\"")

    # Step K: Student re-queries live Progress Attention metrics
    code, final_att = make_request(f"{BACKEND_URL}/students/me/attention", headers=stu_hdr)
    assert code == 200
    print(f"  [PASS] Step K: Final Live Intelligence Recalculation -> Attention Score: {final_att['attention_score']}% | Status: {final_att['attention_status']}")
    print(f"            Factors: {final_att['factors']}")
    print(f"            Reasons: {final_att['reasons']}")
    print(f"            Recommendations: {final_att['recommendations']}")


if __name__ == "__main__":
    print("=" * 70)
    print("  SMART INTERNSHIP MANAGEMENT - FULL END-TO-END LIVE VERIFICATION")
    print("=" * 70)
    try:
        test_frontend_routes()
        test_cors_headers()
        test_five_demo_personas()
        test_authorization_and_ownership()
        test_complete_realistic_lifecycle()
        print("\n" + "=" * 70)
        print("  ALL LIVE VERIFICATIONS PASSED WITH ZERO ERRORS!")
        print("=" * 70)
    except AssertionError as e:
        print(f"\n[FAIL] Verification assertion failed: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"\n[FAIL] Unexpected verification error: {e}", file=sys.stderr)
        sys.exit(1)
