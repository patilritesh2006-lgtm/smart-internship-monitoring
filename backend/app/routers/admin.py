from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_admin
from backend.app.core.seed import ensure_unique_mentor_ids
from backend.app.models import (
    Application,
    Company,
    Internship,
    Intervention,
    Mentor,
    Notification,
    Student,
    Task,
    User,
    WeeklyReport,
)
from backend.app.routers.internships import (
    build_application_out,
    create_internship,
    format_internship_out,
    generate_internship_specific_tasks,
    publish_internship,
    unpublish_internship,
    update_internship,
)
from backend.app.routers.students import compute_student_attention_metrics
from backend.app.schemas import (
    ApplicationOut,
    ApplicationReview,
    AssignMentorRequest,
    CompanyCreate,
    CompanyOut,
    CompanyUpdate,
    DepartmentAnalytics,
    InstitutionalAnalyticsSchema,
    InternshipCreate,
    InternshipOut,
    InternshipUpdate,
    InterventionOut,
    LifecycleStages,
    MentorOut,
    StudentOut,
    WeeklyReportOut,
)

router = APIRouter(prefix="/admin", tags=["Admin"])


def _get_mentor_group_ids(mentor: Mentor, db: Session) -> List[int]:
    """Returns mentor IDs belonging to the same faculty member (handling demo alias seamlessly)."""
    ids = [mentor.id]
    if mentor.user and mentor.user.email in ("mentor.turing@university.edu", "mentor@demo.com"):
        paired = (
            db.query(Mentor)
            .join(User, Mentor.user_id == User.id)
            .filter(User.email.in_(["mentor.turing@university.edu", "mentor@demo.com"]))
            .all()
        )
        ids = list({m.id for m in paired})
    return ids


def _build_admin_student_out(student: Student, db: Session) -> StudentOut:
    """Builds a complete StudentOut object with current mentor and internship details."""
    active_int = (
        db.query(Internship)
        .filter(Internship.student_id == student.id)
        .order_by(Internship.id.desc())
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
        user_id=student.user_id,
        roll_number=student.roll_number,
        department=student.department,
        academic_year=student.academic_year,
        phone=student.phone,
        full_name=student.user.full_name if student.user else "Unknown Student",
        email=student.user.email if student.user else "",
        skills=[s.skill_name for s in student.skills],
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


@router.get("/applications", response_model=List[ApplicationOut])
def list_applications(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Lists all internship applications submitted across the system with skill match/gap and tasks."""
    apps = db.query(Application).order_by(Application.applied_at.desc()).all()
    return [build_application_out(db, a) for a in apps]


@router.post("/applications/{app_id}/action", response_model=ApplicationOut)
@router.post("/applications/{app_id}/review", response_model=ApplicationOut)
@router.patch("/applications/{app_id}", response_model=ApplicationOut)
def review_application(
    app_id: int,
    payload: ApplicationReview,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Approves, shortlists, reviews, or rejects an internship application and allocates mentor/internship."""
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    raw_status = payload.status or payload.action or "APPROVED"
    status_upper = raw_status.upper().strip()
    if status_upper in ("ACCEPTED", "SELECTED"):
        status_upper = "APPROVED"

    valid_statuses = ["APPROVED", "REJECTED", "SHORTLISTED", "UNDER_REVIEW", "PENDING", "APPLIED"]
    if status_upper not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of {', '.join(valid_statuses)}")

    app.status = status_upper
    app.reviewed_at = datetime.now(timezone.utc)
    if payload.review_notes is not None:
        app.review_notes = payload.review_notes

    internship = db.query(Internship).filter(Internship.id == app.internship_id).first()
    student = db.query(Student).filter(Student.id == app.student_id).first()

    if status_upper == "APPROVED" and internship:
        internship.student_id = app.student_id
        internship.status = "ACTIVE"
        internship.start_date = datetime.now(timezone.utc)

        if payload.mentor_id:
            mentor_obj = db.query(Mentor).filter(Mentor.id == payload.mentor_id).first()
            if not mentor_obj:
                raise HTTPException(status_code=404, detail="Selected mentor not found")
            internship.mentor_id = mentor_obj.id
            if student:
                student.mentor_id = mentor_obj.id
                if mentor_obj.user and student.user:
                    db.add(
                        Notification(
                            user_id=student.user_id,
                            title="Faculty Mentor Assigned",
                            message=f"{mentor_obj.user.full_name} has been assigned as your mentor.",
                            notification_type="MENTOR_ASSIGNMENT",
                        )
                    )
                    db.add(
                        Notification(
                            user_id=mentor_obj.user_id,
                            title="New Student Assigned",
                            message=f"Admin assigned {student.user.full_name} to you.",
                            notification_type="MENTOR_ASSIGNMENT",
                        )
                    )
        elif student and student.mentor_id:
            internship.mentor_id = student.mentor_id
        elif student and internship.mentor_id:
            student.mentor_id = internship.mentor_id

        # Ensure internship-specific tasks exist for the approved student
        generate_internship_specific_tasks(
            db=db,
            student_id=app.student_id,
            internship=internship,
            application_id=app.id,
            mentor_id=internship.mentor_id or (student.mentor_id if student else None),
        )

    if student and student.user_id:
        int_title = internship.title if internship else "Internship"
        comp_name = internship.company.name if internship and internship.company else "Partner Company"
        db.add(
            Notification(
                user_id=student.user_id,
                title=f"Application Status Updated: {status_upper}",
                message=(
                    f"Your application for {int_title} at {comp_name} has been marked as {status_upper}."
                    + (f" Notes: {payload.review_notes}" if payload.review_notes else "")
                ),
                notification_type="APPLICATION",
                is_read=False,
            )
        )

    db.commit()
    db.refresh(app)

    return build_application_out(db, app)


@router.get("/mentors", response_model=List[MentorOut])
def list_mentors(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Lists all registered faculty mentors with permanent unique Mentor IDs, assigned student counts, and status."""
    ensure_unique_mentor_ids(db)
    mentors = db.query(Mentor).order_by(Mentor.id.asc()).all()
    out = []
    for m in mentors:
        # Students assigned directly via Student.mentor_id or via active Internship.mentor_id
        direct_students = db.query(Student).filter(Student.mentor_id == m.id).all()
        intern_students = (
            db.query(Student)
            .join(Internship, Internship.student_id == Student.id)
            .filter(
                Internship.mentor_id == m.id,
                (Student.mentor_id.is_(None)) | (Student.mentor_id == m.id),
            )
            .all()
        )
        unique_students = {s.id: s for s in (direct_students + intern_students)}
        student_names = [
            s.user.full_name for s in unique_students.values() if s.user and s.user.full_name
        ]

        active_internships_count = (
            db.query(Internship)
            .filter(
                Internship.mentor_id == m.id,
                Internship.student_id.isnot(None),
                Internship.status == "ACTIVE",
            )
            .count()
        )

        is_active_flag = m.user.is_active if m.user else True

        out.append(
            MentorOut(
                id=m.id,
                mentor_id=m.employee_id,
                mentor_code=m.employee_id,
                user_id=m.user_id,
                department=m.department,
                designation=m.designation,
                employee_id=m.employee_id,
                full_name=m.user.full_name if m.user else "Unknown",
                email=m.user.email if m.user else "",
                status="ACTIVE" if is_active_flag else "INACTIVE",
                is_active=is_active_flag,
                assigned_students_count=len(unique_students),
                active_internships_count=active_internships_count,
                assigned_student_names=student_names,
            )
        )
    return out


@router.get("/students", response_model=List[StudentOut])
def list_admin_students(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Lists all students with their current assigned mentor and internship status for Admin management."""
    students = db.query(Student).order_by(Student.id.asc()).all()
    return [_build_admin_student_out(s, db) for s in students]


@router.put("/students/{student_id}/mentor", response_model=StudentOut)
@router.post("/students/{student_id}/assign-mentor", response_model=StudentOut)
def assign_student_mentor(
    student_id: int,
    payload: AssignMentorRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Allows ONLY Admin to assign, change, or unassign a student's mentor and triggers DB notifications."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    student_name = student.user.full_name if student.user else f"Student #{student.id}"

    if payload.mentor_id is not None:
        mentor = db.query(Mentor).filter(Mentor.id == payload.mentor_id).first()
        if not mentor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mentor not found")

        student.mentor_id = mentor.id

        # Also synchronize any allocated/active internships for this student
        student_internships = (
            db.query(Internship)
            .filter(Internship.student_id == student.id)
            .all()
        )
        for intr in student_internships:
            intr.mentor_id = mentor.id

        mentor_name = mentor.user.full_name if mentor.user else f"Mentor #{mentor.id}"

        # 1. Notification for Student
        db.add(
            Notification(
                user_id=student.user_id,
                title="Faculty Mentor Assigned",
                message=f"{mentor_name} has been assigned as your mentor.",
                notification_type="MENTOR_ASSIGNMENT",
                is_read=False,
            )
        )

        # 2. Notification for Mentor (and demo alias if Dr. Alan Turing)
        mentor_user_ids = [mentor.user_id]
        if mentor.user and mentor.user.email in ("mentor.turing@university.edu", "mentor@demo.com"):
            paired_users = (
                db.query(User)
                .filter(User.email.in_(["mentor.turing@university.edu", "mentor@demo.com"]))
                .all()
            )
            mentor_user_ids = list({u.id for u in paired_users})

        for m_uid in mentor_user_ids:
            db.add(
                Notification(
                    user_id=m_uid,
                    title="New Student Assigned",
                    message=f"Admin assigned {student_name} to you.",
                    notification_type="MENTOR_ASSIGNMENT",
                    is_read=False,
                )
            )

        # 3. Notification for Admin audit feed
        db.add(
            Notification(
                user_id=admin.id,
                title="Mentor Assignment Updated",
                message=f"Assigned {mentor_name} as faculty mentor for {student_name}.",
                notification_type="MENTOR_ASSIGNMENT",
                is_read=False,
            )
        )
    else:
        # Unassign mentor
        student.mentor_id = None
        student_internships = (
            db.query(Internship)
            .filter(Internship.student_id == student.id)
            .all()
        )
        for intr in student_internships:
            intr.mentor_id = None

        db.add(
            Notification(
                user_id=student.user_id,
                title="Mentor Assignment Updated",
                message="Your faculty mentor assignment has been cleared by Admin.",
                notification_type="MENTOR_ASSIGNMENT",
                is_read=False,
            )
        )

    db.commit()
    db.refresh(student)
    return _build_admin_student_out(student, db)


@router.get("/analytics", response_model=InstitutionalAnalyticsSchema)
def get_institutional_analytics(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Computes institution-wide metrics, cohort attention distribution, lifecycle flow, and department overviews."""
    total_students = db.query(Student).count()
    # Count unique mentors (excluding demo alias row so mentor count matches directory)
    all_mentors = db.query(Mentor).all()
    total_mentors = sum(1 for m in all_mentors if not (m.user and m.user.email == "mentor@demo.com"))
    total_companies = db.query(Company).count()
    total_internships = db.query(Internship).count()
    active_internships = db.query(Internship).filter(Internship.status == "ACTIVE").count()
    available_internships = db.query(Internship).filter(Internship.status.in_(["AVAILABLE", "PUBLISHED", "OPEN"])).count()
    completed_internships = db.query(Internship).filter(Internship.status == "COMPLETED").count()
    pending_applications = db.query(Application).filter(Application.status == "PENDING").count()
    approved_applications = db.query(Application).filter(Application.status == "APPROVED").count()
    total_applications = db.query(Application).count()
    pending_mentor_allocations = db.query(Student).filter(Student.mentor_id == None).count()

    reports_submitted = db.query(WeeklyReport).filter(WeeklyReport.status == "SUBMITTED").count()
    reports_reviewed = db.query(WeeklyReport).filter(WeeklyReport.status == "REVIEWED").count()

    total_tasks = db.query(Task).count()
    completed_tasks = db.query(Task).filter(Task.is_completed == True).count()
    pending_tasks_count = max(0, total_tasks - completed_tasks)
    pending_work_count = pending_tasks_count + reports_submitted + pending_applications
    task_completion_rate = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0.0

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

    # Department breakdown
    students_all = db.query(Student).all()
    departments_map = {}
    for stu in students_all:
        dept = stu.department or "Computer Science & Engineering"
        if dept not in departments_map:
            departments_map[dept] = {"students": [], "active_placements": 0, "scores": []}
        departments_map[dept]["students"].append(stu)
        has_active = any(i.status == "ACTIVE" for i in stu.active_internships)
        if has_active:
            departments_map[dept]["active_placements"] += 1
            try:
                m = compute_student_attention_metrics(stu.id, db)
                departments_map[dept]["scores"].append(m.attention_score)
            except Exception:
                pass

    departments_out = []
    for dept_name, info in departments_map.items():
        s_count = len(info["students"])
        avg_dept_score = (
            round(sum(info["scores"]) / len(info["scores"]), 1) if info["scores"] else 80.0
        )
        dept_tasks = (
            db.query(Task)
            .join(Student, Task.student_id == Student.id)
            .filter(Student.department == dept_name)
            .all()
        )
        dept_tasks_comp = sum(1 for t in dept_tasks if t.is_completed)
        dept_comp_rate = (
            round((dept_tasks_comp / len(dept_tasks) * 100), 1) if dept_tasks else 0.0
        )
        departments_out.append(
            DepartmentAnalytics(
                department=dept_name,
                student_count=s_count,
                active_internships=info["active_placements"],
                completion_rate=dept_comp_rate,
                average_attention_score=avg_dept_score,
            )
        )

    lifecycle_data = LifecycleStages(
        applications_total=total_applications,
        applications_pending=pending_applications,
        applications_approved=approved_applications,
        active_internships=active_internships,
        reports_submitted=reports_submitted,
        reports_reviewed=reports_reviewed,
        completed_internships=completed_internships,
    )

    return InstitutionalAnalyticsSchema(
        total_students=total_students,
        total_mentors=total_mentors,
        total_companies=total_companies,
        total_internships=total_internships,
        active_internships=active_internships,
        available_internships=available_internships,
        total_applications=total_applications,
        pending_applications=pending_applications,
        pending_tasks_count=pending_tasks_count,
        pending_reports_count=reports_submitted,
        pending_work_count=pending_work_count,
        on_track_count=on_track_count,
        monitor_count=monitor_count,
        needs_attention_count=needs_attention_count,
        average_attention_score=avg_score,
        pending_mentor_allocations=pending_mentor_allocations,
        completed_internships=completed_internships,
        task_completion_rate=task_completion_rate,
        lifecycle=lifecycle_data,
        departments=departments_out,
    )


@router.get("/attention-queue")
def get_admin_attention_queue(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Returns all students currently flagged as NEEDS_ATTENTION or MONITOR with evidence reasons."""
    queue = []
    students_all = db.query(Student).order_by(Student.id.asc()).all()
    for stu in students_all:
        try:
            metrics = compute_student_attention_metrics(stu.id, db)
            if metrics.attention_status in ("NEEDS_ATTENTION", "MONITOR"):
                queue.append(
                    {
                        "student_id": stu.id,
                        "student_name": stu.user.full_name if stu.user else f"Student #{stu.id}",
                        "student_email": stu.user.email if stu.user else "",
                        "department": stu.department,
                        "attention_score": metrics.attention_score,
                        "attention_status": metrics.attention_status,
                        "reasons": metrics.reasons,
                        "recommendations": metrics.recommendations,
                    }
                )
        except Exception:
            continue
    return queue


# ==============================================================================
# ADMIN — COMPANY MANAGEMENT
# ==============================================================================


def _build_company_out(comp: Company, db: Session) -> CompanyOut:
    total_ints = db.query(Internship).filter(Internship.company_id == comp.id).count()
    active_ints = (
        db.query(Internship)
        .filter(Internship.company_id == comp.id, Internship.status.in_(["AVAILABLE", "ACTIVE", "PUBLISHED"]))
        .count()
    )
    first_int = db.query(Internship).filter(Internship.company_id == comp.id).first()
    derived_loc = getattr(comp, "location", None) or (
        comp.description if comp.description and len(comp.description) <= 80 else (first_int.location if first_int else "Global")
    )
    return CompanyOut(
        id=comp.id,
        name=comp.name,
        industry=comp.industry,
        location=derived_loc or "Global",
        website=comp.website,
        contact_email=comp.contact_email,
        description=comp.description,
        is_verified=True,
        is_active=getattr(comp, "is_active", True),
        internships_count=total_ints,
        active_internships_count=active_ints,
    )


@router.get("/companies", response_model=List[CompanyOut])
def list_admin_companies(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Lists all partner companies from the database for Admin management."""
    companies = db.query(Company).order_by(Company.name.asc()).all()
    return [_build_company_out(c, db) for c in companies]


@router.post("/companies", response_model=CompanyOut, status_code=status.HTTP_201_CREATED)
def create_admin_company(
    payload: CompanyCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Creates a new partner company record in the database (Admin only)."""
    clean_name = payload.name.strip()
    if not clean_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Company name cannot be empty")

    existing = db.query(Company).filter(Company.name.ilike(clean_name)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A company with this name already exists")

    desc_val = payload.description.strip() if payload.description else (payload.location.strip() if payload.location else None)
    comp = Company(
        name=clean_name,
        industry=payload.industry.strip() if payload.industry else "Technology",
        website=payload.website.strip() if payload.website else None,
        contact_email=payload.contact_email.strip() if payload.contact_email else None,
        description=desc_val,
        is_active=payload.is_active,
    )
    db.add(comp)
    db.commit()
    db.refresh(comp)
    return _build_company_out(comp, db)


@router.put("/companies/{company_id}", response_model=CompanyOut)
@router.patch("/companies/{company_id}", response_model=CompanyOut)
def update_admin_company(
    company_id: int,
    payload: CompanyUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Updates an existing partner company record (Admin only)."""
    comp = db.query(Company).filter(Company.id == company_id).first()
    if not comp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

    if payload.name is not None:
        clean_name = payload.name.strip()
        if not clean_name:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Company name cannot be empty")
        dup = db.query(Company).filter(Company.name == clean_name, Company.id != company_id).first()
        if dup:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Another company with this name already exists")
        comp.name = clean_name

    if payload.industry is not None:
        comp.industry = payload.industry.strip()
    if payload.website is not None:
        comp.website = payload.website.strip() or None
    if payload.contact_email is not None:
        comp.contact_email = payload.contact_email.strip() or None
    if payload.location is not None:
        comp.description = payload.location.strip() or comp.description
    if payload.description is not None:
        comp.description = payload.description.strip() or None
    if payload.is_active is not None:
        comp.is_active = payload.is_active

    db.commit()
    db.refresh(comp)
    return _build_company_out(comp, db)


# ==============================================================================
# ADMIN — INTERNSHIP MANAGEMENT & PUBLISHING
# ==============================================================================


@router.get("/internships", response_model=List[InternshipOut])
def list_admin_internships(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Lists all internships across all statuses for Admin management."""
    internships = db.query(Internship).order_by(Internship.id.desc()).all()
    return [format_internship_out(i) for i in internships]


@router.post("/internships", response_model=InternshipOut, status_code=status.HTTP_201_CREATED)
def create_admin_internship(
    payload: InternshipCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Creates a new internship via Admin portal."""
    return create_internship(payload=payload, db=db, current_admin=admin)


@router.put("/internships/{internship_id}", response_model=InternshipOut)
def update_admin_internship(
    internship_id: int,
    payload: InternshipUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Updates an existing internship via Admin portal."""
    return update_internship(internship_id=internship_id, payload=payload, db=db, current_admin=admin)


@router.post("/internships/{internship_id}/publish", response_model=InternshipOut)
def publish_admin_internship(
    internship_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Publishes an internship opportunity and triggers Student & Mentor notifications."""
    return publish_internship(internship_id=internship_id, db=db, current_admin=admin)


@router.post("/internships/{internship_id}/unpublish", response_model=InternshipOut)
def unpublish_admin_internship(
    internship_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Unpublishes/deactivates an internship opportunity."""
    return unpublish_internship(internship_id=internship_id, db=db, current_admin=admin)


@router.get("/reports", response_model=List[WeeklyReportOut])
def list_admin_reports(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Returns all weekly logbook reports across all students from the database."""
    reports = (
        db.query(WeeklyReport)
        .order_by(WeeklyReport.submitted_at.desc(), WeeklyReport.week_number.desc())
        .all()
    )
    out = []
    for r in reports:
        student_name = (
            r.student.user.full_name
            if r.student and r.student.user
            else f"Student #{r.student_id}"
        )
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


@router.get("/interventions", response_model=List[InterventionOut])
def list_admin_interventions(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Returns all mentor/faculty intervention logs across all students from the database."""
    interventions = (
        db.query(Intervention)
        .order_by(Intervention.created_at.desc())
        .all()
    )
    out = []
    for i in interventions:
        mentor_name = (
            i.mentor.user.full_name
            if i.mentor and i.mentor.user
            else f"Mentor #{i.mentor_id}"
        )
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


