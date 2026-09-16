from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_admin, get_current_student, get_current_user
from backend.app.models import (
    Application,
    Company,
    Internship,
    InternshipSkill,
    Mentor,
    Student,
    User,
)
from backend.app.schemas import (
    ApplicationCreate,
    ApplicationOut,
    InternshipCreate,
    InternshipOut,
)

router = APIRouter(prefix="/internships", tags=["Internships"])


def format_internship_out(internship: Internship) -> InternshipOut:
    company_name = internship.company.name if internship.company else "Unknown Company"
    mentor_name = internship.mentor.user.full_name if internship.mentor and internship.mentor.user else None
    student_name = internship.student.user.full_name if internship.student and internship.student.user else None
    skills = [s.skill_name for s in internship.skills]

    return InternshipOut(
        id=internship.id,
        title=internship.title,
        company_id=internship.company_id,
        company_name=company_name,
        location=internship.location,
        is_remote=internship.is_remote,
        stipend=internship.stipend,
        duration_weeks=internship.duration_weeks,
        status=internship.status,
        description=internship.description,
        required_skills=skills,
        mentor_id=internship.mentor_id,
        mentor_name=mentor_name,
        student_id=internship.student_id,
        student_name=student_name,
        created_at=internship.created_at,
    )


@router.get("", response_model=List[InternshipOut])
def list_internships(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Lists internships with optional status and search filters."""
    query = db.query(Internship)

    if status_filter:
        query = query.filter(Internship.status == status_filter.upper())

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Internship.title.ilike(search_pattern)) | (Internship.description.ilike(search_pattern))
        )

    internships = query.order_by(Internship.created_at.desc()).all()
    return [format_internship_out(i) for i in internships]


@router.get("/{internship_id}", response_model=InternshipOut)
def get_internship_details(internship_id: int, db: Session = Depends(get_db)):
    """Fetches details for a specific internship."""
    internship = db.query(Internship).filter(Internship.id == internship_id).first()
    if not internship:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Internship not found")
    return format_internship_out(internship)


@router.post("", response_model=InternshipOut, status_code=status.HTTP_201_CREATED)
def create_internship(
    payload: InternshipCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Creates a new internship opportunity (Admin only)."""
    # Find or create company
    company = db.query(Company).filter(Company.name == payload.company_name).first()
    if not company:
        company = Company(
            name=payload.company_name,
            industry=payload.industry,
        )
        db.add(company)
        db.flush()

    new_internship = Internship(
        title=payload.title,
        company_id=company.id,
        description=payload.description,
        location=payload.location,
        is_remote=payload.is_remote,
        stipend=payload.stipend,
        duration_weeks=payload.duration_weeks,
        status="AVAILABLE",
    )
    db.add(new_internship)
    db.flush()

    for skill in payload.required_skills:
        clean_skill = skill.strip()
        if clean_skill:
            db.add(InternshipSkill(internship_id=new_internship.id, skill_name=clean_skill))

    db.commit()
    db.refresh(new_internship)
    return format_internship_out(new_internship)


@router.post("/{internship_id}/apply", response_model=ApplicationOut)
def apply_to_internship(
    internship_id: int,
    db: Session = Depends(get_db),
    student_ctx=Depends(get_current_student),
):
    """Submits an application for the specified internship (Student only)."""
    _, student = student_ctx

    internship = db.query(Internship).filter(Internship.id == internship_id).first()
    if not internship:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Internship not found")

    if internship.status not in ["AVAILABLE", "OPEN"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Internship is currently {internship.status} and not accepting applications",
        )

    # Check if student has already applied
    existing_app = (
        db.query(Application)
        .filter(Application.student_id == student.id, Application.internship_id == internship_id)
        .first()
    )
    if existing_app:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already applied for this internship position",
        )

    app = Application(
        student_id=student.id,
        internship_id=internship.id,
        status="PENDING",
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    return ApplicationOut(
        id=app.id,
        student_id=student.id,
        student_name=student.user.full_name,
        student_email=student.user.email,
        internship_id=internship.id,
        internship_title=internship.title,
        company_name=internship.company.name if internship.company else "Unknown",
        status=app.status,
        applied_at=app.applied_at,
        reviewed_at=app.reviewed_at,
        review_notes=app.review_notes,
    )
