from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_mentor
from backend.app.models import (
    Intervention,
    Internship,
    Mentor,
    Student,
    Task,
    User,
    WeeklyReport,
)
from backend.app.routers.students import compute_student_attention_metrics
from backend.app.schemas import (
    InternTriageItem,
    InterventionCreate,
    InterventionOut,
    StudentDetailOut,
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


@router.get("/me/interns", response_model=List[InternTriageItem])
def get_assigned_interns(
    mentor_ctx=Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """Lists assigned interns for the current mentor, ranked by attention priority."""
    user, mentor = mentor_ctx
    mentor_ids = _get_authorized_mentor_ids(user, mentor, db)

    assigned_internships = (
        db.query(Internship)
        .filter(Internship.mentor_id.in_(mentor_ids), Internship.status == "ACTIVE")
        .all()
    )

    triage_list: List[InternTriageItem] = []

    for internship in assigned_internships:
        if not internship.student_id:
            continue

        student = db.query(Student).filter(Student.id == internship.student_id).first()
        if not student:
            continue

        tasks = db.query(Task).filter(Task.student_id == student.id).all()
        reports = db.query(WeeklyReport).filter(WeeklyReport.student_id == student.id).all()

        tasks_total = len(tasks)
        tasks_completed = sum(1 for t in tasks if t.is_completed)

        now = datetime.now(timezone.utc)
        if internship.start_date:
            start_date = internship.start_date
            if start_date.tzinfo is None:
                start_date = start_date.replace(tzinfo=timezone.utc)
            days_active = max(1, (now - start_date).days)
            expected_reports = min(max(1, (days_active // 7) + 1), internship.duration_weeks)
        else:
            expected_reports = max(1, len(reports))

        # Compute live intelligence metrics
        metrics = compute_student_attention_metrics(student.id, db)

        reviewed_reports = [r for r in reports if r.mentor_score is not None]
        avg_score = (
            round(sum(r.mentor_score for r in reviewed_reports) / len(reviewed_reports), 1)
            if reviewed_reports
            else None
        )

        triage_list.append(
            InternTriageItem(
                student_id=student.id,
                student_name=student.user.full_name,
                student_email=student.user.email,
                internship_id=internship.id,
                internship_title=internship.title,
                company_name=internship.company.name if internship.company else "Unknown",
                attention_score=metrics.attention_score,
                attention_status=metrics.attention_status,
                tasks_completed=tasks_completed,
                tasks_total=tasks_total,
                reports_submitted=len(reports),
                reports_expected=expected_reports,
                average_mentor_score=avg_score,
                reasons=metrics.reasons,
                recommendations=metrics.recommendations,
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

    if not internship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No internship assignment found for this student",
        )

    # Verify authorization
    if internship.mentor_id not in mentor_ids and user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to monitor this student",
        )

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
    if internship.start_date:
        start_date = internship.start_date
        if start_date.tzinfo is None:
            start_date = start_date.replace(tzinfo=timezone.utc)
        days_active = max(1, (now - start_date).days)
        expected_reports = min(max(1, (days_active // 7) + 1), internship.duration_weeks)
    else:
        expected_reports = max(1, len(reports))

    # Real Progress Attention Metrics
    metrics = compute_student_attention_metrics(student.id, db)

    # Real Skill Gap Analysis
    student_skills = [s.skill_name for s in student.skills]
    required_skills = [s.skill_name for s in internship.skills]
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

    task_outs = [
        TaskOut(
            id=t.id,
            internship_id=t.internship_id,
            student_id=t.student_id,
            title=t.title,
            description=t.description,
            due_date=t.due_date,
            is_completed=t.is_completed,
            completed_at=t.completed_at,
            created_at=t.created_at,
        )
        for t in tasks
    ]

    report_outs = [
        WeeklyReportOut(
            id=r.id,
            internship_id=r.internship_id,
            student_id=r.student_id,
            student_name=student.user.full_name,
            week_number=r.week_number,
            achievements=r.achievements,
            challenges=r.challenges,
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

    mentor_user = internship.mentor.user if internship.mentor else None

    return StudentDetailOut(
        student_id=student.id,
        student_name=student.user.full_name,
        student_email=student.user.email,
        department=student.department,
        roll_number=student.roll_number,
        academic_year=student.academic_year,
        student_skills=student_skills,
        internship_id=internship.id,
        internship_title=internship.title,
        company_name=internship.company.name if internship.company else "Unknown Company",
        internship_description=internship.description,
        internship_location=internship.location,
        internship_status=internship.status,
        duration_weeks=internship.duration_weeks,
        start_date=internship.start_date,
        end_date=internship.end_date,
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

    assigned_internship_ids = [
        i.id
        for i in db.query(Internship.id)
        .filter(Internship.mentor_id.in_(mentor_ids), Internship.status == "ACTIVE")
        .all()
    ]

    if not assigned_internship_ids:
        return []

    reports = (
        db.query(WeeklyReport)
        .filter(
            WeeklyReport.internship_id.in_(assigned_internship_ids),
            WeeklyReport.status == "SUBMITTED",
        )
        .order_by(WeeklyReport.submitted_at.asc())
        .all()
    )

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

    # Verify report belongs to an internship assigned to this mentor
    internship = db.query(Internship).filter(Internship.id == report.internship_id).first()
    if not internship or internship.mentor_id not in mentor_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to review reports for this internship",
        )

    report.mentor_feedback = payload.mentor_feedback
    report.mentor_score = payload.mentor_score
    report.status = "REVIEWED"
    report.reviewed_at = datetime.now(timezone.utc)

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
        hours_spent=report.hours_spent,
        status=report.status,
        mentor_feedback=report.mentor_feedback,
        mentor_score=report.mentor_score,
        submitted_at=report.submitted_at,
        reviewed_at=report.reviewed_at,
    )

