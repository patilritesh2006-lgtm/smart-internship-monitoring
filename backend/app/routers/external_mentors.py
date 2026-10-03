from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_external_mentor
from backend.app.models import (
    Company,
    ExternalMentor,
    ExternalMentorStudent,
    Internship,
    Notification,
    Student,
    Task,
    User,
    WeeklyReport,
)
from backend.app.routers.internships import format_task_out
from backend.app.schemas import ExternalMentorOut, TaskCreateByCoordinator, TaskOut

router = APIRouter(prefix="/external-mentors", tags=["External Mentors"])


def _build_external_mentor_out(db: Session, ext_mentor: ExternalMentor) -> ExternalMentorOut:
    user = ext_mentor.user or db.query(User).filter(User.id == ext_mentor.user_id).first()
    company = ext_mentor.company or db.query(Company).filter(Company.id == ext_mentor.company_id).first()
    company_name = company.name if company else "Company"

    assigned_links = (
        db.query(ExternalMentorStudent)
        .filter(ExternalMentorStudent.external_mentor_id == ext_mentor.id)
        .all()
    )
    assigned_students_list: List[Dict[str, Any]] = []
    seen_student_ids = set()

    for link in assigned_links:
        st = link.student or db.query(Student).filter(Student.id == link.student_id).first()
        if st and st.id not in seen_student_ids:
            seen_student_ids.add(st.id)
            st_user = st.user or db.query(User).filter(User.id == st.user_id).first()
            int_obj = link.internship
            if not int_obj:
                int_obj = (
                    db.query(Internship)
                    .filter(Internship.student_id == st.id)
                    .first()
                )
            assigned_students_list.append({
                "student_id": st.id,
                "student_name": st_user.full_name if st_user else "Student",
                "student_email": st_user.email if st_user else "",
                "roll_number": st.roll_number,
                "department": st.department,
                "internship_id": int_obj.id if int_obj else None,
                "internship_title": int_obj.title if int_obj else None,
            })

    # Also include students who have active or approved internships at this company
    company_internships = (
        db.query(Internship)
        .filter(Internship.company_id == ext_mentor.company_id, Internship.student_id.isnot(None))
        .all()
    )
    for ci in company_internships:
        if ci.student_id and ci.student_id not in seen_student_ids:
            seen_student_ids.add(ci.student_id)
            st = db.query(Student).filter(Student.id == ci.student_id).first()
            if st:
                st_user = st.user or db.query(User).filter(User.id == st.user_id).first()
                assigned_students_list.append({
                    "student_id": st.id,
                    "student_name": st_user.full_name if st_user else "Student",
                    "student_email": st_user.email if st_user else "",
                    "roll_number": st.roll_number,
                    "department": st.department,
                    "internship_id": ci.id,
                    "internship_title": ci.title,
                })

    return ExternalMentorOut(
        id=ext_mentor.id,
        user_id=ext_mentor.user_id,
        company_id=ext_mentor.company_id,
        company_name=company_name,
        full_name=user.full_name if user else "External Mentor",
        email=user.email if user else "",
        phone=ext_mentor.phone,
        designation=ext_mentor.designation or "Company Internship Coordinator",
        is_active=user.is_active if user else True,
        assigned_students_count=len(assigned_students_list),
        assigned_students=assigned_students_list,
        created_at=ext_mentor.created_at,
        updated_at=ext_mentor.updated_at,
    )


@router.get("/me", response_model=ExternalMentorOut)
def get_my_external_mentor_profile(
    ctx=Depends(get_current_external_mentor),
    db: Session = Depends(get_db),
):
    """Returns the authenticated external mentor / company coordinator profile."""
    _, ext_mentor = ctx
    return _build_external_mentor_out(db, ext_mentor)


@router.get("/me/students", response_model=List[Dict[str, Any]])
def get_assigned_students(
    ctx=Depends(get_current_external_mentor),
    db: Session = Depends(get_db),
):
    """Returns detailed information about students assigned to this company coordinator."""
    _, ext_mentor = ctx
    profile = _build_external_mentor_out(db, ext_mentor)

    detailed_students = []
    for basic_st in profile.assigned_students:
        st_id = basic_st["student_id"]
        st = db.query(Student).filter(Student.id == st_id).first()
        if not st:
            continue
        st_user = st.user or db.query(User).filter(User.id == st.user_id).first()

        int_obj = None
        if basic_st.get("internship_id"):
            int_obj = db.query(Internship).filter(Internship.id == basic_st["internship_id"]).first()
        if not int_obj:
            int_obj = db.query(Internship).filter(Internship.student_id == st.id).first()

        internal_mentor_name = None
        if st.assigned_mentor and st.assigned_mentor.user:
            internal_mentor_name = st.assigned_mentor.user.full_name

        tasks_total = db.query(Task).filter(Task.student_id == st.id).count()
        tasks_completed = db.query(Task).filter(Task.student_id == st.id, Task.is_completed == True).count()  # noqa: E712
        reports_count = db.query(WeeklyReport).filter(WeeklyReport.student_id == st.id).count()

        detailed_students.append({
            "student_id": st.id,
            "user_id": st.user_id,
            "student_name": st_user.full_name if st_user else "Student",
            "student_email": st_user.email if st_user else "",
            "roll_number": st.roll_number,
            "department": st.department,
            "academic_year": st.academic_year,
            "phone": st.phone,
            "internship_id": int_obj.id if int_obj else None,
            "internship_title": int_obj.title if int_obj else "Internship",
            "internship_status": int_obj.status if int_obj else "ACTIVE",
            "company_name": profile.company_name,
            "internal_mentor_name": internal_mentor_name or "Faculty Mentor",
            "tasks_total": tasks_total,
            "tasks_completed": tasks_completed,
            "reports_count": reports_count,
        })

    return detailed_students


@router.get("/me/tasks", response_model=List[TaskOut])
@router.get("/tasks", response_model=List[TaskOut])
def get_company_tasks(
    ctx=Depends(get_current_external_mentor),
    db: Session = Depends(get_db),
):
    """Returns company-provided milestone tasks belonging to this external mentor's company."""
    user, ext_mentor = ctx
    profile = _build_external_mentor_out(db, ext_mentor)
    assigned_student_ids = [s["student_id"] for s in profile.assigned_students]

    conditions = [
        Task.external_mentor_id == ext_mentor.id,
    ]
    if ext_mentor.company_id:
        conditions.append(Internship.company_id == ext_mentor.company_id)
    if user and user.full_name:
        conditions.append(Task.assigned_by == user.full_name)
    if assigned_student_ids:
        conditions.append(Task.student_id.in_(assigned_student_ids))

    tasks = (
        db.query(Task)
        .outerjoin(Internship, Task.internship_id == Internship.id)
        .filter(or_(*conditions))
        .order_by(Task.id.desc())
        .all()
    )

    seen_ids = set()
    unique_tasks = []
    for t in tasks:
        if t.id not in seen_ids:
            seen_ids.add(t.id)
            unique_tasks.append(t)

    return [format_task_out(t, db=db) for t in unique_tasks]


@router.post("/me/tasks", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
@router.post("/tasks", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def assign_company_task(
    payload: TaskCreateByCoordinator,
    ctx=Depends(get_current_external_mentor),
    db: Session = Depends(get_db),
):
    """Allows an assigned Company Coordinator / External Mentor to assign a company task to one of their students."""
    current_user, ext_mentor = ctx
    profile = _build_external_mentor_out(db, ext_mentor)
    assigned_student_ids = [s["student_id"] for s in profile.assigned_students]

    if payload.student_id not in assigned_student_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only assign tasks to students assigned to your company",
        )

    student = db.query(Student).filter(Student.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Resolve internship for this student at this company
    internship = (
        db.query(Internship)
        .filter(Internship.student_id == student.id, Internship.company_id == ext_mentor.company_id)
        .first()
    )
    if not internship:
        internship = (
            db.query(Internship)
            .filter(Internship.company_id == ext_mentor.company_id)
            .first()
        )
    if not internship:
        internship = (
            db.query(Internship)
            .filter(Internship.student_id == student.id)
            .first()
        )
    if not internship:
        raise HTTPException(status_code=400, detail="No active internship found for this company/student")

    due = payload.due_date or (datetime.now(timezone.utc) + timedelta(days=14))
    if due.tzinfo is None:
        due = due.replace(tzinfo=timezone.utc)
    prio = (payload.priority or "MEDIUM").upper()
    if prio not in ("LOW", "MEDIUM", "HIGH"):
        prio = "MEDIUM"

    coordinator_name = current_user.full_name or "Company Coordinator"

    new_task = Task(
        internship_id=internship.id,
        student_id=student.id,
        mentor_id=student.mentor_id,  # Preserve student's supervising internal faculty mentor
        external_mentor_id=ext_mentor.id,
        assigned_by=coordinator_name,
        source="Company Provided",
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        priority=prio,
        status="PENDING",
        due_date=due,
        is_completed=False,
    )
    db.add(new_task)

    # Notify student
    if student.user_id:
        company_name = ext_mentor.company.name if ext_mentor.company else "Company"
        db.add(
            Notification(
                user_id=student.user_id,
                title="New Company Task Assigned",
                message=f"{coordinator_name} ({company_name}) assigned a new task: '{new_task.title}'.",
                notification_type="TASK_ASSIGNED",
                is_read=False,
            )
        )

    # Also notify student's internal faculty mentor if assigned
    if student.assigned_mentor and student.assigned_mentor.user_id:
        db.add(
            Notification(
                user_id=student.assigned_mentor.user_id,
                title="Company Task Assigned to Student",
                message=f"Company Coordinator {coordinator_name} assigned '{new_task.title}' to your student {student.user.full_name if student.user else 'Student'}.",
                notification_type="TASK_ASSIGNED",
                is_read=False,
            )
        )

    db.commit()
    db.refresh(new_task)
    return format_task_out(new_task, db=db)
