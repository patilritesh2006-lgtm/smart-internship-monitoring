from datetime import datetime, timezone
from typing import List, Optional
from urllib.parse import urlparse
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_student
from backend.app.models import (
    Application,
    ExternalMentor,
    ExternalMentorStudent,
    Internship,
    Mentor,
    Notification,
    Student,
    StudentSkill,
    Task,
    User,
    WeeklyReport,
)
from backend.app.routers.internships import (
    build_application_out,
    format_internship_out,
    format_task_out,
)
from backend.app.schemas import (
    ApplicationOut,
    CompanyCoordinatorInfo,
    InternshipOut,
    ProgressAttentionResponseSchema,
    ProgressFactorBreakdown,
    StudentOut,
    StudentProfileUpdate,
    TaskOut,
    TaskUpdate,
    TimesheetTaskSubmission,
    WeeklyReportCreate,
    WeeklyReportOut,
)
from intelligence.app import evaluate_progress_attention, extract_progress_features

router = APIRouter(prefix="/students", tags=["Students"])


def _format_student_profile(user: User, student: Student, db: Session) -> StudentOut:
    skills = [s.skill_name for s in student.skills]
    active_int = (
        db.query(Internship)
        .filter(Internship.student_id == student.id)
        .order_by(Internship.id.asc())
        .first()
    )
    latest_app = (
        db.query(Application)
        .filter(Application.student_id == student.id)
        .order_by(Application.applied_at.desc())
        .first()
    )

    mentor = student.assigned_mentor
    if not mentor and active_int and active_int.mentor:
        mentor = active_int.mentor

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
        mentor_id=mentor.id if mentor else None,
        mentor_code=mentor.employee_id if mentor else None,
        mentor_employee_id=mentor.employee_id if mentor else None,
        mentor_name=mentor.user.full_name if mentor and mentor.user else None,
        mentor_email=mentor.user.email if mentor and mentor.user else None,
        mentor_department=mentor.department if mentor else None,
        mentor_designation=mentor.designation if mentor else None,
        internship_id=active_int.id if active_int else (latest_app.internship_id if latest_app else None),
        internship_title=active_int.title if active_int else (latest_app.internship.title if latest_app and latest_app.internship else None),
        company_name=(
            active_int.company.name
            if active_int and active_int.company
            else (latest_app.internship.company.name if latest_app and latest_app.internship and latest_app.internship.company else None)
        ),
        internship_status=active_int.status if active_int else None,
        application_status=latest_app.status if latest_app else None,
    )


@router.get("/me", response_model=StudentOut)
def get_my_profile(student_ctx=Depends(get_current_student), db: Session = Depends(get_db)):
    """Returns the current student profile, assigned mentor, and skills."""
    user, student = student_ctx
    return _format_student_profile(user, student, db)


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

    return _format_student_profile(user, student, db)


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
        .order_by(Internship.id.asc())
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
    """Lists all internship applications submitted by the student with skill match/gap and tasks."""
    _, student = student_ctx
    apps = (
        db.query(Application)
        .filter(Application.student_id == student.id)
        .order_by(Application.applied_at.desc())
        .all()
    )
    return [build_application_out(db, a) for a in apps]


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
    return [format_task_out(t, db=db) for t in tasks]


@router.get("/me/company-coordinator", response_model=CompanyCoordinatorInfo)
def get_my_company_coordinator(
    student_ctx=Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Returns the assigned External Mentor / Company Coordinator for the student."""
    _, student = student_ctx

    # 1. Direct explicit assignment
    direct_link = (
        db.query(ExternalMentorStudent)
        .filter(ExternalMentorStudent.student_id == student.id)
        .first()
    )
    if direct_link:
        ext_mentor = db.query(ExternalMentor).filter(ExternalMentor.id == direct_link.external_mentor_id).first()
        if ext_mentor and ext_mentor.user and ext_mentor.company:
            int_obj = direct_link.internship or (
                db.query(Internship)
                .filter(Internship.student_id == student.id)
                .first()
            )
            return CompanyCoordinatorInfo(
                id=ext_mentor.id,
                user_id=ext_mentor.user_id,
                name=ext_mentor.user.full_name,
                email=ext_mentor.user.email,
                coordinator_name=ext_mentor.user.full_name,
                coordinator_email=ext_mentor.user.email,
                phone=ext_mentor.phone,
                designation=ext_mentor.designation or "Company Internship Coordinator",
                company_id=ext_mentor.company_id,
                company_name=ext_mentor.company.name,
                internship_id=int_obj.id if int_obj else None,
                internship_title=int_obj.title if int_obj else None,
            )

    # 2. Company-level coordinator from active or approved internship
    active_int = (
        db.query(Internship)
        .filter(Internship.student_id == student.id)
        .first()
    )
    if not active_int:
        app = (
            db.query(Application)
            .filter(Application.student_id == student.id, Application.status.in_(["APPROVED", "SELECTED", "ACCEPTED"]))
            .first()
        )
        if app:
            active_int = app.internship

    if active_int and active_int.company_id:
        ext_mentor = db.query(ExternalMentor).filter(ExternalMentor.company_id == active_int.company_id).first()
        if ext_mentor and ext_mentor.user and ext_mentor.company:
            return CompanyCoordinatorInfo(
                id=ext_mentor.id,
                user_id=ext_mentor.user_id,
                name=ext_mentor.user.full_name,
                email=ext_mentor.user.email,
                coordinator_name=ext_mentor.user.full_name,
                coordinator_email=ext_mentor.user.email,
                phone=ext_mentor.phone,
                designation=ext_mentor.designation or "Company Internship Coordinator",
                company_id=ext_mentor.company_id,
                company_name=ext_mentor.company.name,
                internship_id=active_int.id,
                internship_title=active_int.title,
            )

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="No company coordinator assigned yet",
    )


def _is_valid_url(url: Optional[str]) -> bool:
    if not url or not isinstance(url, str):
        return False
    clean = url.strip()
    try:
        parsed = urlparse(clean)
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            return False
        if "." not in parsed.netloc and parsed.netloc.lower() not in ("localhost", "127.0.0.1"):
            return False
        return True
    except Exception:
        return False


def _validate_and_complete_company_task(
    db: Session,
    student: Student,
    user: User,
    task_id: Optional[int],
    task_title: Optional[str],
    task_link: Optional[str],
) -> Task:
    # 6. Task Title is present
    if not task_title or not task_title.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task Title is required for timesheet task completion",
        )

    # 7. Task Link is present
    if not task_link or not task_link.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task Link / URL is required for timesheet task completion",
        )

    # 8. Task Link is a valid URL
    clean_link = task_link.strip()
    if not _is_valid_url(clean_link):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task Link must be a valid URL (e.g. https://github.com/student/project-task)",
        )

    # 5. Task exists
    task = None
    if task_id:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task with ID {task_id} not found",
            )
    else:
        # Match by student and title
        task = (
            db.query(Task)
            .filter(Task.student_id == student.id, Task.title.ilike(task_title.strip()))
            .first()
        )
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task with title '{task_title.strip()}' not found",
            )

    # 2 & 10. Student owns the task / student is not trying to complete another student's task
    if task.student_id != student.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not own this milestone task",
        )

    # Submitted Task Title should correspond to the selected task
    if task.title.strip().lower() != task_title.strip().lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Submitted Task Title '{task_title.strip()}' does not match the selected task '{task.title}'",
        )

    # 3. Task is a Company Provided Task
    is_company_task = (task.source == "Company Provided") or (task.external_mentor_id is not None)
    if not is_company_task:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task is not a Company Provided Task",
        )

    # 4. Task belongs to the student's relevant internship/company
    student_company_ids = set()
    for int_obj in db.query(Internship).filter(Internship.student_id == student.id).all():
        if int_obj.company_id:
            student_company_ids.add(int_obj.company_id)
    for app in db.query(Application).filter(Application.student_id == student.id).all():
        if app.internship and app.internship.company_id:
            student_company_ids.add(app.internship.company_id)
    for link in db.query(ExternalMentorStudent).filter(ExternalMentorStudent.student_id == student.id).all():
        if link.external_mentor and link.external_mentor.company_id:
            student_company_ids.add(link.external_mentor.company_id)

    student_int_ids = {i.id for i in db.query(Internship).filter(Internship.student_id == student.id).all()}
    task_company_id = None
    if task.internship and task.internship.company_id:
        task_company_id = task.internship.company_id
    elif task.external_mentor and task.external_mentor.company_id:
        task_company_id = task.external_mentor.company_id

    if student_company_ids and task_company_id and (task_company_id not in student_company_ids) and (task.internship_id not in student_int_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task does not belong to your assigned internship or company",
        )

    # 9. The task is not already completed
    if task.is_completed or task.status == "COMPLETED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task is already completed",
        )

    # AUTOMATIC COMPLETION: Update the SAME existing Task record
    task.is_completed = True
    task.status = "COMPLETED"
    task.completed_at = datetime.now(timezone.utc)
    task.task_link = clean_link

    # NOTIFICATIONS: Notify Internal Faculty Mentor and Company Coordinator
    # 1. Notify Internal Faculty Mentor
    target_mentor_id = student.mentor_id or getattr(task, "mentor_id", None)
    if not target_mentor_id and task.internship:
        target_mentor_id = task.internship.mentor_id
    if target_mentor_id:
        mentor = db.query(Mentor).filter(Mentor.id == target_mentor_id).first()
        if mentor and mentor.user_id:
            db.add(
                Notification(
                    user_id=mentor.user_id,
                    title="Student Completed Company Task via Timesheet",
                    message=f"Student {user.full_name} completed the company task: {task.title}.",
                    notification_type="TASK_COMPLETED",
                    is_read=False,
                )
            )

    # 2. Notify Company Coordinator / External Mentor
    ext_m = None
    if getattr(task, "external_mentor_id", None):
        ext_m = db.query(ExternalMentor).filter(ExternalMentor.id == task.external_mentor_id).first()
    elif task.internship and task.internship.company_id:
        ext_m = db.query(ExternalMentor).filter(ExternalMentor.company_id == task.internship.company_id).first()

    if ext_m and ext_m.user_id:
        db.add(
            Notification(
                user_id=ext_m.user_id,
                title="Student Completed Company Task via Timesheet",
                message=f"Student {user.full_name} completed the company task: {task.title}.",
                notification_type="TASK_COMPLETED",
                is_read=False,
            )
        )

    return task


@router.post("/me/tasks/{task_id}/toggle", response_model=TaskOut)
@router.patch("/me/tasks/{task_id}/toggle", response_model=TaskOut)
@router.post("/tasks/{task_id}/toggle", response_model=TaskOut)
@router.patch("/tasks/{task_id}/toggle", response_model=TaskOut)
def toggle_task_completion(
    task_id: int,
    student_ctx=Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Rejects direct completion for Company Provided Tasks. For non-company tasks, toggles completion status."""
    user, student = student_ctx
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    if task.student_id != student.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not own this milestone task",
        )

    # For Company Provided Tasks, direct completion from Dashboard/Task list is strictly forbidden.
    is_company_task = (task.source == "Company Provided") or (task.external_mentor_id is not None)
    if is_company_task:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Direct completion is disabled for Company Provided Tasks. Submit task title and task link in Timesheet to complete this task.",
        )

    task.is_completed = not task.is_completed
    task.completed_at = datetime.now(timezone.utc) if task.is_completed else None
    task.status = "COMPLETED" if task.is_completed else "PENDING"
    db.commit()
    db.refresh(task)
    return format_task_out(task, db=db)


@router.post("/me/timesheet/task", response_model=TaskOut)
@router.post("/me/timesheets/task", response_model=TaskOut)
@router.post("/me/tasks/timesheet-complete", response_model=TaskOut)
@router.post("/me/tasks/timesheet-submit", response_model=TaskOut)
def complete_company_task_via_timesheet(
    payload: TimesheetTaskSubmission,
    student_ctx=Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Submits a Timesheet entry for a Company Provided Task.
    Validates Task Title and Task Link, and marks the SAME Task record as COMPLETED.
    """
    user, student = student_ctx
    task = _validate_and_complete_company_task(
        db=db,
        student=student,
        user=user,
        task_id=payload.task_id,
        task_title=payload.task_title,
        task_link=payload.task_link,
    )
    db.commit()
    db.refresh(task)
    return format_task_out(task, db=db)


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
@router.post("/me/timesheet", response_model=WeeklyReportOut, status_code=status.HTTP_201_CREATED)
@router.post("/me/timesheets", response_model=WeeklyReportOut, status_code=status.HTTP_201_CREATED)
def submit_weekly_report(
    payload: WeeklyReportCreate,
    student_ctx=Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Submits a new weekly progress report/timesheet and optionally completes an assigned Company Task."""
    user, student = student_ctx
    internship = (
        db.query(Internship)
        .filter(Internship.student_id == student.id, Internship.status == "ACTIVE")
        .order_by(Internship.id.asc())
        .first()
    )
    if not internship:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You do not have an active internship to submit reports for",
        )

    clean_evidence = payload.evidence_url.strip() if payload.evidence_url and payload.evidence_url.strip() else None
    if not clean_evidence and "Evidence Reference:" in (payload.achievements or ""):
        for line in (payload.achievements or "").splitlines():
            if "Evidence Reference:" in line:
                clean_evidence = line.split("Evidence Reference:", 1)[1].strip()
                break

    # If payload links a company task, perform validation and automatic completion!
    completed_task = None
    if payload.task_id or payload.task_title:
        task_link_to_use = payload.task_link or clean_evidence
        completed_task = _validate_and_complete_company_task(
            db=db,
            student=student,
            user=user,
            task_id=payload.task_id,
            task_title=payload.task_title,
            task_link=task_link_to_use,
        )
        if not clean_evidence and completed_task.task_link:
            clean_evidence = completed_task.task_link

    if payload.require_evidence and not clean_evidence:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Evidence URL / Artifact Reference is compulsory for weekly report submission",
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
        evidence_url=clean_evidence,
        hours_spent=payload.hours_spent,
        status="SUBMITTED",
        task_id=completed_task.id if completed_task else payload.task_id,
        task_title=completed_task.title if completed_task else payload.task_title,
    )
    db.add(report)

    target_mentor_id = student.mentor_id or internship.mentor_id
    if target_mentor_id:
        mentor = db.query(Mentor).filter(Mentor.id == target_mentor_id).first()
        if mentor and mentor.user_id:
            db.add(
                Notification(
                    user_id=mentor.user_id,
                    title=f"Weekly Report Submitted: Week {payload.week_number}",
                    message=f"{user.full_name} submitted Week {payload.week_number} progress report for {internship.title}.",
                    notification_type="REPORT_SUBMITTED",
                    is_read=False,
                )
            )

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

    internship = (
        db.query(Internship)
        .filter(Internship.student_id == student_id, Internship.status == "ACTIVE")
        .order_by(Internship.id.asc())
        .first()
    )
    if internship:
        tasks = db.query(Task).filter(Task.student_id == student_id, Task.internship_id == internship.id).all()
        reports = db.query(WeeklyReport).filter(WeeklyReport.student_id == student_id, WeeklyReport.internship_id == internship.id).all()
    else:
        tasks = db.query(Task).filter(Task.student_id == student_id).all()
        reports = db.query(WeeklyReport).filter(WeeklyReport.student_id == student_id).all()

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
