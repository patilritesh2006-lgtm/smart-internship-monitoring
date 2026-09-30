from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_student
from backend.app.models import (
    Application,
    Internship,
    Student,
    StudentSkill,
    Task,
    User,
    WeeklyReport,
)
from backend.app.routers.internships import format_internship_out
from backend.app.schemas import (
    ApplicationOut,
    InternshipOut,
    ProgressAttentionResponseSchema,
    ProgressFactorBreakdown,
    StudentOut,
    StudentProfileUpdate,
    TaskOut,
    TaskUpdate,
    WeeklyReportCreate,
    WeeklyReportOut,
)
from intelligence.app import evaluate_progress_attention, extract_progress_features

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("/me", response_model=StudentOut)
def get_my_profile(student_ctx=Depends(get_current_student), db: Session = Depends(get_db)):
    """Returns the current student profile and skills."""
    user, student = student_ctx
    skills = [s.skill_name for s in student.skills]
    return StudentOut(
        id=student.id,
        user_id=user.id,
        roll_number=student.roll_number,
        department=student.department,
        academic_year=student.academic_year,
        phone=student.phone,
        full_name=user.full_name,
        email=user.email,
        skills=skills,
    )


@router.put("/me", response_model=StudentOut)
def update_my_profile(
    payload: StudentProfileUpdate,
    student_ctx=Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Updates student profile fields and skills."""
    user, student = student_ctx

    if payload.phone is not None:
        student.phone = payload.phone
    if payload.department is not None:
        student.department = payload.department
    if payload.academic_year is not None:
        student.academic_year = payload.academic_year

    if payload.skills is not None:
        # Replace existing skills
        db.query(StudentSkill).filter(StudentSkill.student_id == student.id).delete()
        seen = set()
        for skill in payload.skills:
            clean = skill.strip()
            if clean and clean.lower() not in seen:
                seen.add(clean.lower())
                db.add(StudentSkill(student_id=student.id, skill_name=clean))

    db.commit()
    db.refresh(student)

    skills = [s.skill_name for s in student.skills]
    return StudentOut(
        id=student.id,
        user_id=user.id,
        roll_number=student.roll_number,
        department=student.department,
        academic_year=student.academic_year,
        phone=student.phone,
        full_name=user.full_name,
        email=user.email,
        skills=skills,
    )


@router.get("/me/internship", response_model=Optional[InternshipOut])
def get_my_active_internship(
    student_ctx=Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Returns the active allocated internship for the student."""
    _, student = student_ctx
    internship = (
        db.query(Internship)
        .filter(Internship.student_id == student.id, Internship.status == "ACTIVE")
        .first()
    )
    if not internship:
        return None
    return format_internship_out(internship)


@router.get("/me/applications", response_model=List[ApplicationOut])
def get_my_applications(
    student_ctx=Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Lists all internship applications submitted by the student."""
    _, student = student_ctx
    apps = (
        db.query(Application)
        .filter(Application.student_id == student.id)
        .order_by(Application.applied_at.desc())
        .all()
    )
    result = []
    for a in apps:
        result.append(
            ApplicationOut(
                id=a.id,
                student_id=student.id,
                student_name=student.user.full_name,
                student_email=student.user.email,
                internship_id=a.internship_id,
                internship_title=a.internship.title if a.internship else "Unknown",
                company_name=a.internship.company.name if a.internship and a.internship.company else "Unknown",
                status=a.status,
                applied_at=a.applied_at,
                reviewed_at=a.reviewed_at,
                review_notes=a.review_notes,
            )
        )
    return result


@router.get("/me/tasks", response_model=List[TaskOut])
def get_my_tasks(
    student_ctx=Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Returns milestone tasks assigned to the student."""
    _, student = student_ctx
    tasks = (
        db.query(Task)
        .filter(Task.student_id == student.id)
        .order_by(Task.is_completed.asc(), Task.created_at.asc())
        .all()
    )
    return tasks


@router.post("/me/tasks/{task_id}/toggle", response_model=TaskOut)
def toggle_task_completion(
    task_id: int,
    student_ctx=Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Toggles completion status for a task assigned to the student."""
    _, student = student_ctx
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    if task.student_id != student.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not own this milestone task",
        )

    task.is_completed = not task.is_completed
    task.completed_at = datetime.now(timezone.utc) if task.is_completed else None
    db.commit()
    db.refresh(task)
    return task


@router.get("/me/reports", response_model=List[WeeklyReportOut])
def get_my_reports(
    student_ctx=Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Lists submitted weekly reports for the student."""
    _, student = student_ctx
    reports = (
        db.query(WeeklyReport)
        .filter(WeeklyReport.student_id == student.id)
        .order_by(WeeklyReport.week_number.asc())
        .all()
    )
    return reports


@router.post("/me/reports", response_model=WeeklyReportOut, status_code=status.HTTP_201_CREATED)
def submit_weekly_report(
    payload: WeeklyReportCreate,
    student_ctx=Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Submits a new weekly progress report."""
    _, student = student_ctx
    internship = (
        db.query(Internship)
        .filter(Internship.student_id == student.id, Internship.status == "ACTIVE")
        .first()
    )
    if not internship:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You do not have an active internship to submit reports for",
        )

    existing = (
        db.query(WeeklyReport)
        .filter(WeeklyReport.student_id == student.id, WeeklyReport.week_number == payload.week_number)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A report for week {payload.week_number} has already been submitted",
        )

    report = WeeklyReport(
        internship_id=internship.id,
        student_id=student.id,
        week_number=payload.week_number,
        achievements=payload.achievements,
        challenges=payload.challenges,
        hours_spent=payload.hours_spent,
        status="SUBMITTED",
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/me/attention", response_model=ProgressAttentionResponseSchema)
def get_my_progress_attention(
    student_ctx=Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Computes live 4-factor progress attention using the Intelligence Engine."""
    _, student = student_ctx
    return compute_student_attention_metrics(student.id, db)


def compute_student_attention_metrics(student_id: int, db: Session) -> ProgressAttentionResponseSchema:
    """Helper to compute real 4-factor progress attention for any student from DB state."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    tasks = db.query(Task).filter(Task.student_id == student_id).all()
    reports = db.query(WeeklyReport).filter(WeeklyReport.student_id == student_id).all()
    internship = (
        db.query(Internship)
        .filter(Internship.student_id == student_id, Internship.status == "ACTIVE")
        .first()
    )

    now = datetime.now(timezone.utc)

    # Extract clean, typed features from database records (no double-counting)
    features = extract_progress_features(
        tasks=tasks,
        reports=reports,
        internship=internship,
        now=now,
    )

    # Evaluate progress health through the Hybrid Intelligence Engine (deterministic + ML early-warning)
    try:
        from intelligence.app.ml import evaluate_hybrid_attention
        hybrid_result = evaluate_hybrid_attention(features)
        att_score = float(hybrid_result["attention_score"])
        att_status = str(hybrid_result["attention_status"])
        eval_reasons = hybrid_result["reasons"]
        eval_recommendations = hybrid_result["recommendations"]
        health_score = float(hybrid_result["progress_health_score"])
        trend_val = str(hybrid_result["progress_trend"])
        risk_prob = hybrid_result.get("risk_probability")
        risk_lbl = hybrid_result.get("risk_label")
        mod_version = hybrid_result.get("model_version")
        mod_available = hybrid_result.get("model_available", False)
        top_factors = hybrid_result.get("top_risk_factors")
    except Exception:
        # Transparent fallback to deterministic engine if ML is unavailable
        engine_result = evaluate_progress_attention(features)
        att_score = float(engine_result.score)
        att_status = str(engine_result.status)
        eval_reasons = engine_result.reasons
        eval_recommendations = engine_result.recommendations
        health_score = float(engine_result.score)
        trend_val = features.progress_trend.value
        risk_prob = None
        risk_lbl = None
        mod_version = None
        mod_available = False
        top_factors = None

    # Mentor feedback float for factors breakdown
    mf_val = features.mentor_feedback if features.mentor_feedback is not None else 75.0

    return ProgressAttentionResponseSchema(
        attention_score=att_score,
        attention_status=att_status,
        factors=ProgressFactorBreakdown(
            progress_consistency=float(features.activity_consistency),
            task_completion=float(features.task_completion),
            report_submission=float(features.report_submission),
            mentor_feedback=float(mf_val),
            attendance_rate=features.attendance_rate,
            task_velocity=float(features.task_velocity),
            report_punctuality=float(features.report_punctuality) if features.report_punctuality is not None else None,
            days_since_last_activity=features.days_since_last_activity,
            activity_consistency=float(features.activity_consistency),
            progress_trend=trend_val,
            days_remaining=features.days_remaining,
        ),
        reasons=eval_reasons,
        recommendations=eval_recommendations,
        progress_health_score=health_score,
        progress_trend=trend_val,
        risk_probability=risk_prob,
        risk_label=risk_lbl,
        model_version=mod_version,
        model_available=mod_available,
        top_risk_factors=top_factors,
    )
