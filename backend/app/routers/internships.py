import json
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_admin, get_current_student, get_current_user
from backend.app.models import (
    Application,
    Company,
    Internship,
    InternshipSkill,
    Mentor,
    Notification,
    Student,
    StudentSkill,
    Task,
    User,
)
from backend.app.schemas import (
    ApplicationCreate,
    ApplicationOut,
    ApplicationSubmitPayload,
    InternshipCreate,
    InternshipOut,
    InternshipUpdate,
    TaskOut,
)
from intelligence.app.skill_gap import analyze_skill_gap

router = APIRouter(prefix="/internships", tags=["Internships"])


INTERNSHIP_DOMAINS = [
    "Software Development",
    "Web Development",
    "Data Science",
    "Artificial Intelligence",
    "Machine Learning",
    "Cyber Security",
    "Cloud Computing",
    "DevOps",
    "Data Analytics",
    "IoT",
    "Embedded Systems",
    "Blockchain",
    "UI/UX",
    "Networking",
]


def format_internship_out(internship: Internship) -> InternshipOut:
    company_name = internship.company.name if internship.company else "Unknown Company"
    company_industry = internship.company.industry if internship.company else "Technology"
    mentor_name = internship.mentor.user.full_name if internship.mentor and internship.mentor.user else None
    student_name = internship.student.user.full_name if internship.student and internship.student.user else None
    skills = [s.skill_name for s in internship.skills]
    domain_val = getattr(internship, "domain", None) or "Software Development"
    completion_st = getattr(internship, "completion_status", None) or (
        "COMPLETED" if internship.status == "COMPLETED" else "IN_PROGRESS"
    )

    coordinator_name = None
    coordinator_email = None
    if internship and internship.company and getattr(internship.company, "external_mentors", None) and len(internship.company.external_mentors) > 0:
        first_ext = internship.company.external_mentors[0]
        if first_ext and first_ext.user:
            coordinator_name = first_ext.user.full_name
            coordinator_email = first_ext.user.email

    if not coordinator_name and internship and internship.company_id:
        from sqlalchemy.orm import object_session
        s = object_session(internship)
        if s:
            from backend.app.models import ExternalMentor
            ext = s.query(ExternalMentor).filter(ExternalMentor.company_id == internship.company_id).first()
            if ext and ext.user:
                coordinator_name = ext.user.full_name
                coordinator_email = ext.user.email

    if not coordinator_name and internship and internship.student_id:
        from sqlalchemy.orm import object_session
        s = object_session(internship)
        if s:
            from backend.app.models import ExternalMentorStudent, ExternalMentor
            link = s.query(ExternalMentorStudent).filter(ExternalMentorStudent.student_id == internship.student_id).first()
            if link:
                ext = link.external_mentor or s.query(ExternalMentor).filter(ExternalMentor.id == link.external_mentor_id).first()
                if ext and ext.user:
                    coordinator_name = ext.user.full_name
                    coordinator_email = ext.user.email

    return InternshipOut(
        id=internship.id,
        title=internship.title,
        company_id=internship.company_id,
        company_name=company_name,
        company_industry=company_industry,
        domain=domain_val,
        location=internship.location,
        is_remote=internship.is_remote,
        stipend=internship.stipend,
        duration_weeks=internship.duration_weeks,
        status=internship.status,
        completion_status=completion_st,
        description=internship.description,
        required_skills=skills,
        deadline=internship.deadline,
        start_date=internship.start_date,
        end_date=internship.end_date,
        mentor_id=internship.mentor_id,
        mentor_name=mentor_name,
        student_id=internship.student_id,
        student_name=student_name,
        company_coordinator_name=coordinator_name,
        company_coordinator_email=coordinator_email,
        created_at=internship.created_at,
    )


def notify_internship_published(
    internship: Internship,
    db: Session,
    admin_user: Optional[User] = None,
) -> None:
    """Generates database-backed notifications for all Students and Mentors when an internship is published."""
    company_name = internship.company.name if internship.company else "Partner Company"
    title = internship.title

    student_msg = f"{company_name} has published a {title} opportunity."
    students = db.query(Student).all()
    notified_student_users = set()
    for st in students:
        if st.user_id and st.user_id not in notified_student_users:
            notified_student_users.add(st.user_id)
            db.add(
                Notification(
                    user_id=st.user_id,
                    title="New Internship Published",
                    message=student_msg,
                    notification_type="INTERNSHIP_PUBLISHED",
                    is_read=False,
                )
            )

    mentor_msg = f"{company_name} — {title} has been published."
    mentors = db.query(Mentor).all()
    notified_mentor_users = set()
    for m in mentors:
        if m.user_id and m.user_id not in notified_mentor_users:
            notified_mentor_users.add(m.user_id)
            db.add(
                Notification(
                    user_id=m.user_id,
                    title="New Internship Opportunity",
                    message=mentor_msg,
                    notification_type="INTERNSHIP_PUBLISHED",
                    is_read=False,
                )
            )

    if admin_user and admin_user.id:
        db.add(
            Notification(
                user_id=admin_user.id,
                title="Internship Published",
                message=f"{company_name} — {title} has been published to Student and Mentor portals.",
                notification_type="INTERNSHIP_PUBLISHED",
                is_read=False,
            )
        )


@router.get("/domains", response_model=List[str])
def list_internship_domains(db: Session = Depends(get_db)):
    """Returns all supported internship domains combined with any custom domains in the database."""
    db_domains = [
        r[0].strip()
        for r in db.query(Internship.domain).distinct().all()
        if r and r[0] and r[0].strip()
    ]
    seen = {d.lower() for d in INTERNSHIP_DOMAINS}
    combined = list(INTERNSHIP_DOMAINS)
    for d in db_domains:
        if d.lower() not in seen:
            seen.add(d.lower())
            combined.append(d)
    return combined


@router.get("", response_model=List[InternshipOut])
def list_internships(
    status_filter: Optional[str] = Query(None, alias="status"),
    domain: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Lists internships with optional status, domain, and search filters (title, company, domain, description)."""
    query = db.query(Internship).outerjoin(Company, Internship.company_id == Company.id)

    if status_filter:
        upper_status = status_filter.upper()
        if upper_status in ("AVAILABLE", "PUBLISHED", "OPEN"):
            query = query.filter(Internship.status.in_(["AVAILABLE", "PUBLISHED", "OPEN"]))
        else:
            query = query.filter(Internship.status == upper_status)

    if domain and domain.strip() and domain.strip().upper() != "ALL":
        clean_domain = domain.strip()
        query = query.filter(Internship.domain.ilike(clean_domain))

    if search and search.strip():
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (Internship.title.ilike(search_pattern))
            | (Internship.description.ilike(search_pattern))
            | (Internship.domain.ilike(search_pattern))
            | (Company.name.ilike(search_pattern))
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
    """Creates a new internship opportunity (Admin only) and optionally publishes it with notifications."""
    company = None
    if payload.company_id:
        company = db.query(Company).filter(Company.id == payload.company_id).first()
        if not company:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Selected company not found")
    elif payload.company_name and payload.company_name.strip():
        clean_cname = payload.company_name.strip()
        company = db.query(Company).filter(Company.name == clean_cname).first()
        if not company:
            company = Company(
                name=clean_cname,
                industry=payload.industry or "Technology",
                is_active=True,
            )
            db.add(company)
            db.flush()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either company_id or company_name must be provided",
        )

    desired_status = (payload.status or "AVAILABLE").upper()
    if payload.publish and desired_status in ("AVAILABLE", "PUBLISHED", "OPEN"):
        final_status = "AVAILABLE"
    elif not payload.publish and desired_status == "AVAILABLE":
        final_status = "DRAFT"
    else:
        final_status = "AVAILABLE" if desired_status == "PUBLISHED" else desired_status

    domain_val = (payload.domain or "Software Development").strip() or "Software Development"

    new_internship = Internship(
        title=payload.title.strip(),
        company_id=company.id,
        domain=domain_val,
        description=payload.description.strip(),
        location=payload.location.strip() if payload.location else "Remote",
        is_remote=payload.is_remote,
        stipend=payload.stipend,
        duration_weeks=payload.duration_weeks,
        deadline=payload.deadline,
        status=final_status,
        completion_status="IN_PROGRESS",
    )
    db.add(new_internship)
    db.flush()

    for skill in payload.required_skills:
        clean_skill = skill.strip()
        if clean_skill:
            db.add(InternshipSkill(internship_id=new_internship.id, skill_name=clean_skill))

    db.refresh(new_internship)
    if final_status == "AVAILABLE":
        notify_internship_published(new_internship, db, current_admin)

    db.commit()
    db.refresh(new_internship)
    return format_internship_out(new_internship)


@router.put("/{internship_id}", response_model=InternshipOut)
def update_internship(
    internship_id: int,
    payload: InternshipUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Updates an existing internship opportunity (Admin only)."""
    internship = db.query(Internship).filter(Internship.id == internship_id).first()
    if not internship:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Internship not found")

    prev_status = internship.status

    if payload.company_id is not None:
        comp = db.query(Company).filter(Company.id == payload.company_id).first()
        if not comp:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Selected company not found")
        internship.company_id = comp.id
    elif payload.company_name and payload.company_name.strip():
        clean_cname = payload.company_name.strip()
        comp = db.query(Company).filter(Company.name == clean_cname).first()
        if not comp:
            comp = Company(
                name=clean_cname,
                industry=payload.industry or "Technology",
                is_active=True,
            )
            db.add(comp)
            db.flush()
        internship.company_id = comp.id

    if payload.title is not None:
        internship.title = payload.title.strip()
    if payload.domain is not None and payload.domain.strip():
        internship.domain = payload.domain.strip()
    if payload.description is not None:
        internship.description = payload.description.strip()
    if payload.location is not None:
        internship.location = payload.location.strip()
    if payload.is_remote is not None:
        internship.is_remote = payload.is_remote
    if payload.stipend is not None:
        internship.stipend = payload.stipend
    if payload.duration_weeks is not None:
        internship.duration_weeks = payload.duration_weeks
    if payload.deadline is not None:
        internship.deadline = payload.deadline
    if payload.status is not None:
        norm_st = payload.status.upper()
        internship.status = "AVAILABLE" if norm_st == "PUBLISHED" else norm_st
        if internship.status == "COMPLETED":
            internship.completion_status = "COMPLETED"
    if payload.completion_status is not None:
        internship.completion_status = payload.completion_status.upper()

    if payload.required_skills is not None:
        db.query(InternshipSkill).filter(InternshipSkill.internship_id == internship.id).delete()
        for skill in payload.required_skills:
            clean_skill = skill.strip()
            if clean_skill:
                db.add(InternshipSkill(internship_id=internship.id, skill_name=clean_skill))

    db.flush()
    db.refresh(internship)
    if prev_status != "AVAILABLE" and internship.status == "AVAILABLE":
        notify_internship_published(internship, db, current_admin)

    db.commit()
    db.refresh(internship)
    return format_internship_out(internship)


@router.post("/{internship_id}/publish", response_model=InternshipOut)
def publish_internship(
    internship_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Publishes an internship opportunity (sets status=AVAILABLE) and notifies all Students and Mentors."""
    internship = db.query(Internship).filter(Internship.id == internship_id).first()
    if not internship:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Internship not found")

    if not internship.title or not internship.description or not internship.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Internship is missing required title, company, or description fields",
        )

    internship.status = "AVAILABLE"
    db.flush()
    db.refresh(internship)
    notify_internship_published(internship, db, current_admin)
    db.commit()
    db.refresh(internship)
    return format_internship_out(internship)


@router.post("/{internship_id}/unpublish", response_model=InternshipOut)
def unpublish_internship(
    internship_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Unpublishes/deactivates an internship opportunity (sets status=CLOSED)."""
    internship = db.query(Internship).filter(Internship.id == internship_id).first()
    if not internship:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Internship not found")

    internship.status = "CLOSED"
    db.commit()
    db.refresh(internship)
    return format_internship_out(internship)


def format_task_out(task: Task, db: Optional[Session] = None) -> TaskOut:
    internship = task.internship
    internship_title = internship.title if internship else None
    company_name = internship.company.name if internship and internship.company else None
    now = datetime.now(timezone.utc)
    due = task.due_date
    if due is not None and due.tzinfo is None:
        due = due.replace(tzinfo=timezone.utc)

    if task.is_completed or getattr(task, "status", None) == "COMPLETED":
        computed_status = "COMPLETED"
    elif due is not None and due < now:
        computed_status = "OVERDUE"
    else:
        computed_status = getattr(task, "status", None) or "PENDING"

    # 1. Resolve student full name
    student_name = None
    student_obj = getattr(task, "student", None)
    if student_obj and getattr(student_obj, "user", None):
        student_name = student_obj.user.full_name
    elif db and task.student_id:
        from backend.app.models import Student, User
        st = db.query(Student).filter(Student.id == task.student_id).first()
        if st:
            student_obj = st
            if st.user:
                student_name = st.user.full_name
            elif st.user_id:
                u = db.query(User).filter(User.id == st.user_id).first()
                if u:
                    student_name = u.full_name

    # 2. Resolve company coordinator details
    coordinator_name = None
    coordinator_email = None
    ext_mentor = getattr(task, "external_mentor", None)
    if not ext_mentor and getattr(task, "external_mentor_id", None) and db:
        from backend.app.models import ExternalMentor
        ext_mentor = db.query(ExternalMentor).filter(ExternalMentor.id == task.external_mentor_id).first()

    if ext_mentor and ext_mentor.user:
        coordinator_name = ext_mentor.user.full_name
        coordinator_email = ext_mentor.user.email
    elif internship and internship.company and getattr(internship.company, "external_mentors", None):
        first_ext = internship.company.external_mentors[0]
        if first_ext and first_ext.user:
            coordinator_name = first_ext.user.full_name
            coordinator_email = first_ext.user.email
    elif db and internship and internship.company_id:
        from backend.app.models import ExternalMentor
        first_ext = db.query(ExternalMentor).filter(ExternalMentor.company_id == internship.company_id).first()
        if first_ext and first_ext.user:
            coordinator_name = first_ext.user.full_name
            coordinator_email = first_ext.user.email

    # 3. Resolve Internal Faculty Mentor real full name (never generic text)
    internal_mentor_name = None
    mentor_obj = getattr(task, "mentor", None)
    if mentor_obj and getattr(mentor_obj, "user", None):
        internal_mentor_name = mentor_obj.user.full_name
    elif student_obj and getattr(student_obj, "assigned_mentor", None) and getattr(student_obj.assigned_mentor, "user", None):
        internal_mentor_name = student_obj.assigned_mentor.user.full_name
    elif internship and getattr(internship, "mentor", None) and getattr(internship.mentor, "user", None):
        internal_mentor_name = internship.mentor.user.full_name
    elif db:
        from backend.app.models import Mentor
        target_m_id = getattr(task, "mentor_id", None) or (student_obj.mentor_id if student_obj else None)
        if target_m_id:
            m = db.query(Mentor).filter(Mentor.id == target_m_id).first()
            if m and m.user:
                internal_mentor_name = m.user.full_name

    # 4. Assigned By: MUST be the Company Coordinator, NEVER Internal Mentor
    if coordinator_name:
        assigned_by = coordinator_name
    elif getattr(task, "assigned_by", None):
        assigned_by = task.assigned_by
    else:
        assigned_by = "Company Coordinator"

    source = getattr(task, "source", None) or "Company Provided"

    return TaskOut(
        id=task.id,
        internship_id=task.internship_id,
        student_id=task.student_id,
        student_name=student_name,
        application_id=getattr(task, "application_id", None),
        mentor_id=getattr(task, "mentor_id", None),
        internal_mentor_name=internal_mentor_name,
        external_mentor_id=getattr(task, "external_mentor_id", None) or (ext_mentor.id if ext_mentor else None),
        internship_title=internship_title,
        company_name=company_name,
        company_coordinator_name=coordinator_name,
        company_coordinator_email=coordinator_email,
        assigned_by=assigned_by,
        source=source,
        title=task.title,
        description=task.description,
        priority=getattr(task, "priority", None) or "MEDIUM",
        status=computed_status,
        due_date=task.due_date,
        is_completed=bool(task.is_completed or getattr(task, "status", None) == "COMPLETED"),
        completed_at=task.completed_at,
        feedback=getattr(task, "feedback", None),
        score=getattr(task, "score", None),
        task_link=getattr(task, "task_link", None),
        evidence_url=getattr(task, "task_link", None),
        created_at=task.created_at,
    )


def generate_internship_specific_tasks(
    db: Session,
    student_id: int,
    internship: Internship,
    application_id: Optional[int] = None,
    mentor_id: Optional[int] = None,
    missing_skills: Optional[List[str]] = None,
) -> List[Task]:
    """
    Generates DB-backed tasks specifically tailored to the internship's title, company,
    required skills, and student skill gap. Avoids duplicate creation if tasks already exist.
    """
    existing_tasks = (
        db.query(Task)
        .filter(Task.student_id == student_id, Task.internship_id == internship.id)
        .order_by(Task.id.asc())
        .all()
    )
    if existing_tasks:
        updated = False
        for t in existing_tasks:
            if application_id and getattr(t, "application_id", None) is None:
                t.application_id = application_id
                updated = True
            if mentor_id and getattr(t, "mentor_id", None) is None:
                t.mentor_id = mentor_id
                updated = True
        if updated:
            db.flush()
        return existing_tasks

    company_name = internship.company.name if internship.company else "Partner Company"
    req_skills = [s.skill_name for s in internship.skills if s.skill_name]
    if not req_skills:
        req_skills = ["Python", "SQL", "Git"]

    primary_skill = req_skills[0]
    secondary_skill = req_skills[1] if len(req_skills) > 1 else primary_skill
    skills_summary = ", ".join(req_skills[:4])
    gap_list = [s for s in (missing_skills or []) if s]

    now = datetime.now(timezone.utc)
    task_specs = [
        {
            "title": f"{primary_skill} Technical Assessment — {internship.title}",
            "description": (
                f"Complete the core {primary_skill} coding and problem-solving assessment "
                f"required for the {internship.title} role at {company_name}."
            ),
            "priority": "HIGH",
            "due_date": now + timedelta(days=7),
        },
    ]

    if gap_list:
        gap_str = ", ".join(gap_list[:3])
        task_specs.append(
            {
                "title": f"Skill-Gap Preparation Module: {gap_str}",
                "description": (
                    f"Complete guided practical exercises in {gap_str} to bridge the "
                    f"identified skill gap for {internship.title} at {company_name}."
                ),
                "priority": "HIGH",
                "due_date": now + timedelta(days=12),
            }
        )
    else:
        task_specs.append(
            {
                "title": f"{secondary_skill} Fundamentals & Workflow Lab",
                "description": (
                    f"Complete hands-on {secondary_skill} implementation exercises aligned with "
                    f"{company_name}'s engineering standards for {internship.title}."
                ),
                "priority": "MEDIUM",
                "due_date": now + timedelta(days=12),
            }
        )

    task_specs.extend(
        [
            {
                "title": f"{company_name} Stack & Codebase Orientation ({skills_summary})",
                "description": (
                    f"Set up the local development environment, review reference architecture, "
                    f"and verify {skills_summary} tooling for {internship.title}."
                ),
                "priority": "MEDIUM",
                "due_date": now + timedelta(days=18),
            },
            {
                "title": f"{internship.title} Applied Mini-Project ({skills_summary})",
                "description": (
                    f"Build, test, and document a domain-specific mini-project using {skills_summary} "
                    f"demonstrating readiness for {company_name}."
                ),
                "priority": "HIGH",
                "due_date": now + timedelta(days=24),
            },
            {
                "title": f"{internship.title} Preparation & Technical Readiness Report",
                "description": (
                    f"Compile assessment outcomes, repository links, and weekly progress reflection "
                    f"for faculty mentor review."
                ),
                "priority": "MEDIUM",
                "due_date": now + timedelta(days=30),
            },
        ]
    )

    ext_mentor = None
    if internship.company_id:
        from backend.app.models import ExternalMentor
        ext_mentor = db.query(ExternalMentor).filter(ExternalMentor.company_id == internship.company_id).first()
    coordinator_name = ext_mentor.user.full_name if ext_mentor and ext_mentor.user else "Company Coordinator"

    created_tasks: List[Task] = []
    for spec in task_specs:
        t = Task(
            internship_id=internship.id,
            student_id=student_id,
            application_id=application_id,
            mentor_id=mentor_id,
            external_mentor_id=ext_mentor.id if ext_mentor else None,
            assigned_by=coordinator_name,
            source="Company Provided",
            title=spec["title"],
            description=spec["description"],
            priority=spec["priority"],
            status="PENDING",
            due_date=spec["due_date"],
            is_completed=False,
        )
        db.add(t)
        created_tasks.append(t)

    db.flush()
    return created_tasks


def _safe_json_loads(raw: Optional[str], fallback: Any) -> Any:
    if not raw:
        return fallback
    try:
        return json.loads(raw)
    except Exception:
        return fallback


def build_application_out(db: Session, app: Application) -> ApplicationOut:
    student = app.student
    internship = app.internship
    student_name = student.user.full_name if student and student.user else "Unknown Student"
    student_email = student.user.email if student and student.user else ""
    internship_title = internship.title if internship else "Unknown Internship"
    company_name = internship.company.name if internship and internship.company else "Unknown Company"
    domain_val = (getattr(internship, "domain", None) if internship else None) or "Software Development"
    required_skills = [s.skill_name for s in internship.skills] if internship else []
    profile_skills = [s.skill_name for s in student.skills] if student else []

    submitted_skills = _safe_json_loads(getattr(app, "submitted_skills", None), None)
    if not submitted_skills:
        submitted_skills = profile_skills

    matched_skills = _safe_json_loads(getattr(app, "matched_skills", None), None)
    missing_skills = _safe_json_loads(getattr(app, "missing_skills", None), None)
    skill_match_pct = getattr(app, "skill_match_percentage", None)
    skill_rec = getattr(app, "skill_recommendation", None)

    # Dynamically compute and backfill if not yet calculated on legacy rows
    if matched_skills is None or missing_skills is None or (skill_match_pct is None):
        gap = analyze_skill_gap(submitted_skills or profile_skills, required_skills)
        matched_skills = gap.matched_skills
        missing_skills = gap.missing_skills
        skill_match_pct = float(gap.match_percentage)
        skill_rec = gap.recommendation
    elif not matched_skills and not missing_skills and required_skills:
        gap = analyze_skill_gap(submitted_skills or profile_skills, required_skills)
        matched_skills = gap.matched_skills
        missing_skills = gap.missing_skills
        skill_match_pct = float(gap.match_percentage)
        skill_rec = gap.recommendation

    app_data = _safe_json_loads(getattr(app, "application_data", None), None)

    mentor_obj = None
    if student and student.assigned_mentor:
        mentor_obj = student.assigned_mentor
    elif internship and internship.mentor:
        mentor_obj = internship.mentor

    mentor_id = mentor_obj.id if mentor_obj else None
    mentor_name = mentor_obj.user.full_name if mentor_obj and mentor_obj.user else None
    mentor_code = mentor_obj.employee_id if mentor_obj else None

    tasks = (
        db.query(Task)
        .filter(Task.student_id == app.student_id, Task.internship_id == app.internship_id)
        .order_by(Task.id.asc())
        .all()
    )
    task_outs = [format_task_out(t, db=db) for t in tasks]
    tasks_total = len(task_outs)
    tasks_completed = sum(1 for t in task_outs if t.is_completed or t.status == "COMPLETED")

    coordinator_name = None
    coordinator_email = None
    from backend.app.models import ExternalMentorStudent, ExternalMentor
    direct_link = (
        db.query(ExternalMentorStudent)
        .filter(ExternalMentorStudent.student_id == app.student_id)
        .first()
    )
    if direct_link:
        ext_m = direct_link.external_mentor or db.query(ExternalMentor).filter(ExternalMentor.id == direct_link.external_mentor_id).first()
        if ext_m and ext_m.user:
            coordinator_name = ext_m.user.full_name
            coordinator_email = ext_m.user.email

    if not coordinator_name and internship and internship.company_id:
        ext_m = db.query(ExternalMentor).filter(ExternalMentor.company_id == internship.company_id).first()
        if ext_m and ext_m.user:
            coordinator_name = ext_m.user.full_name
            coordinator_email = ext_m.user.email

    return ApplicationOut(
        id=app.id,
        student_id=app.student_id,
        student_name=student_name,
        student_email=student_email,
        internship_id=app.internship_id,
        internship_title=internship_title,
        company_name=company_name,
        domain=domain_val,
        status=app.status,
        applied_at=app.applied_at,
        reviewed_at=app.reviewed_at,
        review_notes=app.review_notes,
        skill_match_percentage=round(float(skill_match_pct or 0.0), 2),
        matched_skills=matched_skills or [],
        missing_skills=missing_skills or [],
        skill_recommendation=skill_rec,
        required_skills=required_skills,
        submitted_skills=submitted_skills or [],
        application_data=app_data,
        mentor_id=mentor_id,
        mentor_name=mentor_name,
        mentor_code=mentor_code,
        tasks_total=tasks_total,
        tasks_completed=tasks_completed,
        tasks=task_outs,
        company_coordinator_name=coordinator_name,
        company_coordinator_email=coordinator_email,
    )


@router.post("/{internship_id}/apply", response_model=ApplicationOut)
def apply_to_internship(
    internship_id: int,
    payload: Optional[ApplicationSubmitPayload] = Body(default=None),
    db: Session = Depends(get_db),
    student_ctx=Depends(get_current_student),
):
    """
    Submits a comprehensive DB-backed internship application (Student only).
    1. Validates internship availability & prevents duplicate applications.
    2. Persists structured student application data & syncs newly entered skills.
    3. Computes deterministic Skill Match % and Skill Gap analysis.
    4. Automatically generates internship-specific preparation & milestone tasks.
    5. Dispatches DB notifications to Student, Mentor, and Admin.
    """
    user, student = student_ctx

    internship = db.query(Internship).filter(Internship.id == internship_id).first()
    if not internship:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Internship not found")

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

    if internship.status not in ["AVAILABLE", "OPEN", "PUBLISHED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Internship is currently {internship.status} and not accepting applications",
        )

    # Gather existing student profile skills
    existing_skill_Map = {s.skill_name.strip().lower(): s.skill_name.strip() for s in student.skills if s.skill_name}
    collected_skills: List[str] = list(existing_skill_Map.values())

    app_data_dict: Dict[str, Any] = {
        "full_name": user.full_name,
        "email": user.email,
        "phone": student.phone or "",
        "college": "University Institute of Technology",
        "degree": "B.Tech / B.E.",
        "department": student.department,
        "current_year": student.academic_year,
        "graduation_year": 2026 + max(0, 4 - (student.academic_year or 3)),
    }

    if payload is not None:
        raw_payload = payload.model_dump(exclude_none=True)
        app_data_dict.update(raw_payload)

        if payload.phone and payload.phone.strip():
            student.phone = payload.phone.strip()
        if payload.department and payload.department.strip():
            student.department = payload.department.strip()
        if payload.current_year is not None and 1 <= payload.current_year <= 6:
            student.academic_year = payload.current_year

        # Collect skills across all skill categories in the application form
        skill_buckets = [
            payload.skills or [],
            payload.technical_skills or [],
            payload.programming_languages or [],
            payload.frameworks or [],
            payload.tools or [],
            payload.soft_skills or [],
        ]
        form_skills: List[str] = []
        seen_lower = set()
        for bucket in skill_buckets:
            for sk in bucket:
                if isinstance(sk, str):
                    for part in sk.split(","):
                        clean_sk = part.strip()
                        if clean_sk and clean_sk.lower() not in seen_lower:
                            seen_lower.add(clean_sk.lower())
                            form_skills.append(clean_sk)

        if form_skills:
            # Merge form skills and persist any new ones into student_skills
            for sk in form_skills:
                if sk.lower() not in existing_skill_Map:
                    db.add(StudentSkill(student_id=student.id, skill_name=sk))
                    existing_skill_Map[sk.lower()] = sk
            # Prioritize form skills while keeping profile skills
            merged = list(form_skills)
            for prof_sk in collected_skills:
                if prof_sk.lower() not in seen_lower:
                    merged.append(prof_sk)
            collected_skills = merged

    db.flush()

    # Calculate Skill Match & Skill Gap against the internship's required skills
    required_skills = [s.skill_name for s in internship.skills if s.skill_name]
    gap_result = analyze_skill_gap(collected_skills, required_skills)

    app = Application(
        student_id=student.id,
        internship_id=internship.id,
        status="PENDING",
        application_data=json.dumps(app_data_dict),
        submitted_skills=json.dumps(collected_skills),
        skill_match_percentage=float(gap_result.match_percentage),
        matched_skills=json.dumps(gap_result.matched_skills),
        missing_skills=json.dumps(gap_result.missing_skills),
        skill_recommendation=gap_result.recommendation,
    )
    db.add(app)
    db.flush()

    # Automatically generate internship-specific tasks for this student & internship
    effective_mentor_id = student.mentor_id or internship.mentor_id
    created_tasks = generate_internship_specific_tasks(
        db=db,
        student_id=student.id,
        internship=internship,
        application_id=app.id,
        mentor_id=effective_mentor_id,
        missing_skills=gap_result.missing_skills,
    )

    company_name = internship.company.name if internship.company else "Partner Company"
    match_pct_str = f"{gap_result.match_percentage}%"
    gap_summary = (
        f"Missing skills: {', '.join(gap_result.missing_skills)}."
        if gap_result.missing_skills
        else "All required skills matched!"
    )

    # 1. Student Notification: Application + Skill Match/Gap Analysis
    db.add(
        Notification(
            user_id=user.id,
            title=f"Application Submitted: {internship.title}",
            message=(
                f"Your application for {internship.title} at {company_name} has been submitted. "
                f"Skill Match: {match_pct_str}. {gap_summary}"
            ),
            notification_type="APPLICATION",
            is_read=False,
        )
    )

    # 2. Student Notification: Internship-Specific Tasks Assigned
    if created_tasks:
        db.add(
            Notification(
                user_id=user.id,
                title=f"Internship Tasks Assigned: {internship.title}",
                message=(
                    f"{len(created_tasks)} internship-specific preparation & milestone tasks have been "
                    f"assigned for {internship.title} at {company_name}."
                ),
                notification_type="TASK_ASSIGNED",
                is_read=False,
            )
        )

    # 3. Mentor Notification (if student has an assigned mentor)
    if effective_mentor_id:
        mentor = db.query(Mentor).filter(Mentor.id == effective_mentor_id).first()
        if mentor and mentor.user_id:
            db.add(
                Notification(
                    user_id=mentor.user_id,
                    title="Assigned Student Applied for Internship",
                    message=(
                        f"{user.full_name} applied for {internship.title} at {company_name} "
                        f"(Skill Match: {match_pct_str}). {len(created_tasks)} tasks assigned."
                    ),
                    notification_type="APPLICATION",
                    is_read=False,
                )
            )

    # 4. Admin Notification
    admins = db.query(User).filter(User.role == "ADMIN").all()
    for adm in admins:
        db.add(
            Notification(
                user_id=adm.id,
                title="New Internship Application Received",
                message=(
                    f"{user.full_name} ({student.roll_number}) applied for {internship.title} "
                    f"at {company_name} with a {match_pct_str} skill match."
                ),
                notification_type="APPLICATION",
                is_read=False,
            )
        )

    db.commit()
    db.refresh(app)

    return build_application_out(db, app)
