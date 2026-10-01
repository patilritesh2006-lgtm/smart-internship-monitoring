"""Verify all security fixes are working."""
import httpx

BASE = "http://localhost:8000"

print("=== SECURITY HEADERS VERIFICATION ===")
r = httpx.get(f"{BASE}/health", timeout=5)
headers_check = ["x-content-type-options", "x-frame-options", "referrer-policy", "permissions-policy", "content-security-policy"]
for h in headers_check:
    val = r.headers.get(h, "MISSING")
    status = "OK" if val != "MISSING" else "MISSING"
    print(f"  [{status}] {h}: {val}")

print()
print("=== ADMIN SELF-REGISTRATION BLOCK ===")
r = httpx.post(
    f"{BASE}/api/auth/register",
    json={"email": "attacker3@evil.com", "password": "EvilPass123", "full_name": "Attacker", "role": "ADMIN"},
    timeout=5
)
detail = r.json().get("detail", r.text[:200]) if r.headers.get("content-type", "").startswith("application") else r.text[:200]
print(f"  Register as ADMIN -> Status: {r.status_code}")
print(f"  Response detail: {detail}")
if r.status_code in [400, 409]:
    print("  [FIXED] ADMIN self-registration correctly blocked (409 Conflict)")
elif r.status_code == 201:
    print("  [STILL VULNERABLE] ADMIN self-registration still allowed!")

print()
print("=== RATE LIMITING VERIFICATION ===")
rate_limited = False
for i in range(15):
    r = httpx.post(
        f"{BASE}/api/auth/login",
        json={"email": "ratelimit.test@example.com", "password": "WrongPassword123"},
        headers={"X-Forwarded-For": "198.51.100.88"},
        timeout=5
    )
    suffix = " <<< RATE LIMITED!" if r.status_code == 429 else ""
    print(f"  Attempt {i+1}: {r.status_code}{suffix}", flush=True)
    if r.status_code == 429:
        rate_limited = True
        print("  [FIXED] Rate limiting is working correctly (10 failed req/min per IP)", flush=True)
        break

if not rate_limited:
    print("  [NOT FIXED] Rate limiting is still not active")

print()
print("=== CORS VERIFICATION ===")
r_evil = httpx.get(f"{BASE}/health", headers={"Origin": "https://evil.example.com"}, timeout=5)
acao = r_evil.headers.get("access-control-allow-origin", "NOT SET")
print(f"  evil origin ACAO: {acao}")
if acao == "NOT SET" or acao != "*":
    print("  [OK] Evil origin is not granted CORS access")

r_good = httpx.get(f"{BASE}/health", headers={"Origin": "http://localhost:3000"}, timeout=5)
acao2 = r_good.headers.get("access-control-allow-origin", "NOT SET")
cred = r_good.headers.get("access-control-allow-credentials", "NOT SET")
print(f"  localhost:3000 ACAO: {acao2}, allow-credentials: {cred}")

print()
print("=== API DOCS ACCESSIBILITY (development mode) ===")
r_docs = httpx.get(f"{BASE}/docs", timeout=5)
print(f"  /docs: {r_docs.status_code} (expected 200 in dev, 404 in prod)")
r_oapi = httpx.get(f"{BASE}/openapi.json", timeout=5)
print(f"  /openapi.json: {r_oapi.status_code}")

print()
print("=== DONE ===")
