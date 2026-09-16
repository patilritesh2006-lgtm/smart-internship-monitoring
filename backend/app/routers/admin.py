from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_admin
from backend.app.models import (
    Application,
    Internship,
    Mentor,
    Student,
    Task,
    User,
)
from backend.app.routers.students import compute_student_attention_metrics
from backend.app.schemas import (
    ApplicationOut,
    ApplicationReview,
    InstitutionalAnalyticsSchema,
    MentorOut,
)

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/applications", response_model=List[ApplicationOut])
def list_applications(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Lists all internship applications submitted across the system."""
    apps = db.query(Application).order_by(Application.applied_at.desc()).all()
    out = []
    for a in apps:
        student_name = a.student.user.full_name if a.student and a.student.user else "Unknown Student"
        student_email = a.student.user.email if a.student and a.student.user else ""
        internship_title = a.internship.title if a.internship else "Unknown Position"
        company_name = a.internship.company.name if a.internship and a.internship.company else "Unknown Company"

        out.append(
            ApplicationOut(
                id=a.id,
                student_id=a.student_id,
                student_name=student_name,
                student_email=student_email,
                internship_id=a.internship_id,
                internship_title=internship_title,
                company_name=company_name,
                status=a.status,
                applied_at=a.applied_at,
                reviewed_at=a.reviewed_at,
                review_notes=a.review_notes,
            )
        )
    return out


@router.post("/applications/{app_id}/action", response_model=ApplicationOut)
def review_application(
    app_id: int,
    payload: ApplicationReview,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Approves or rejects an internship application and allocates mentor/internship."""
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    status_upper = payload.status.upper()
    if status_upper not in ["APPROVED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Status must be APPROVED or REJECTED")

    app.status = status_upper
    app.reviewed_at = datetime.now(timezone.utc)
    app.review_notes = payload.review_notes

    internship = db.query(Internship).filter(Internship.id == app.internship_id).first()

    if status_upper == "APPROVED" and internship:
        internship.student_id = app.student_id
        internship.status = "ACTIVE"
        internship.start_date = datetime.now(timezone.utc)

        if payload.mentor_id:
            internship.mentor_id = payload.mentor_id

        # Automatically provision initial milestone tasks for the newly approved student
        existing_tasks = db.query(Task).filter(Task.internship_id == internship.id).count()
        if existing_tasks == 0:
            initial_milestones = [
                "Complete company onboarding and security orientation",
                "Set up local development and repository environment",
                "Review project architecture documentation and backlog",
                "Implement first sprint feature milestone",
                "Conduct code review and submit Week 1 progress report",
            ]
            for title in initial_milestones:
                db.add(
                    Task(
                        internship_id=internship.id,
                        student_id=app.student_id,
                        title=title,
                        is_completed=False,
                    )
                )

    db.commit()
    db.refresh(app)

    return ApplicationOut(
        id=app.id,
        student_id=app.student_id,
        student_name=app.student.user.full_name,
        student_email=app.student.user.email,
        internship_id=app.internship_id,
        internship_title=app.internship.title if app.internship else "Unknown",
        company_name=app.internship.company.name if app.internship and app.internship.company else "Unknown",
        status=app.status,
        applied_at=app.applied_at,
        reviewed_at=app.reviewed_at,
        review_notes=app.review_notes,
    )


@router.get("/mentors", response_model=List[MentorOut])
def list_mentors(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Lists faculty mentors for allocation selection."""
    mentors = db.query(Mentor).all()
    out = []
    for m in mentors:
        out.append(
            MentorOut(
                id=m.id,
                user_id=m.user_id,
                department=m.department,
                designation=m.designation,
                employee_id=m.employee_id,
                full_name=m.user.full_name if m.user else "Unknown",
                email=m.user.email if m.user else "",
            )
        )
    return out


@router.get("/analytics", response_model=InstitutionalAnalyticsSchema)
def get_institutional_analytics(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Computes institution-wide metrics and cohort attention distribution."""
    total_students = db.query(Student).count()
    total_internships = db.query(Internship).count()
    active_internships = db.query(Internship).filter(Internship.status == "ACTIVE").count()
    pending_applications = db.query(Application).filter(Application.status == "PENDING").count()

    active_interns = (
        db.query(Student)
        .join(Internship, Internship.student_id == Student.id)
        .filter(Internship.status == "ACTIVE")
        .all()
    )

    on_track_count = 0
    monitor_count = 0
    needs_attention_count = 0
    scores = []

    for s in active_interns:
        try:
            metrics = compute_student_attention_metrics(s.id, db)
            scores.append(metrics.attention_score)
            if metrics.attention_status == "ON_TRACK":
                on_track_count += 1
            elif metrics.attention_status == "MONITOR":
                monitor_count += 1
            elif metrics.attention_status == "NEEDS_ATTENTION":
                needs_attention_count += 1
        except Exception:
            continue

    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0

    return InstitutionalAnalyticsSchema(
        total_students=total_students,
        total_internships=total_internships,
        active_internships=active_internships,
        pending_applications=pending_applications,
        on_track_count=on_track_count,
        monitor_count=monitor_count,
        needs_attention_count=needs_attention_count,
        average_attention_score=avg_score,
    )
