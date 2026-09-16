from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_user
from backend.app.core.security import create_access_token, hash_password, verify_password
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
    if role_upper not in ["STUDENT", "MENTOR", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be one of: STUDENT, MENTOR, ADMIN",
        )

    new_user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=role_upper,
        is_active=True,
    )
    db.add(new_user)
    db.flush()

    if role_upper == "STUDENT":
        roll_num = payload.roll_number or f"STU-{new_user.id:04d}"
        student = Student(
            user_id=new_user.id,
            roll_number=roll_num,
            department=payload.department or "Computer Science & Engineering",
            academic_year=payload.academic_year or 3,
        )
        db.add(student)
    elif role_upper == "MENTOR":
        emp_id = payload.employee_id or f"EMP-{new_user.id:04d}"
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
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Authenticates user credentials and returns JWT access token."""
    user = db.query(User).filter(User.email == payload.email).first()
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

    token = create_access_token(subject=user.email, role=user.role)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
    )


@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Returns the authenticated user profile."""
    return current_user
