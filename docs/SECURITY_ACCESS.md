# Security & Access Control Specification

**Project:** Smart Internship Management & Monitoring System  
**Security Level:** Enterprise Institutional Grade  
**Version:** 1.0.0  

---

## 1. Roles & Permissions Matrix

The system enforces three primary roles:
- `STUDENT`: Enrolled university student seeking, applying for, or completing an internship.
- `MENTOR`: Faculty supervisor or industry mentor overseeing assigned interns.
- `ADMIN`: University placement coordinator or system administrator with institutional authority.

### 1.1 Explicit Role-Action Matrix

| Action | Student | Mentor | Admin | Enforcement Mechanism |
| :--- | :---: | :---: | :---: | :--- |
| **View own profile** | **YES** | **YES** | **YES** | Server-side JWT token identity |
| **Edit own profile** | **YES** | **YES** | **YES** | Server-side user identity check |
| **Browse available internships** | **YES** | **YES** | **YES** | Public authenticated endpoint |
| **Run skill gap analysis** | **YES** | **YES** | **YES** | Pure stateless calculation |
| **Apply for internship** | **YES** | **NO** | **NO** | Role guard: `STUDENT` |
| **View own applications** | **YES** | **NO** | **YES** | Ownership check: `student_id == current_user.student.id` |
| **Submit weekly report** | **YES** | **NO** | **NO** | Ownership check: intern assigned to internship |
| **Toggle task completion** | **YES** | **NO** | **NO** | Ownership check: task belongs to active internship |
| **View assigned interns** | **NO** | **YES** | **YES** | Mentor assignment check: `mentor_id == current_user.mentor.id` |
| **Review intern report** | **NO** | **YES** | **YES** | Mentor assignment check |
| **Provide feedback & score** | **NO** | **YES** | **YES** | Mentor assignment check |
| **Create new internship** | **NO** | **NO** | **YES** | Role guard: `ADMIN` |
| **Approve/Reject application** | **NO** | **NO** | **YES** | Role guard: `ADMIN` |
| **Assign mentor to intern** | **NO** | **NO** | **YES** | Role guard: `ADMIN` |
| **Manage companies & partners**| **NO** | **NO** | **YES** | Role guard: `ADMIN` |
| **Manage users & accounts** | **NO** | **NO** | **YES** | Role guard: `ADMIN` |
| **View institution analytics** | **NO** | **NO** | **YES** | Role guard: `ADMIN` |

---

## 2. Authentication Architecture

```text
[Registration Request] ──→ [Input Validation] ──→ [bcrypt Hash (12 rounds)] ──→ [Database User Row]

[Login Request]        ──→ [Verify Credentials] ──→ [Generate JWT Token] ──→ [Return Bearer Token]
                                                          │
                                         ┌────────────────┴───────────────┐
                                         │ Header: HS256                  │
                                         │ Payload: user_id, role, exp    │
                                         │ Signature: SECRET_KEY          │
                                         └────────────────────────────────┘

[Protected API Call]   ──→ [Extract Bearer Token]
                                  │
                       [Verify Signature & Expiration]
                                  │
                       [Load User & Role Guard Check]
                                  │
                       [Resource Ownership Verification]
                                  │
                       [Execute Business Logic & Return]
```

### 2.1 Cryptographic Standards
- **Password Storage:** Salted and hashed using `bcrypt` (Passlib wrapper) with a work factor of 12 rounds. Plaintext passwords are never stored, logged, or serialized into responses.
- **Token Signing:** JSON Web Tokens (JWT) signed via HMAC-SHA256 (`HS256`).
- **Token Claims:**
  - `sub`: User ID (integer).
  - `role`: Role string (`STUDENT`, `MENTOR`, `ADMIN`).
  - `exp`: Expiration timestamp (default: 24 hours).
  - `iat`: Issued-at timestamp.

---

## 3. Server-Side Authorization & Ownership Enforcement

> [!IMPORTANT]
> Frontend route guards or hidden buttons are for user experience only. **All authorization rules are strictly enforced on the backend server.**

### 3.1 FastAPI Dependency Architecture
FastAPI dependency injection provides reusable security primitives:

```python
# Core Security Dependencies
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Verifies JWT signature and retrieves active user record."""
    ...

def require_role(allowed_roles: List[str]):
    """Enforces that authenticated user possesses one of the allowed roles."""
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient privileges.")
        return current_user
    return role_checker

async def verify_internship_ownership(internship_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Ensures students access only their own internships and mentors access only assigned internships."""
    ...
```

---

## 4. Threat Mitigation & Security Hardening

| Threat Vector | Mitigation Strategy |
| :--- | :--- |
| **SQL Injection** | Parameterized queries enforced automatically by SQLAlchemy 2.0 ORM. Raw string formatting in queries is prohibited. |
| **Cross-Site Scripting (XSS)** | React JSX escapes text by default; strict JSON Content-Type headers on API responses; no `dangerouslySetInnerHTML`. |
| **Broken Access Control** | Every resource query filters by `user_id` or verifies explicit mentor assignment before returning records. |
| **Credential Exposure** | Configuration and secrets loaded strictly from environment variables (`.env`). Default secrets rejected in production mode. |
| **Cross-Origin Attacks (CORS)**| Configurable whitelist origins (`http://localhost:3000` for development; production domain in deployment). `allow_credentials=True` restricted to verified origins. |
| **Denial of Service via Payload** | Strict Pydantic input schemas with explicit length bounds on strings and numeric ranges on integers. |
| **Information Leakage** | Production exceptions return sanitized error messages (e.g. "Resource not found" or "Unauthorized") without leaking database stack traces. |
