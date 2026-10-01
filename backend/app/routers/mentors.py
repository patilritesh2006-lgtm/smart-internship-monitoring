from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_mentor
from backend.app.models import (
    Application,
    Intervention,
    Internship,
    Mentor,
    Notification,
    Student,
    Task,
    User,
    WeeklyReport,
)
from backend.app.core.seed import ensure_unique_mentor_ids
from backend.app.routers.internships import build_application_out, format_task_out
from backend.app.routers.students import compute_student_attention_metrics
from backend.app.schemas import (
    ApplicationOut,
    InternTriageItem,
    InterventionCreate,
    InterventionOut,
    MentorOut,
    StudentDetailOut,
    TaskCreate,
    TaskOut,
    WeeklyReportOut,
    WeeklyReportReview,
)
from intelligence.app import analyze_skill_gap

router = APIRouter(prefix="/mentors", tags=["Mentors"])


def _get_authorized_mentor_ids(user: User, mentor: Mentor, db: Session) -> List[int]:
    """Returns list of mentor IDs authorized for this session.
    Allows demo mentor account mentor@demo.com and faculty accounts to supervise their cohorts.
    """
    mentor_ids = [mentor.id]
    if user and user.email in ["mentor@demo.com", "mentor.turing@university.edu"]:
        turing_user = db.query(User).filter(User.email == "mentor.turing@university.edu").first()
        demo_user = db.query(User).filter(User.email == "mentor@demo.com").first()
        if turing_user and turing_user.mentor_profile and turing_user.mentor_profile.id not in mentor_ids:
            mentor_ids.append(turing_user.mentor_profile.id)
        if demo_user and demo_user.mentor_profile and demo_user.mentor_profile.id not in mentor_ids:
            mentor_ids.append(demo_user.mentor_profile.id)
    return mentor_ids


@router.get("/me", response_model=MentorOut)
def get_my_mentor_profile(
    mentor_ctx=Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """Returns the current mentor profile including their permanent unique Mentor ID (MNT-XXX)."""
    user, mentor = mentor_ctx
    ensure_unique_mentor_ids(db)
    db.refresh(mentor)
    mentor_ids = _get_authorized_mentor_ids(user, mentor, db)
    direct_students = db.query(Student).filter(Student.mentor_id.in_(mentor_ids)).all()
    intern_students = (
        db.query(Student)
        .join(Internship, Internship.student_id == Student.id)
        .filter(Internship.mentor_id.in_(mentor_ids))
        .all()
    )
    unique_students = {s.id: s for s in (direct_students + intern_students)}
    student_names = [
        s.user.full_name for s in unique_students.values() if s.user and s.user.full_name
    ]
    active_internships_count = (
        db.query(Internship)
        .filter(
            Internship.mentor_id.in_(mentor_ids),
            Internship.student_id.isnot(None),
            Internship.status == "ACTIVE",
        )
        .count()
    )
    return MentorOut(
        id=mentor.id,
        mentor_id=mentor.employee_id,
        mentor_code=mentor.employee_id,
        user_id=user.id,
        department=mentor.department,
        designation=mentor.designation,
        employee_id=mentor.employee_id,
        full_name=user.full_name,
        email=user.email,
        status="ACTIVE" if user.is_active else "INACTIVE",
        is_active=user.is_active,
        assigned_students_count=len(unique_students),
        active_internships_count=active_internships_count,
        assigned_student_names=student_names,
    )


@router.get("/me/interns", response_model=List[InternTriageItem])
def get_assigned_interns(
    mentor_ctx=Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """Lists assigned students/interns for the current mentor, ranked by attention priority."""
    user, mentor = mentor_ctx
    mentor_ids = _get_authorized_mentor_ids(user, mentor, db)

    # Students assigned directly via Student.mentor_id
    direct_students = db.query(Student).filter(Student.mentor_id.in_(mentor_ids)).all()

    # Students assigned via active Internship.mentor_id (only if student hasn't been reassigned to a different mentor)
    assigned_internships = (
        db.query(Internship)
        .filter(Internship.mentor_id.in_(mentor_ids), Internship.status == "ACTIVE")
        .all()
    )
    intern_student_ids = [i.student_id for i in assigned_internships if i.student_id]
    intern_students = (
        db.query(Student).filter(Student.id.in_(intern_student_ids)).all()
        if intern_student_ids
        else []
    )

    unique_students = {}
    for s in direct_students:
        unique_students[s.id] = s
    for s in intern_students:
        if s.mentor_id is None or s.mentor_id in mentor_ids:
            unique_students[s.id] = s

    triage_list: List[InternTriageItem] = []
    now = datetime.now(timezone.utc)

    for student in unique_students.values():
        internship = (
            db.query(Internship)
            .filter(Internship.student_id == student.id, Internship.status == "ACTIVE")
            .order_by(Internship.id.desc())
            .first()
        )
        latest_app = (
            db.query(Application)
            .filter(Application.student_id == student.id)
            .order_by(Application.applied_at.desc())
            .first()
        )

        if internship:
            tasks = db.query(Task).filter(Task.student_id == student.id, Task.internship_id == internship.id).all()
            reports = db.query(WeeklyReport).filter(WeeklyReport.student_id == student.id, WeeklyReport.internship_id == internship.id).all()
        else:
            tasks = db.query(Task).filter(Task.student_id == student.id).all()
            reports = db.query(WeeklyReport).filter(WeeklyReport.student_id == student.id).all()

        tasks_total = len(tasks)
        tasks_completed = sum(1 for t in tasks if t.is_completed)
        pending_tasks_count = max(0, tasks_total - tasks_completed)

        if internship and internship.start_date:
            start_date = internship.start_date
            if start_date.tzinfo is None:
                start_date = start_date.replace(tzinfo=timezone.utc)
            days_active = max(0, (now - start_date).days)
            if days_active < 7:
                expected_reports = len(reports)
            else:
                expected_reports = min(max(1, (days_active // 7) + 1), internship.duration_weeks)
        else:
            expected_reports = len(reports)

        # Compute live intelligence metrics
        metrics = compute_student_attention_metrics(student.id, db)

        reviewed_reports = [r for r in reports if r.mentor_score is not None]
        avg_score = (
            round(sum(r.mentor_score for r in reviewed_reports) / len(reviewed_reports), 1)
            if reviewed_reports
            else None
        )

        if internship:
            int_id = internship.id
            int_title = internship.title
            comp_name = internship.company.name if internship.company else "Unknown"
            int_status = internship.status
            app_status = latest_app.status if latest_app else "APPROVED"
        elif latest_app and latest_app.internship:
            int_id = latest_app.internship_id
            int_title = latest_app.internship.title
            comp_name = latest_app.internship.company.name if latest_app.internship.company else "Unknown"
            int_status = "PENDING_PLACEMENT"
            app_status = latest_app.status
        else:
            int_id = 0
            int_title = "Awaiting Internship Placement"
            comp_name = "Unassigned"
            int_status = "UNASSIGNED"
            app_status = latest_app.status if latest_app else "NO_APPLICATION"

        triage_list.append(
            InternTriageItem(
                student_id=student.id,
                student_name=student.user.full_name if student.user else "Unknown Student",
                student_email=student.user.email if student.user else "",
                internship_id=int_id,
                internship_title=int_title,
                company_name=comp_name,
                attention_score=metrics.attention_score,
                attention_status=metrics.attention_status,
                tasks_completed=tasks_completed,
                tasks_total=tasks_total,
                reports_submitted=len(reports),
                reports_expected=expected_reports,
                average_mentor_score=avg_score,
                reasons=metrics.reasons,
                recommendations=metrics.recommendations,
                application_status=app_status,
                internship_status=int_status,
                pending_tasks_count=pending_tasks_count,
            )
        )

    # Sort priority: NEEDS_ATTENTION (lowest score) -> MONITOR -> ON_TRACK
    status_weights = {"NEEDS_ATTENTION": 0, "MONITOR": 1, "ON_TRACK": 2}
    triage_list.sort(key=lambda x: (status_weights.get(x.attention_status, 3), x.attention_score))
    return triage_list


@router.get("/students/{student_id}", response_model=StudentDetailOut)
def get_student_detail(
    student_id: int,
    mentor_ctx=Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """
    Returns full aggregated monitoring detail for a student.
    Includes profile, active placement, supervisor, tasks, reports, attention factors,
    explainable reasons, recommendations, skill gap analysis, and intervention history.
    """
    user, mentor = mentor_ctx
    mentor_ids = _get_authorized_mentor_ids(user, mentor, db)

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student record not found")

    # Find active or most recent internship
    internship = (
        db.query(Internship)
        .filter(Internship.student_id == student.id)
        .order_by(Internship.status == "ACTIVE", Internship.created_at.desc())
        .first()
    )

    is_directly_assigned = student.mentor_id in mentor_ids
    is_internship_assigned = bool(internship and internship.mentor_id in mentor_ids)

    if not internship and not is_directly_assigned:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No internship assignment found for this student",
        )

    # Verify authorization
    if not is_directly_assigned and not is_internship_assigned and user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to monitor this student",
        )

    latest_app = (
        db.query(Application)
        .filter(Application.student_id == student.id)
        .order_by(Application.applied_at.desc())
        .first()
    )

    if internship:
        tasks = (
            db.query(Task)
            .filter(Task.student_id == student.id, Task.internship_id == internship.id)
            .order_by(Task.is_completed.asc(), Task.created_at.asc())
            .all()
        )
        reports = (
            db.query(WeeklyReport)
            .filter(WeeklyReport.student_id == student.id, WeeklyReport.internship_id == internship.id)
            .order_by(WeeklyReport.week_number.asc())
            .all()
        )
    else:
        tasks = (
            db.query(Task)
            .filter(Task.student_id == student.id)
            .order_by(Task.is_completed.asc(), Task.created_at.asc())
            .all()
        )
        reports = (
            db.query(WeeklyReport)
            .filter(WeeklyReport.student_id == student.id)
            .order_by(WeeklyReport.week_number.asc())
            .all()
        )

    interventions = (
        db.query(Intervention)
        .filter(Intervention.student_id == student.id)
        .order_by(Intervention.created_at.desc())
        .all()
    )

    tasks_total = len(tasks)
    tasks_completed = sum(1 for t in tasks if t.is_completed)

    now = datetime.now(timezone.utc)
    if internship and internship.start_date:
        start_date = internship.start_date
        if start_date.tzinfo is None:
            start_date = start_date.replace(tzinfo=timezone.utc)
        days_active = max(0, (now - start_date).days)
        if days_active < 7:
            expected_reports = len(reports)
        else:
            expected_reports = min(max(1, (days_active // 7) + 1), internship.duration_weeks)
    else:
        expected_reports = len(reports)

    # Real Progress Attention Metrics
    metrics = compute_student_attention_metrics(student.id, db)

    # Real Skill Gap Analysis (use active internship or latest application's internship)
    student_skills = [s.skill_name for s in student.skills]
    target_internship = internship or (latest_app.internship if latest_app else None)
    required_skills = [s.skill_name for s in target_internship.skills] if target_internship else []
    skill_gap_res = analyze_skill_gap(
        student_skills=student_skills,
        required_skills=required_skills,
    )

    skill_gap_dict = {
        "matched_skills": skill_gap_res.matched_skills,
        "missing_skills": skill_gap_res.missing_skills,
        "match_percentage": float(skill_gap_res.match_percentage),
        "recommendation": skill_gap_res.recommendation,
    }

    task_outs = [format_task_out(t) for t in tasks]

    report_outs = [
        WeeklyReportOut(
            id=r.id,
            internship_id=r.internship_id,
            student_id=r.student_id,
            student_name=student.user.full_name,
            week_number=r.week_number,
            achievements=r.achievements,
            challenges=r.challenges,
            evidence_url=getattr(r, "evidence_url", None),
            hours_spent=r.hours_spent,
            status=r.status,
            mentor_feedback=r.mentor_feedback,
            mentor_score=r.mentor_score,
            submitted_at=r.submitted_at,
            reviewed_at=r.reviewed_at,
        )
        for r in reports
    ]

    intervention_outs = [
        InterventionOut(
            id=i.id,
            student_id=i.student_id,
            mentor_id=i.mentor_id,
            mentor_name=i.mentor.user.full_name if i.mentor and i.mentor.user else user.full_name,
            intervention_type=i.intervention_type,
            notes=i.notes,
            action_taken=i.action_taken,
            status=i.status,
            created_at=i.created_at,
        )
        for i in interventions
    ]

    assigned_mentor_obj = student.assigned_mentor or (internship.mentor if internship else None)
    mentor_user = assigned_mentor_obj.user if assigned_mentor_obj else None

    return StudentDetailOut(
        student_id=student.id,
        student_name=student.user.full_name,
        student_email=student.user.email,
        department=student.department,
        roll_number=student.roll_number,
        academic_year=student.academic_year,
        student_skills=student_skills,
        internship_id=internship.id if internship else (latest_app.internship_id if latest_app else 0),
        internship_title=internship.title if internship else (latest_app.internship.title if latest_app and latest_app.internship else "Awaiting Placement"),
        company_name=(
            internship.company.name
            if internship and internship.company
            else (latest_app.internship.company.name if latest_app and latest_app.internship and latest_app.internship.company else "Unassigned")
        ),
        internship_domain=(
            (getattr(internship, "domain", None) if internship else None)
            or (getattr(latest_app.internship, "domain", None) if latest_app and latest_app.internship else None)
            or "Software Development"
        ),
        internship_description=(
            internship.description
            if internship
            else (
                latest_app.internship.description
                if latest_app and latest_app.internship
                else "Student is assigned to faculty supervision and awaiting final internship placement approval."
            )
        ),
        internship_location=internship.location if internship else (latest_app.internship.location if latest_app and latest_app.internship else "TBD"),
        internship_status=internship.status if internship else (f"APPLICATION_{latest_app.status}" if latest_app else "UNASSIGNED"),
        completion_status=(getattr(internship, "completion_status", None) if internship else None) or "IN_PROGRESS",
        duration_weeks=internship.duration_weeks if internship else (latest_app.internship.duration_weeks if latest_app and latest_app.internship else 8),
        start_date=internship.start_date if internship else None,
        end_date=internship.end_date if internship else None,
        required_skills=required_skills,
        mentor_name=mentor_user.full_name if mentor_user else user.full_name,
        mentor_email=mentor_user.email if mentor_user else user.email,
        tasks=task_outs,
        tasks_total=tasks_total,
        tasks_completed=tasks_completed,
        reports=report_outs,
        reports_submitted=len(reports),
        reports_expected=expected_reports,
        attention_score=metrics.attention_score,
        attention_status=metrics.attention_status,
        factors=metrics.factors,
        reasons=metrics.reasons,
        recommendations=metrics.recommendations,
        skill_gap=skill_gap_dict,
        interventions=intervention_outs,
    )


@router.get("/students/{student_id}/applications", response_model=List[ApplicationOut])
def get_student_applications_for_mentor(
    student_id: int,
    mentor_ctx=Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """Returns all internship applications (with skill match/gap and tasks) for an assigned student."""
    user, mentor = mentor_ctx
    mentor_ids = _get_authorized_mentor_ids(user, mentor, db)

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student record not found")

    internship = (
        db.query(Internship)
        .filter(Internship.student_id == student.id)
        .order_by(Internship.status == "ACTIVE", Internship.created_at.desc())
        .first()
    )
    is_authorized = (
        student.mentor_id in mentor_ids
        or bool(internship and internship.mentor_id in mentor_ids)
        or user.role == "ADMIN"
    )
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view applications for this student",
        )

    apps = (
        db.query(Application)
        .filter(Application.student_id == student.id)
        .order_by(Application.applied_at.desc())
        .all()
    )
    return [build_application_out(db, a) for a in apps]


@router.post("/students/{student_id}/tasks", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def assign_student_task(
    student_id: int,
    payload: TaskCreate,
    mentor_ctx=Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """Allows an assigned Mentor to assign an internship-specific task to their student and notifies the student."""
    user, mentor = mentor_ctx
    mentor_ids = _get_authorized_mentor_ids(user, mentor, db)

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student record not found")

    internship = (
        db.query(Internship)
        .filter(Internship.student_id == student.id)
        .order_by(Internship.status == "ACTIVE", Internship.created_at.desc())
        .first()
    )
    is_authorized = (
        student.mentor_id in mentor_ids
        or bool(internship and internship.mentor_id in mentor_ids)
        or user.role == "ADMIN"
    )
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to assign tasks to this student",
        )

    latest_app = (
        db.query(Application)
        .filter(Application.student_id == student.id)
        .order_by(Application.applied_at.desc())
        .first()
    )

    target_internship_id = payload.internship_id
    if not target_internship_id:
        if internship:
            target_internship_id = internship.id
        elif latest_app:
            target_internship_id = latest_app.internship_id
        else:
            first_int = db.query(Internship).order_by(Internship.id.asc()).first()
            if not first_int:
                raise HTTPException(status_code=400, detail="No internship found to link task")
            target_internship_id = first_int.id

    target_app_id = payload.application_id or (
        latest_app.id if latest_app and latest_app.internship_id == target_internship_id else None
    )
    due = payload.due_date or (datetime.now(timezone.utc) + timedelta(days=7))
    prio = (payload.priority or "MEDIUM").upper()
    if prio not in ("LOW", "MEDIUM", "HIGH"):
        prio = "MEDIUM"

    new_task = Task(
        internship_id=target_internship_id,
        student_id=student.id,
        application_id=target_app_id,
        mentor_id=mentor.id,
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        priority=prio,
        status="PENDING",
        due_date=due,
        is_completed=False,
    )
    db.add(new_task)

    if student.user_id:
        db.add(
            Notification(
                user_id=student.user_id,
                title="New Internship Task Assigned by Mentor",
                message=f"Mentor {user.full_name} assigned a new task: '{new_task.title}' (Priority: {prio}).",
                notification_type="TASK_ASSIGNED",
                is_read=False,
            )
        )

    db.commit()
    db.refresh(new_task)
    return format_task_out(new_task)


@router.post("/students/{student_id}/interventions", response_model=InterventionOut, status_code=status.HTTP_201_CREATED)
def record_student_intervention(
    student_id: int,
    payload: InterventionCreate,
    mentor_ctx=Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """Records a formal faculty intervention for a student in the database."""
    user, mentor = mentor_ctx
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student record not found")

    intervention = Intervention(
        student_id=student.id,
        mentor_id=mentor.id,
        intervention_type=payload.intervention_type,
        notes=payload.notes,
        action_taken=payload.action_taken,
        status="COMPLETED",
        created_at=datetime.now(timezone.utc),
    )
    db.add(intervention)
    db.commit()
    db.refresh(intervention)

    return InterventionOut(
        id=intervention.id,
        student_id=intervention.student_id,
        mentor_id=intervention.mentor_id,
        mentor_name=user.full_name,
        intervention_type=intervention.intervention_type,
        notes=intervention.notes,
        action_taken=intervention.action_taken,
        status=intervention.status,
        created_at=intervention.created_at,
    )


@router.get("/students/{student_id}/interventions", response_model=List[InterventionOut])
def get_student_interventions(
    student_id: int,
    mentor_ctx=Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """Lists past interventions recorded for the student."""
    interventions = (
        db.query(Intervention)
        .filter(Intervention.student_id == student_id)
        .order_by(Intervention.created_at.desc())
        .all()
    )
    out = []
    for i in interventions:
        mentor_name = i.mentor.user.full_name if i.mentor and i.mentor.user else "Faculty Supervisor"
        out.append(
            InterventionOut(
                id=i.id,
                student_id=i.student_id,
                mentor_id=i.mentor_id,
                mentor_name=mentor_name,
                intervention_type=i.intervention_type,
                notes=i.notes,
                action_taken=i.action_taken,
                status=i.status,
                created_at=i.created_at,
            )
        )
    return out


@router.get("/reports/pending", response_model=List[WeeklyReportOut])
def get_pending_reports(
    mentor_ctx=Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """Lists submitted reports for mentor's assigned interns awaiting review."""
    user, mentor = mentor_ctx
    mentor_ids = _get_authorized_mentor_ids(user, mentor, db)

    assigned_internship_ids = {
        i.id
        for i in db.query(Internship.id)
        .filter(Internship.mentor_id.in_(mentor_ids), Internship.status == "ACTIVE")
        .all()
    }
    assigned_student_ids = {
        s.id
        for s in db.query(Student.id)
        .filter(Student.mentor_id.in_(mentor_ids))
        .all()
    }

    if not assigned_internship_ids and not assigned_student_ids:
        return []

    reports_query = db.query(WeeklyReport).filter(WeeklyReport.status == "SUBMITTED")
    reports = [
        r
        for r in reports_query.order_by(WeeklyReport.submitted_at.asc()).all()
        if r.internship_id in assigned_internship_ids or r.student_id in assigned_student_ids
    ]

    out = []
    for r in reports:
        student_name = r.student.user.full_name if r.student and r.student.user else "Unknown Student"
        out.append(
            WeeklyReportOut(
                id=r.id,
                internship_id=r.internship_id,
                student_id=r.student_id,
                student_name=student_name,
                week_number=r.week_number,
                achievements=r.achievements,
                challenges=r.challenges,
                evidence_url=getattr(r, "evidence_url", None),
                hours_spent=r.hours_spent,
                status=r.status,
                mentor_feedback=r.mentor_feedback,
                mentor_score=r.mentor_score,
                submitted_at=r.submitted_at,
                reviewed_at=r.reviewed_at,
            )
        )
    return out


@router.post("/reports/{report_id}/review", response_model=WeeklyReportOut)
def review_weekly_report(
    report_id: int,
    payload: WeeklyReportReview,
    mentor_ctx=Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """Reviews and evaluates an intern's weekly report with feedback and score (0-100)."""
    user, mentor = mentor_ctx
    mentor_ids = _get_authorized_mentor_ids(user, mentor, db)

    report = db.query(WeeklyReport).filter(WeeklyReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    # Verify report belongs to an internship or student assigned to this mentor
    internship = db.query(Internship).filter(Internship.id == report.internship_id).first()
    student = db.query(Student).filter(Student.id == report.student_id).first()
    is_authorized = (
        (internship and internship.mentor_id in mentor_ids)
        or (student and student.mentor_id in mentor_ids)
    )
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to review reports for this internship",
        )

    report.mentor_feedback = payload.mentor_feedback
    report.mentor_score = payload.mentor_score
    report.status = "REVIEWED"
    report.reviewed_at = datetime.now(timezone.utc)

    if student and student.user_id:
        db.add(
            Notification(
                user_id=student.user_id,
                title=f"Week {report.week_number} Report Reviewed",
                message=f"Mentor {user.full_name} reviewed your Week {report.week_number} report (Score: {payload.mentor_score}%).",
                notification_type="REPORT_REVIEWED",
                is_read=False,
            )
        )

    db.commit()
    db.refresh(report)

    student_name = report.student.user.full_name if report.student and report.student.user else "Unknown"
    return WeeklyReportOut(
        id=report.id,
        internship_id=report.internship_id,
        student_id=report.student_id,
        student_name=student_name,
        week_number=report.week_number,
        achievements=report.achievements,
        challenges=report.challenges,
        evidence_url=getattr(report, "evidence_url", None),
        hours_spent=report.hours_spent,
        status=report.status,
        mentor_feedback=report.mentor_feedback,
        mentor_score=report.mentor_score,
        submitted_at=report.submitted_at,
        reviewed_at=report.reviewed_at,
    )

