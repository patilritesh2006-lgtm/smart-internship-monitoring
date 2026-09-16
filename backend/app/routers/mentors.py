from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_mentor
from backend.app.models import Internship, Mentor, Student, Task, WeeklyReport
from backend.app.routers.students import compute_student_attention_metrics
from backend.app.schemas import (
    InternTriageItem,
    WeeklyReportOut,
    WeeklyReportReview,
)

router = APIRouter(prefix="/mentors", tags=["Mentors"])


@router.get("/me/interns", response_model=List[InternTriageItem])
def get_assigned_interns(
    mentor_ctx=Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """Lists assigned interns for the current mentor, ranked by attention priority."""
    _, mentor = mentor_ctx

    assigned_internships = (
        db.query(Internship)
        .filter(Internship.mentor_id == mentor.id, Internship.status == "ACTIVE")
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


@router.get("/reports/pending", response_model=List[WeeklyReportOut])
def get_pending_reports(
    mentor_ctx=Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """Lists submitted reports for mentor's assigned interns awaiting review."""
    _, mentor = mentor_ctx

    assigned_internship_ids = [
        i.id
        for i in db.query(Internship.id)
        .filter(Internship.mentor_id == mentor.id, Internship.status == "ACTIVE")
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
    _, mentor = mentor_ctx

    report = db.query(WeeklyReport).filter(WeeklyReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    # Verify report belongs to an internship assigned to this mentor
    internship = db.query(Internship).filter(Internship.id == report.internship_id).first()
    if not internship or internship.mentor_id != mentor.id:
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
