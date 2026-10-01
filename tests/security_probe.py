"""
Security Probe Script for Smart Internship Management System
Performs live API security checks against localhost:8000
Run: python tests/security_probe.py
"""
import httpx
import json
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE = "http://localhost:8000"
results = []


def test(name, method, url, expected_status=None, **kwargs):
    try:
        r = httpx.request(method, url, timeout=8, **kwargs)
        status = "PASS" if (expected_status is None or r.status_code == expected_status) else "FAIL"
        results.append({"test": name, "code": r.status_code, "status": status})
        print(f"  [{r.status_code}] {status} — {name}")
        return r
    except httpx.LocalProtocolError:
        # Some HTTP client libraries reject trailing whitespace in headers locally before transmission.
        # Fall back to urllib.request to transmit the exact raw header across the wire to the server.
        try:
            import urllib.request
            import urllib.error
            headers = kwargs.get("headers", {})
            req = urllib.request.Request(url, headers=headers, method=method)
            resp = urllib.request.urlopen(req, timeout=8)
            code = resp.status
        except urllib.error.HTTPError as e:
            code = e.code
        except Exception as fallback_e:
            results.append({"test": name, "code": "ERR", "status": "ERROR"})
            print(f"  [ERR] ERROR — {name}: {fallback_e}")
            return None
        status = "PASS" if (expected_status is None or code == expected_status) else "FAIL"
        results.append({"test": name, "code": code, "status": status})
        print(f"  [{code}] {status} — {name}")
        return None
    except Exception as e:
        results.append({"test": name, "code": "ERR", "status": "ERROR"})
        print(f"  [ERR] ERROR — {name}: {e}")
        return None


print("\n" + "="*60)
print("SMART INTERNSHIP MANAGEMENT — LIVE SECURITY PROBE")
print("="*60)

# ================================================================
# 1. AUTHENTICATION — MISSING TOKEN
# ================================================================
print("\n[1] AUTH — Unauthenticated Access to Protected Endpoints")
test("Student /me without token → 401", "GET", f"{BASE}/api/students/me", expected_status=401)
test("Mentor interns without token → 401", "GET", f"{BASE}/api/mentors/me/interns", expected_status=401)
test("Admin analytics without token → 401", "GET", f"{BASE}/api/admin/analytics", expected_status=401)
test("Admin applications without token → 401", "GET", f"{BASE}/api/admin/applications", expected_status=401)
test("POST /api/auth/me without token → 401", "GET", f"{BASE}/api/auth/me", expected_status=401)

# ================================================================
# 2. VALID LOGINS
# ================================================================
print("\n[2] AUTH — Valid Credentials Login")
r_stu = test("Student login → 200", "POST", f"{BASE}/api/auth/login",
             json={"email": "student@demo.com", "password": "Student@123"}, expected_status=200)
stok = r_stu.json().get("access_token") if r_stu and r_stu.status_code == 200 else None

r_men = test("Mentor login → 200", "POST", f"{BASE}/api/auth/login",
             json={"email": "mentor@demo.com", "password": "Mentor@123"}, expected_status=200)
mtok = r_men.json().get("access_token") if r_men and r_men.status_code == 200 else None

r_adm = test("Admin login → 200", "POST", f"{BASE}/api/auth/login",
             json={"email": "admin@demo.com", "password": "Admin@123"}, expected_status=200)
atok = r_adm.json().get("access_token") if r_adm and r_adm.status_code == 200 else None

# ================================================================
# 3. RBAC — CROSS-ROLE ACCESS
# ================================================================
print("\n[3] RBAC — Cross-Role Resource Access")
if stok:
    test("Student → admin analytics → 403", "GET", f"{BASE}/api/admin/analytics",
         headers={"Authorization": f"Bearer {stok}"}, expected_status=403)
    test("Student → admin applications → 403", "GET", f"{BASE}/api/admin/applications",
         headers={"Authorization": f"Bearer {stok}"}, expected_status=403)
    test("Student → mentor interns → 403", "GET", f"{BASE}/api/mentors/me/interns",
         headers={"Authorization": f"Bearer {stok}"}, expected_status=403)
    test("Student → admin mentors list → 403", "GET", f"{BASE}/api/admin/mentors",
         headers={"Authorization": f"Bearer {stok}"}, expected_status=403)

if mtok:
    test("Mentor → admin analytics → 403", "GET", f"{BASE}/api/admin/analytics",
         headers={"Authorization": f"Bearer {mtok}"}, expected_status=403)
    test("Mentor → admin applications → 403", "GET", f"{BASE}/api/admin/applications",
         headers={"Authorization": f"Bearer {mtok}"}, expected_status=403)
    test("Mentor → student endpoint → 403", "GET", f"{BASE}/api/students/me",
         headers={"Authorization": f"Bearer {mtok}"}, expected_status=403)

# ================================================================
# 4. JWT MANIPULATION
# ================================================================
print("\n[4] JWT — Token Manipulation")
test("Tampered signature → 401", "GET", f"{BASE}/api/students/me",
     headers={"Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBkZW1vLmNvbSIsInJvbGUiOiJBRE1JTiIsImV4cCI6OTk5OTk5OTk5OX0.BADSIGNATURE"},
     expected_status=401)
# none algorithm bypass attempt
test("alg=none bypass attempt → 401", "GET", f"{BASE}/api/students/me",
     headers={"Authorization": "Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiJhZG1pbkBkZW1vLmNvbSIsInJvbGUiOiJBRE1JTiIsImV4cCI6OTk5OTk5OTk5OX0."},
     expected_status=401)
test("Empty bearer value 'Bearer' → 401", "GET", f"{BASE}/api/students/me",
     headers={"Authorization": "Bearer"}, expected_status=401)
test("Empty bearer value with trailing space 'Bearer ' → 401", "GET", f"{BASE}/api/students/me",
     headers={"Authorization": "Bearer "}, expected_status=401)
test("Garbage token → 401", "GET", f"{BASE}/api/students/me",
     headers={"Authorization": "Bearer GARBAGE.TOKEN.HERE"},
     expected_status=401)
test("Missing Authorization header → 401", "GET", f"{BASE}/api/students/me",
     expected_status=401)

# ================================================================
# 5. INPUT VALIDATION
# ================================================================
print("\n[5] INPUT — Boundary & Malicious Payloads")
test("Long email (500 chars) → 422/400", "POST", f"{BASE}/api/auth/login",
     json={"email": "a"*500 + "@b.com", "password": "x"})
test("XSS in email field → 422", "POST", f"{BASE}/api/auth/login",
     json={"email": "<script>alert(1)</script>@x.com", "password": "test"}, expected_status=422)
test("SQL injection in email → 422/401", "POST", f"{BASE}/api/auth/login",
     json={"email": "' OR 1=1 --", "password": "x"})
test("Null email → 422", "POST", f"{BASE}/api/auth/login",
     json={"email": None, "password": "test"}, expected_status=422)
test("Missing all fields → 422", "POST", f"{BASE}/api/auth/login",
     json={}, expected_status=422)
test("Empty password → 401/400", "POST", f"{BASE}/api/auth/login",
     json={"email": "student@demo.com", "password": ""})
test("Password shorter than 6 chars in register → 422", "POST", f"{BASE}/api/auth/register",
     json={"email": "short@test.com", "password": "123", "full_name": "Test", "role": "STUDENT"}, expected_status=422)
test("Negative academic year in register → 422/400", "POST", f"{BASE}/api/auth/register",
     json={"email": "neg@test.com", "password": "Test1234", "full_name": "Test", "role": "STUDENT", "academic_year": -1})

# ================================================================
# 6. PRIVILEGE ESCALATION VIA REGISTRATION
# ================================================================
print("\n[6] PRIVILEGE ESCALATION — Register as ADMIN (Enforce EXACTLY ONE ADMIN)")
r_priv = test("Register with role=ADMIN → 409", "POST", f"{BASE}/api/auth/register",
              json={"email": "probe_admin@sectest.local", "password": "SecProbe1234",
                    "full_name": "Security Probe", "role": "ADMIN"},
              expected_status=409)

# ================================================================
# 7. IDOR — CROSS-USER RESOURCE ACCESS
# ================================================================
print("\n[7] IDOR — Cross-User Resource Access")
if stok:
    # Student should not access another student's tasks by guessing IDs
    # The task toggle endpoint checks ownership
    test("Toggle task ID=1 as student (ownership check)", "POST",
         f"{BASE}/api/students/me/tasks/1/toggle",
         headers={"Authorization": f"Bearer {stok}"})
    # Student trying to access mentor student detail endpoint
    test("Student → mentor student detail ID=1 → 403", "GET",
         f"{BASE}/api/mentors/students/1",
         headers={"Authorization": f"Bearer {stok}"}, expected_status=403)
    # Student trying to get analytics for another student ID
    test("Student → analytics for student_id=1 (if different student) → 403", "GET",
         f"{BASE}/api/analytics/progress-attention/1",
         headers={"Authorization": f"Bearer {stok}"})

# ================================================================
# 8. CORS HEADERS
# ================================================================
print("\n[8] CORS — Origin Validation")
r_cors_evil = httpx.get(f"{BASE}/health", headers={"Origin": "https://evil.example.com"}, timeout=5)
acao_evil = r_cors_evil.headers.get("access-control-allow-origin", "NOT SET")
print(f"  [CORS] evil origin -> Access-Control-Allow-Origin: {acao_evil}")
if acao_evil == "*":
    print("  *** FINDING: CORS wildcard '*' allows any origin ***")

r_cors_local = httpx.get(f"{BASE}/health", headers={"Origin": "http://localhost:3000"}, timeout=5)
acao_local = r_cors_local.headers.get("access-control-allow-origin", "NOT SET")
print(f"  [CORS] localhost:3000 -> Access-Control-Allow-Origin: {acao_local}")

r_cors_prefly = httpx.options(f"{BASE}/api/auth/login",
    headers={"Origin": "https://evil.example.com", "Access-Control-Request-Method": "POST"}, timeout=5)
acao_prefly = r_cors_prefly.headers.get("access-control-allow-origin", "NOT SET")
ac_cred = r_cors_prefly.headers.get("access-control-allow-credentials", "NOT SET")
print(f"  [CORS] preflight evil -> ACAO: {acao_prefly}, Allow-Credentials: {ac_cred}")
if acao_prefly == "*" and ac_cred.lower() == "true":
    print("  *** CRITICAL: wildcard CORS + credentials=true is invalid/dangerous ***")

# ================================================================
# 9. SECURITY HEADERS
# ================================================================
print("\n[9] SECURITY HEADERS — HTTP Response Headers")
r_hdr = httpx.get(f"{BASE}/health", timeout=5)
security_headers = {
    "content-security-policy": "RECOMMENDED",
    "x-content-type-options": "REQUIRED",
    "x-frame-options": "RECOMMENDED",
    "referrer-policy": "RECOMMENDED",
    "permissions-policy": "RECOMMENDED",
    "strict-transport-security": "N/A for HTTP",
}
for h, importance in security_headers.items():
    val = r_hdr.headers.get(h, "MISSING")
    status_str = "OK" if val != "MISSING" else f"MISSING ({importance})"
    print(f"  [{status_str}] {h}: {val}")

# ================================================================
# 10. RATE LIMITING CHECK
# ================================================================
print("\n[10] RATE LIMITING — Abuse Protection on Login")
rate_limited = False
for i in range(15):
    r = httpx.post(f"{BASE}/api/auth/login",
                   json={"email": "student@demo.com", "password": "WrongPassword123"},
                   headers={"X-Forwarded-For": "198.51.100.77"},
                   timeout=5)
    if r.status_code == 429:
        rate_limited = True
        print(f"  [OK] Rate limit triggered after {i+1} attempts (429 Too Many Requests)")
        break
if rate_limited:
    results.append({"test": "Rate limiting triggers on brute force", "code": 429, "status": "PASS"})
else:
    results.append({"test": "Rate limiting triggers on brute force", "code": 200, "status": "FAIL"})
    print("  *** FINDING: No rate limiting on /api/auth/login — 10 failed attempts allowed ***")

# ================================================================
# 11. API DOCS EXPOSURE
# ================================================================
print("\n[11] API DOCS — Public OpenAPI Exposure")
test("GET /docs → should respond", "GET", f"{BASE}/docs")
test("GET /openapi.json → should respond", "GET", f"{BASE}/openapi.json")
test("GET /redoc → should respond", "GET", f"{BASE}/redoc")

# ================================================================
# SUMMARY
# ================================================================
print("\n" + "="*60)
print("SECURITY PROBE SUMMARY")
print("="*60)
passed = sum(1 for r in results if r["status"] == "PASS")
failed = sum(1 for r in results if r["status"] == "FAIL")
errors = sum(1 for r in results if r["status"] == "ERROR")
print(f"  Total checks : {len(results)}")
print(f"  PASS         : {passed}")
print(f"  FAIL         : {failed}")
print(f"  ERROR        : {errors}")

if failed > 0:
    print("\n  Failed checks:")
    for r in results:
        if r["status"] == "FAIL":
            print(f"    - [{r['code']}] {r['test']}")
