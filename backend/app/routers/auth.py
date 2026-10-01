import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_user
from backend.app.core.security import create_access_token, hash_password, verify_password
from backend.app.core.seed import ensure_unique_mentor_ids, generate_next_mentor_id
from backend.app.models import Mentor, Student, User
from backend.app.schemas import TokenResponse, UserLogin, UserOut, UserRegister

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    """Registers a new user (Student, Mentor, or Admin) and returns access token."""
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    role_upper = payload.role.upper()
    # Security: Enforce EXACTLY ONE ADMIN Rule.
    # Admin registration is strictly forbidden.
    if role_upper == "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Admin registration is forbidden. The system permits exactly one administrative account.",
        )

    if role_upper not in ["STUDENT", "MENTOR"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Public registration supports Student and Mentor roles only. Contact your administrator for elevated access.",
        )

    if role_upper == "MENTOR":
        ensure_unique_mentor_ids(db)

    new_user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=role_upper,
        is_active=True,
    )
    db.add(new_user)
    db.flush()

    assigned_mentor_id = None
    if role_upper == "STUDENT":
        roll_num = payload.roll_number or f"STU-{new_user.id:04d}"
        if db.query(Student).filter(Student.roll_number == roll_num).first():
            roll_num = f"STU-{new_user.id:04d}"
        student = Student(
            user_id=new_user.id,
            roll_number=roll_num,
            department=payload.department or "Computer Science & Engineering",
            academic_year=payload.academic_year or 3,
        )
        db.add(student)
    elif role_upper == "MENTOR":
        candidate_id = (payload.employee_id or "").strip().upper()
        if (
            re.match(r"^MNT-\d{3,}$", candidate_id)
            and not db.query(Mentor).filter(Mentor.employee_id == candidate_id).first()
        ):
            emp_id = candidate_id
        else:
            emp_id = generate_next_mentor_id(db)
        assigned_mentor_id = emp_id
        mentor = Mentor(
            user_id=new_user.id,
            department=payload.department or "Computer Science & Engineering",
            designation=payload.designation or "Assistant Professor",
            employee_id=emp_id,
        )
        db.add(mentor)

    db.commit()

    token = create_access_token(subject=new_user.email, role=new_user.role)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name,
        role=new_user.role,
        mentor_id=assigned_mentor_id,
        employee_id=assigned_mentor_id,
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Authenticates user credentials and returns JWT access token."""
    user = db.query(User).filter(User.email == payload.email).first()
    # Seamless support for demo admin alias mapping to the single admin account
    if not user and payload.email.lower() in ["admin@demo.com", "admin@university.edu"]:
        user = db.query(User).filter(User.role == "ADMIN").first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact your administrator.",
        )

    mentor_code = None
    if user.role == "MENTOR":
        ensure_unique_mentor_ids(db)
        db.refresh(user)
        if user.mentor_profile:
            mentor_code = user.mentor_profile.employee_id

    token = create_access_token(subject=user.email, role=user.role)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        mentor_id=mentor_code,
        employee_id=mentor_code,
    )


@router.get("/me", response_model=UserOut)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns the authenticated user profile."""
    mentor_code = None
    if current_user.role == "MENTOR":
        ensure_unique_mentor_ids(db)
        if current_user.mentor_profile:
            mentor_code = current_user.mentor_profile.employee_id
    return UserOut(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        mentor_id=mentor_code,
        employee_id=mentor_code,
    )
