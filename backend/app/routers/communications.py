import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Body, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_admin, get_current_mentor, get_current_student, get_current_user
from backend.app.models import (
    Application,
    Certificate,
    Company,
    Internship,
    KnowledgeHandoff,
    Mentor,
    Message,
    Notification,
    SkillDependency,
    Student,
    Task,
    User,
    WeeklyReport,
)
from backend.app.routers.mentors import _get_authorized_mentor_ids
from backend.app.schemas import (
    CertificateOut,
    CompanyCreate,
    CompanyOut,
    CompanyUpdate,
    CompletionStatusOut,
    KnowledgeHandoffCreate,
    KnowledgeHandoffOut,
    KnowledgeHandoffReview,
    KnowledgeHandoffUpdate,
    MessageCreate,
    MessageOut,
    NotificationOut,
    SkillDependencyChainItem,
    SkillDependencyCreate,
    SkillDependencyGraphOut,
    SkillDependencyGraphRequest,
    SkillDependencyOut,
    SkillDependencyUpdate,
)

router = APIRouter(tags=["Communications & Notifications"])


def _resolve_student_mentor(student: Student, db: Session) -> Optional[Mentor]:
    mentor = student.assigned_mentor
    if not mentor:
        active_int = (
            db.query(Internship)
            .filter(Internship.student_id == student.id, Internship.mentor_id.isnot(None))
            .order_by(Internship.id.desc())
            .first()
        )
        if active_int:
            mentor = active_int.mentor
    if mentor and mentor.user and mentor.user.email == "mentor@demo.com":
        canonical = (
            db.query(Mentor)
            .join(User, Mentor.user_id == User.id)
            .filter(User.email == "mentor.turing@university.edu")
            .first()
        )
        if canonical:
            mentor = canonical
    return mentor


def _format_message_out(msg: Message, db: Session) -> MessageOut:
    sender = msg.sender or db.query(User).filter(User.id == msg.sender_id).first()
    receiver = msg.receiver or db.query(User).filter(User.id == msg.receiver_id).first()
    return MessageOut(
        id=msg.id,
        sender_id=msg.sender_id,
        sender_name=sender.full_name if sender else "Unknown",
        sender_role=sender.role if sender else "USER",
        receiver_id=msg.receiver_id,
        receiver_name=receiver.full_name if receiver else "Unknown",
        student_id=msg.student_id,
        mentor_id=msg.mentor_id,
        content=msg.content,
        is_read=msg.is_read,
        created_at=msg.created_at,
    )


def _sync_user_notifications(user: User, db: Session) -> None:
    """Idempotently ensures pending work, reminder, and mentor assignment notifications exist for the user."""
    if user.role == "STUDENT" and user.student_profile:
        st = user.student_profile
        mentor = _resolve_student_mentor(st, db)
        if mentor and mentor.user:
            assign_msg = f"{mentor.user.full_name} has been assigned as your mentor."
            has_assign = (
                db.query(Notification)
                .filter(
                    Notification.user_id == user.id,
                    Notification.notification_type == "MENTOR_ASSIGNMENT",
                    Notification.message == assign_msg,
                )
                .first()
            )
            if not has_assign:
                db.add(
                    Notification(
                        user_id=user.id,
                        title="Faculty Mentor Assigned",
                        message=assign_msg,
                        notification_type="MENTOR_ASSIGNMENT",
                        is_read=False,
                    )
                )

        pending_tasks = (
            db.query(Task)
            .filter(Task.student_id == st.id, Task.is_completed == False)  # noqa: E712
            .all()
        )
        if pending_tasks:
            pending_msg = f"You have pending internship work: {len(pending_tasks)} incomplete milestone task(s) awaiting completion."
            existing_pw = (
                db.query(Notification)
                .filter(
                    Notification.user_id == user.id,
                    Notification.notification_type == "PENDING_WORK",
                )
                .order_by(Notification.created_at.desc())
                .first()
            )
            if not existing_pw:
                db.add(
                    Notification(
                        user_id=user.id,
                        title="Pending Internship Work",
                        message=pending_msg,
                        notification_type="PENDING_WORK",
                        is_read=False,
                    )
                )
            else:
                existing_pw.message = pending_msg
                existing_pw.created_at = datetime.now(timezone.utc)

        active_int = (
            db.query(Internship)
            .filter(Internship.student_id == st.id, Internship.status == "ACTIVE")
            .first()
        )
        if active_int:
            reports_count = (
                db.query(WeeklyReport)
                .filter(WeeklyReport.student_id == st.id, WeeklyReport.internship_id == active_int.id)
                .count()
            )
            next_week = reports_count + 1
            reminder_msg = (
                f"Reminder: Submit your Week {next_week} progress report for '{active_int.title}' "
                f"and review upcoming task deadlines."
            )
            existing_rem = (
                db.query(Notification)
                .filter(
                    Notification.user_id == user.id,
                    Notification.notification_type == "REMINDER",
                )
                .first()
            )
            if not existing_rem:
                db.add(
                    Notification(
                        user_id=user.id,
                        title="Weekly Report & Deadline Reminder",
                        message=reminder_msg,
                        notification_type="REMINDER",
                        is_read=False,
                    )
                )
            else:
                existing_rem.message = reminder_msg
                existing_rem.created_at = datetime.now(timezone.utc)
        db.commit()


@router.get("/messages", response_model=List[MessageOut])
def get_messages(
    student_id: Optional[int] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns messages between an assigned Student and Mentor with strict RBAC."""
    if current_user.role == "STUDENT":
        student = current_user.student_profile
        if not student:
            raise HTTPException(status_code=404, detail="Student profile not found")
        if student_id is not None and student_id != student.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students can only access their own mentor conversation",
            )
        mentor = _resolve_student_mentor(student, db)
        if not mentor:
            return []
        msgs = (
            db.query(Message)
            .filter(Message.student_id == student.id)
            .order_by(Message.created_at.asc(), Message.id.asc())
            .all()
        )
        return [_format_message_out(m, db) for m in msgs]

    elif current_user.role == "MENTOR":
        mentor = current_user.mentor_profile
        if not mentor:
            raise HTTPException(status_code=404, detail="Mentor profile not found")
        mentor_ids = _get_authorized_mentor_ids(current_user, mentor, db)

        if student_id is not None:
            student = db.query(Student).filter(Student.id == student_id).first()
            if not student:
                raise HTTPException(status_code=404, detail="Student not found")

            active_int = (
                db.query(Internship)
                .filter(Internship.student_id == student.id, Internship.mentor_id.in_(mentor_ids))
                .first()
            )
            if student.mentor_id not in mentor_ids and not active_int:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not authorized to view messages for an unassigned student",
                )

            msgs = (
                db.query(Message)
                .filter(Message.student_id == student.id, Message.mentor_id.in_(mentor_ids))
                .order_by(Message.created_at.asc(), Message.id.asc())
                .all()
            )
            return [_format_message_out(m, db) for m in msgs]

        msgs = (
            db.query(Message)
            .filter(Message.mentor_id.in_(mentor_ids))
            .order_by(Message.created_at.asc(), Message.id.asc())
            .all()
        )
        return [_format_message_out(m, db) for m in msgs]

    elif current_user.role == "ADMIN":
        query = db.query(Message)
        if student_id is not None:
            query = query.filter(Message.student_id == student_id)
        msgs = query.order_by(Message.created_at.asc(), Message.id.asc()).all()
        return [_format_message_out(m, db) for m in msgs]

    raise HTTPException(status_code=403, detail="Unauthorized role")


@router.post("/messages", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def send_message(
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Sends a persistent message between an assigned Student and Mentor."""
    clean_content = payload.content.strip()
    if not clean_content:
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    if current_user.role == "STUDENT":
        student = current_user.student_profile
        if not student:
            raise HTTPException(status_code=404, detail="Student profile not found")
        if payload.student_id is not None and payload.student_id != student.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students cannot send messages on behalf of another student",
            )
        mentor = _resolve_student_mentor(student, db)
        if not mentor or not mentor.user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No mentor assigned yet. You can only message your assigned mentor.",
            )

        msg = Message(
            sender_id=current_user.id,
            receiver_id=mentor.user_id,
            student_id=student.id,
            mentor_id=mentor.id,
            content=clean_content,
            is_read=False,
            created_at=datetime.now(timezone.utc),
        )
        db.add(msg)

        # Notify mentor (and demo alias if Dr. Alan Turing)
        mentor_user_ids = [mentor.user_id]
        if mentor.user.email in ("mentor.turing@university.edu", "mentor@demo.com"):
            paired = (
                db.query(User)
                .filter(User.email.in_(["mentor.turing@university.edu", "mentor@demo.com"]))
                .all()
            )
            mentor_user_ids = list({u.id for u in paired})

        for m_uid in mentor_user_ids:
            db.add(
                Notification(
                    user_id=m_uid,
                    title=f"New Message from {current_user.full_name}",
                    message=clean_content[:200],
                    notification_type="MESSAGE",
                    is_read=False,
                )
            )

        db.commit()
        db.refresh(msg)
        return _format_message_out(msg, db)

    elif current_user.role == "MENTOR":
        mentor = current_user.mentor_profile
        if not mentor:
            raise HTTPException(status_code=404, detail="Mentor profile not found")
        if payload.student_id is None:
            raise HTTPException(status_code=400, detail="student_id is required when a mentor sends a message")

        student = db.query(Student).filter(Student.id == payload.student_id).first()
        if not student or not student.user:
            raise HTTPException(status_code=404, detail="Student not found")

        mentor_ids = _get_authorized_mentor_ids(current_user, mentor, db)
        active_int = (
            db.query(Internship)
            .filter(Internship.student_id == student.id, Internship.mentor_id.in_(mentor_ids))
            .first()
        )
        if student.mentor_id not in mentor_ids and not active_int:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only message students assigned to you",
            )

        target_mentor_id = student.mentor_id if student.mentor_id in mentor_ids else mentor.id
        msg = Message(
            sender_id=current_user.id,
            receiver_id=student.user_id,
            student_id=student.id,
            mentor_id=target_mentor_id,
            content=clean_content,
            is_read=False,
            created_at=datetime.now(timezone.utc),
        )
        db.add(msg)

        db.add(
            Notification(
                user_id=student.user_id,
                title=f"New Message from {current_user.full_name}",
                message=clean_content[:200],
                notification_type="MESSAGE",
                is_read=False,
            )
        )

        db.commit()
        db.refresh(msg)
        return _format_message_out(msg, db)

    raise HTTPException(status_code=403, detail="Only assigned students and mentors can exchange messages")


@router.get("/notifications", response_model=List[NotificationOut])
def get_my_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns database-backed notifications for the authenticated user."""
    _sync_user_notifications(current_user, db)
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .limit(50)
        .all()
    )
    return notifs


@router.post("/notifications/{notification_id}/read", response_model=NotificationOut)
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Marks a specific notification as read."""
    notif = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)
        .first()
    )
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif


@router.post("/notifications/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Marks all notifications for the current user as read."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,  # noqa: E712
    ).update({"is_read": True})
    db.commit()
    return {"status": "ok"}


def _format_company_item(comp: Company, db: Session) -> CompanyOut:
    internships = db.query(Internship).filter(Internship.company_id == comp.id).all()
    active_count = sum(1 for i in internships if i.status in ("AVAILABLE", "ACTIVE"))
    derived_loc = (
        comp.description
        if comp.description and len(comp.description) <= 80
        else (internships[0].location if internships else "Global")
    )
    return CompanyOut(
        id=comp.id,
        name=comp.name,
        industry=comp.industry or "Technology",
        location=derived_loc or "Global",
        website=comp.website,
        contact_email=comp.contact_email,
        description=comp.description,
        is_verified=True,
        is_active=bool(getattr(comp, "is_active", True)),
        internships_count=len(internships),
        active_internships_count=active_count,
    )


@router.get("/companies", response_model=List[CompanyOut])
def list_companies(
    active_only: bool = Query(default=False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns partner companies from the database."""
    query = db.query(Company)
    if active_only or current_user.role != "ADMIN":
        query = query.filter(Company.is_active == True)  # noqa: E712
    companies = query.order_by(Company.id.asc()).all()
    return [_format_company_item(c, db) for c in companies]


@router.post("/companies", response_model=CompanyOut, status_code=status.HTTP_201_CREATED)
def create_company_endpoint(
    payload: CompanyCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin-only endpoint to create a company."""
    clean_name = payload.name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Company name cannot be empty")
    existing = db.query(Company).filter(Company.name.ilike(clean_name)).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Company '{clean_name}' already exists")
    company = Company(
        name=clean_name,
        industry=(payload.industry or "Technology").strip(),
        website=payload.website.strip() if payload.website else None,
        contact_email=payload.contact_email.strip() if payload.contact_email else None,
        description=(payload.description or payload.location or "Global").strip(),
        is_active=payload.is_active if payload.is_active is not None else True,
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return _format_company_item(company, db)


@router.put("/companies/{company_id}", response_model=CompanyOut)
@router.patch("/companies/{company_id}", response_model=CompanyOut)
def update_company_endpoint(
    company_id: int,
    payload: CompanyUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin-only endpoint to update or activate/deactivate a company."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    if payload.name is not None and payload.name.strip():
        clean_name = payload.name.strip()
        dup = db.query(Company).filter(Company.name.ilike(clean_name), Company.id != company.id).first()
        if dup:
            raise HTTPException(status_code=409, detail=f"Company '{clean_name}' already exists")
        company.name = clean_name
    if payload.industry is not None:
        company.industry = payload.industry.strip()
    if payload.website is not None:
        company.website = payload.website.strip() or None
    if payload.location is not None:
        company.description = payload.location.strip()
    if payload.description is not None:
        company.description = payload.description.strip() or None
    if payload.is_active is not None:
        company.is_active = payload.is_active
    db.commit()
    db.refresh(company)
    return _format_company_item(company, db)


def _escape_pdf_text(text: str) -> str:
    safe = (
        str(text)
        .replace("\\", "\\\\")
        .replace("(", "\\(")
        .replace(")", "\\)")
        .replace("—", "-")
        .replace("–", "-")
        .replace("•", "*")
    )
    return "".join(ch if 32 <= ord(ch) <= 126 else " " for ch in safe)


def _generate_pdf_bytes(title: str, subtitle: str, lines: List[str]) -> bytes:
    content_ops = [
        "BT",
        "/F2 16 Tf",
        "50 790 Td",
        f"({_escape_pdf_text(title)}) Tj",
        "/F1 10 Tf",
        "0 -18 Td",
        f"({_escape_pdf_text(subtitle)}) Tj",
        "0 -12 Td",
        f"({'=' * 75}) Tj",
    ]
    for line in lines[:48]:
        is_header = line.startswith("## ")
        clean_line = line[3:] if is_header else line
        if is_header:
            content_ops.append("0 -16 Td")
            content_ops.append("/F2 11 Tf")
            content_ops.append(f"({_escape_pdf_text(clean_line[:95])}) Tj")
            content_ops.append("/F1 10 Tf")
        else:
            content_ops.append("0 -13 Td")
            content_ops.append(f"({_escape_pdf_text(clean_line[:100])}) Tj")
    content_ops.append("ET")
    stream_bytes = "\n".join(content_ops).encode("latin-1", errors="replace")

    objs = [
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n",
        f"4 0 obj\n<< /Length {len(stream_bytes)} >>\nstream\n".encode("latin-1")
        + stream_bytes
        + b"\nendstream\nendobj\n",
        b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
        b"6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
    ]

    out = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = []
    for obj in objs:
        offsets.append(len(out))
        out.extend(obj)

    xref_offset = len(out)
    out.extend(f"xref\n0 {len(objs) + 1}\n0000000000 65535 f \n".encode("latin-1"))
    for off in offsets:
        out.extend(f"{off:010d} 00000 n \n".encode("latin-1"))
    out.extend(
        f"trailer\n<< /Size {len(objs) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode(
            "latin-1"
        )
    )
    return bytes(out)


@router.get("/reports/export-pdf")
def export_pdf_report(
    student_id: Optional[int] = Query(default=None),
    report_type: str = Query(default="auto"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generates and downloads a real PDF report file with database records."""
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    if current_user.role == "STUDENT" or (student_id is not None and report_type == "student"):
        if current_user.role == "STUDENT":
            student = current_user.student_profile
            if not student:
                raise HTTPException(status_code=404, detail="Student profile not found")
        else:
            student = db.query(Student).filter(Student.id == student_id).first()
            if not student:
                raise HTTPException(status_code=404, detail="Student not found")

        mentor = _resolve_student_mentor(student, db)
        active_int = (
            db.query(Internship)
            .filter(Internship.student_id == student.id)
            .order_by(Internship.id.desc())
            .first()
        )
        reports = (
            db.query(WeeklyReport)
            .filter(WeeklyReport.student_id == student.id)
            .order_by(WeeklyReport.week_number.asc())
            .all()
        )
        tasks = db.query(Task).filter(Task.student_id == student.id).all()
        completed_tasks = sum(1 for t in tasks if t.is_completed)

        lines = [
            "## Student & Academic Profile",
            f"Student Name: {student.user.full_name if student.user else 'N/A'} ({student.roll_number})",
            f"Email: {student.user.email if student.user else 'N/A'} | Department: {student.department}",
            f"Academic Year: Year {student.academic_year} | Roll Number: {student.roll_number}",
            f"Assigned Faculty Mentor: {mentor.user.full_name if (mentor and mentor.user) else 'Unassigned'}",
            "## Active Internship Placement",
            f"Role: {active_int.title if active_int else 'N/A'} at {active_int.company.name if (active_int and active_int.company) else 'N/A'}",
            f"Status: {active_int.status if active_int else 'N/A'} | Duration: {active_int.duration_weeks if active_int else 0} Weeks",
            f"Tasks Completed: {completed_tasks} / {len(tasks)}",
            "## Weekly Progress Reports",
        ]
        for r in reports:
            lines.append(
                f"Week {r.week_number} [{r.status}] - Score: {r.mentor_score if r.mentor_score is not None else 'Pending'} | {(r.achievements or '')[:65]}"
            )
            if r.mentor_feedback:
                lines.append(f"  Mentor Feedback: {r.mentor_feedback[:80]}")

        pdf_bytes = _generate_pdf_bytes(
            title="EduIntern - Student Progress Report",
            subtitle=f"Generated on {now_str} | Official Academic Record",
            lines=lines,
        )
        filename = "Student_Progress_Report.pdf"

    elif current_user.role == "MENTOR":
        mentor = current_user.mentor_profile
        mentor_ids = _get_authorized_mentor_ids(current_user, mentor, db) if mentor else []
        students = db.query(Student).filter(Student.mentor_id.in_(mentor_ids)).all()
        lines = [
            "## Faculty Mentor Supervision Summary",
            f"Mentor Name: {current_user.full_name} ({current_user.email})",
            f"Department: {mentor.department if mentor else 'N/A'} | Designation: {mentor.designation if mentor else 'Faculty Mentor'}",
            f"Total Assigned Students: {len(students)}",
            "## Assigned Student Cohort & Weekly Report Status",
        ]
        for st in students:
            active_int = (
                db.query(Internship)
                .filter(Internship.student_id == st.id)
                .order_by(Internship.id.desc())
                .first()
            )
            rep_count = db.query(WeeklyReport).filter(WeeklyReport.student_id == st.id).count()
            lines.append(
                f"- {st.user.full_name if st.user else 'Student'} ({st.roll_number}) | "
                f"Company: {active_int.company.name if (active_int and active_int.company) else 'Unplaced'} | "
                f"Reports: {rep_count}"
            )
        pdf_bytes = _generate_pdf_bytes(
            title="EduIntern - Mentor Weekly Supervision Report",
            subtitle=f"Generated on {now_str} | Faculty Cohort Evaluation",
            lines=lines,
        )
        filename = "Mentor_Weekly_Report.pdf"

    else:
        total_students = db.query(Student).count()
        total_mentors = db.query(Mentor).join(User).filter(User.email != "mentor@demo.com").count()
        total_companies = db.query(Company).count()
        internships = db.query(Internship).all()
        apps = db.query(Application).all()
        lines = [
            "## Institutional System Overview",
            f"Admin Controller: {current_user.full_name} ({current_user.email})",
            f"Total Students: {total_students} | Total Faculty Mentors: {total_mentors}",
            f"Partner Companies: {total_companies} | Total Internships: {len(internships)} | Applications: {len(apps)}",
            "## Published & Active Internships",
        ]
        for i in internships[:20]:
            comp_name = i.company.name if i.company else "Partner Company"
            lines.append(f"- [{i.status}] {comp_name}: {i.title} ({i.location or 'Remote'})")
        pdf_bytes = _generate_pdf_bytes(
            title="EduIntern - Institutional Internship Report",
            subtitle=f"Generated on {now_str} | Admin System Summary",
            lines=lines,
        )
        filename = "Internship_Report.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store",
        },
    )


# ==============================================================================
# FEATURE 2: KNOWLEDGE HANDOFF ENDPOINTS
# ==============================================================================


def _format_handoff_out(handoff: KnowledgeHandoff, db: Session) -> KnowledgeHandoffOut:
    student = handoff.student or db.query(Student).filter(Student.id == handoff.student_id).first()
    internship = handoff.internship or db.query(Internship).filter(Internship.id == handoff.internship_id).first()
    mentor = handoff.mentor
    if not mentor and student:
        mentor = _resolve_student_mentor(student, db)
    return KnowledgeHandoffOut(
        id=handoff.id,
        student_id=handoff.student_id,
        student_name=student.user.full_name if student and student.user else "Unknown Student",
        student_email=student.user.email if student and student.user else "",
        mentor_id=mentor.id if mentor else handoff.mentor_id,
        mentor_name=mentor.user.full_name if mentor and mentor.user else None,
        internship_id=handoff.internship_id,
        internship_title=internship.title if internship else "Internship",
        company_name=internship.company.name if internship and internship.company else "Partner Company",
        domain=(getattr(internship, "domain", None) if internship else None) or "Software Development",
        title=handoff.title,
        overview=handoff.overview,
        completed_work=handoff.completed_work,
        technologies=handoff.technologies,
        learned_concepts=handoff.learned_concepts,
        implementation_notes=handoff.implementation_notes,
        challenges=handoff.challenges,
        solutions=handoff.solutions,
        resources=handoff.resources,
        repository_url=handoff.repository_url,
        deployment_url=handoff.deployment_url,
        pending_work=handoff.pending_work,
        recommendations=handoff.recommendations,
        known_issues=handoff.known_issues,
        final_notes=handoff.final_notes,
        status=handoff.status,
        mentor_feedback=handoff.mentor_feedback,
        created_at=handoff.created_at,
        updated_at=handoff.updated_at,
    )


@router.get("/students/me/handoffs", response_model=List[KnowledgeHandoffOut])
def get_my_handoffs(
    student_ctx=Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Lists all Knowledge Handoff documents owned by the logged-in student."""
    _, student = student_ctx
    rows = (
        db.query(KnowledgeHandoff)
        .filter(KnowledgeHandoff.student_id == student.id)
        .order_by(KnowledgeHandoff.updated_at.desc())
        .all()
    )
    return [_format_handoff_out(h, db) for h in rows]


@router.get("/students/me/handoffs/{handoff_id}", response_model=KnowledgeHandoffOut)
def get_my_handoff_by_id(
    handoff_id: int,
    student_ctx=Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Fetches a specific Knowledge Handoff owned by the logged-in student (403 if not owner)."""
    _, student = student_ctx
    handoff = db.query(KnowledgeHandoff).filter(KnowledgeHandoff.id == handoff_id).first()
    if not handoff:
        raise HTTPException(status_code=404, detail="Knowledge handoff not found")
    if handoff.student_id != student.id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this knowledge handoff")
    return _format_handoff_out(handoff, db)


@router.post("/students/me/handoffs", response_model=KnowledgeHandoffOut, status_code=status.HTTP_201_CREATED)
def create_my_handoff(
    payload: KnowledgeHandoffCreate,
    student_ctx=Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Creates or submits a Knowledge Handoff document for the student's internship and notifies the assigned Mentor."""
    user, student = student_ctx
    target_internship = None
    if payload.internship_id:
        target_internship = db.query(Internship).filter(Internship.id == payload.internship_id).first()
    if not target_internship:
        target_internship = (
            db.query(Internship)
            .filter(Internship.student_id == student.id)
            .order_by(Internship.status == "ACTIVE", Internship.id.desc())
            .first()
        )
    if not target_internship:
        latest_app = (
            db.query(Application)
            .filter(Application.student_id == student.id)
            .order_by(Application.applied_at.desc())
            .first()
        )
        if latest_app and latest_app.internship:
            target_internship = latest_app.internship
    if not target_internship:
        raise HTTPException(status_code=400, detail="No internship found to link Knowledge Handoff")

    mentor = _resolve_student_mentor(student, db)
    desired_status = (payload.status or "SUBMITTED").upper().strip()
    if desired_status not in ("DRAFT", "SUBMITTED"):
        desired_status = "SUBMITTED"

    now = datetime.now(timezone.utc)
    tech_str = (
        ", ".join(str(x).strip() for x in payload.technologies if str(x).strip())
        if isinstance(payload.technologies, list)
        else payload.technologies
    )
    handoff = KnowledgeHandoff(
        student_id=student.id,
        mentor_id=mentor.id if mentor else target_internship.mentor_id,
        internship_id=target_internship.id,
        title=payload.title.strip(),
        overview=payload.overview.strip(),
        completed_work=payload.completed_work,
        technologies=tech_str,
        learned_concepts=payload.learned_concepts,
        implementation_notes=payload.implementation_notes,
        challenges=payload.challenges,
        solutions=payload.solutions,
        resources=payload.resources,
        repository_url=payload.repository_url,
        deployment_url=payload.deployment_url,
        pending_work=payload.pending_work,
        recommendations=payload.recommendations,
        known_issues=payload.known_issues,
        final_notes=payload.final_notes,
        status=desired_status,
        created_at=now,
        updated_at=now,
    )
    db.add(handoff)
    db.flush()

    if desired_status == "SUBMITTED" and mentor and mentor.user_id:
        db.add(
            Notification(
                user_id=mentor.user_id,
                title=f"Knowledge Handoff Submitted: {user.full_name}",
                message=f"{user.full_name} submitted Knowledge Handoff '{handoff.title}' for {target_internship.title}.",
                notification_type="KNOWLEDGE_HANDOFF",
                is_read=False,
            )
        )

    db.commit()
    db.refresh(handoff)
    return _format_handoff_out(handoff, db)


@router.put("/students/me/handoffs/{handoff_id}", response_model=KnowledgeHandoffOut)
@router.patch("/students/me/handoffs/{handoff_id}", response_model=KnowledgeHandoffOut)
def update_my_handoff(
    handoff_id: int,
    payload: KnowledgeHandoffUpdate,
    student_ctx=Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Updates an existing Knowledge Handoff owned by the logged-in student."""
    user, student = student_ctx
    handoff = db.query(KnowledgeHandoff).filter(KnowledgeHandoff.id == handoff_id).first()
    if not handoff:
        raise HTTPException(status_code=404, detail="Knowledge handoff not found")
    if handoff.student_id != student.id:
        raise HTTPException(status_code=403, detail="Forbidden: You cannot modify another student's knowledge handoff")

    prev_status = handoff.status
    data = payload.model_dump(exclude_unset=True)
    for field, val in data.items():
        if field == "status" and val:
            norm_st = str(val).upper().strip()
            if norm_st in ("DRAFT", "SUBMITTED"):
                handoff.status = norm_st
        elif field == "technologies" and isinstance(val, list):
            handoff.technologies = ", ".join(str(x).strip() for x in val if str(x).strip())
        elif val is not None:
            setattr(handoff, field, val)

    handoff.updated_at = datetime.now(timezone.utc)
    mentor = _resolve_student_mentor(student, db)
    if handoff.status == "SUBMITTED" and prev_status != "SUBMITTED" and mentor and mentor.user_id:
        db.add(
            Notification(
                user_id=mentor.user_id,
                title=f"Knowledge Handoff Submitted: {user.full_name}",
                message=f"{user.full_name} submitted Knowledge Handoff '{handoff.title}' for review.",
                notification_type="KNOWLEDGE_HANDOFF",
                is_read=False,
            )
        )

    db.commit()
    db.refresh(handoff)
    return _format_handoff_out(handoff, db)


@router.get("/mentors/me/handoffs", response_model=List[KnowledgeHandoffOut])
def get_mentor_handoffs(
    mentor_ctx=Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """Lists all Knowledge Handoff documents for students assigned to this Mentor."""
    user, mentor = mentor_ctx
    mentor_ids = _get_authorized_mentor_ids(user, mentor, db)
    assigned_student_ids = {
        s.id for s in db.query(Student.id).filter(Student.mentor_id.in_(mentor_ids)).all()
    }
    intern_student_ids = {
        i.student_id
        for i in db.query(Internship).filter(Internship.mentor_id.in_(mentor_ids)).all()
        if i.student_id
    }
    all_student_ids = assigned_student_ids | intern_student_ids
    if not all_student_ids:
        return []
    rows = (
        db.query(KnowledgeHandoff)
        .filter(KnowledgeHandoff.student_id.in_(all_student_ids))
        .order_by(KnowledgeHandoff.updated_at.desc())
        .all()
    )
    return [_format_handoff_out(h, db) for h in rows]


@router.get("/mentors/students/{student_id}/handoffs", response_model=List[KnowledgeHandoffOut])
def get_student_handoffs_for_mentor(
    student_id: int,
    mentor_ctx=Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """Returns Knowledge Handoffs for a specific student assigned to this Mentor (403 if unassigned)."""
    user, mentor = mentor_ctx
    mentor_ids = _get_authorized_mentor_ids(user, mentor, db)
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    internship = (
        db.query(Internship)
        .filter(Internship.student_id == student.id)
        .order_by(Internship.status == "ACTIVE", Internship.id.desc())
        .first()
    )
    is_authorized = (
        student.mentor_id in mentor_ids
        or bool(internship and internship.mentor_id in mentor_ids)
        or user.role == "ADMIN"
    )
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Forbidden: You are not assigned to supervise this student")

    rows = (
        db.query(KnowledgeHandoff)
        .filter(KnowledgeHandoff.student_id == student.id)
        .order_by(KnowledgeHandoff.updated_at.desc())
        .all()
    )
    return [_format_handoff_out(h, db) for h in rows]


@router.post("/mentors/handoffs/{handoff_id}/review", response_model=KnowledgeHandoffOut)
@router.patch("/mentors/handoffs/{handoff_id}/review", response_model=KnowledgeHandoffOut)
def review_knowledge_handoff(
    handoff_id: int,
    payload: KnowledgeHandoffReview,
    mentor_ctx=Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """Allows an assigned Mentor to approve or request changes on a student's Knowledge Handoff."""
    user, mentor = mentor_ctx
    mentor_ids = _get_authorized_mentor_ids(user, mentor, db)
    handoff = db.query(KnowledgeHandoff).filter(KnowledgeHandoff.id == handoff_id).first()
    if not handoff:
        raise HTTPException(status_code=404, detail="Knowledge handoff not found")

    student = db.query(Student).filter(Student.id == handoff.student_id).first()
    internship = db.query(Internship).filter(Internship.id == handoff.internship_id).first()
    is_authorized = (
        (student and student.mentor_id in mentor_ids)
        or (internship and internship.mentor_id in mentor_ids)
        or (handoff.mentor_id in mentor_ids)
        or user.role == "ADMIN"
    )
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Forbidden: You are not authorized to review this knowledge handoff")

    status_upper = (payload.status or "APPROVED").upper().strip()
    if status_upper not in ("APPROVED", "CHANGES_REQUESTED", "SUBMITTED", "DRAFT"):
        raise HTTPException(status_code=400, detail="Status must be APPROVED or CHANGES_REQUESTED")

    handoff.status = status_upper
    handoff.mentor_feedback = payload.mentor_feedback
    handoff.updated_at = datetime.now(timezone.utc)

    if student and student.user_id:
        db.add(
            Notification(
                user_id=student.user_id,
                title=f"Knowledge Handoff Reviewed: {status_upper}",
                message=(
                    f"Mentor {user.full_name} marked your Knowledge Handoff '{handoff.title}' as {status_upper}."
                    + (f" Feedback: {payload.mentor_feedback}" if payload.mentor_feedback else "")
                ),
                notification_type="KNOWLEDGE_HANDOFF",
                is_read=False,
            )
        )

    db.commit()
    db.refresh(handoff)
    return _format_handoff_out(handoff, db)


@router.get("/admin/handoffs", response_model=List[KnowledgeHandoffOut])
def list_admin_handoffs(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Lists all Knowledge Handoff documents across all students for Admin oversight."""
    rows = db.query(KnowledgeHandoff).order_by(KnowledgeHandoff.updated_at.desc()).all()
    return [_format_handoff_out(h, db) for h in rows]


# ==============================================================================
# FEATURE 3: SKILL DEPENDENCY GRAPH ENDPOINTS
# ==============================================================================


def _compute_dependency_graph(
    db: Session,
    student_skills: List[str],
    required_skills: List[str],
) -> SkillDependencyGraphOut:
    all_deps = db.query(SkillDependency).order_by(SkillDependency.id.asc()).all()
    student_lower = {s.strip().lower(): s.strip() for s in student_skills if s and s.strip()}
    required_clean = []
    seen_req = set()
    for r in required_skills:
        if r and r.strip() and r.strip().lower() not in seen_req:
            seen_req.add(r.strip().lower())
            required_clean.append(r.strip())

    # Map lowercase skill -> list of prerequisite canonical names
    prereq_map: Dict[str, List[str]] = {}
    canonical_name: Dict[str, str] = {}
    for dep in all_deps:
        sk_l = dep.skill.strip().lower()
        pr_l = dep.prerequisite_skill.strip().lower()
        canonical_name.setdefault(sk_l, dep.skill.strip())
        canonical_name.setdefault(pr_l, dep.prerequisite_skill.strip())
        prereq_map.setdefault(sk_l, [])
        if dep.prerequisite_skill.strip() not in prereq_map[sk_l]:
            prereq_map[sk_l].append(dep.prerequisite_skill.strip())

    def get_full_chain(target: str) -> List[str]:
        """Returns ordered list [foundational_prereq, ..., target]."""
        visited = set()
        order: List[str] = []

        def dfs(curr: str):
            cl = curr.strip().lower()
            if cl in visited:
                return
            visited.add(cl)
            for p in prereq_map.get(cl, []):
                dfs(p)
            order.append(canonical_name.get(cl, curr.strip()))

        dfs(target)
        return order

    matched: List[str] = []
    missing: List[str] = []
    missing_prereq_all: List[str] = []
    chains: List[SkillDependencyChainItem] = []
    learning_order: List[str] = []
    seen_learning = set()
    nodes_map: Dict[str, Dict[str, Any]] = {}
    edges_list: List[Dict[str, Any]] = []
    seen_edges = set()

    target_pool = required_clean if required_clean else [dep.skill for dep in all_deps[:8]]

    for req in target_pool:
        req_l = req.lower()
        is_miss = req_l not in student_lower
        if is_miss:
            if req not in missing:
                missing.append(req)
        else:
            if req not in matched:
                matched.append(req)

        chain = get_full_chain(req)
        missing_prereqs = [
            s for s in chain[:-1] if s.lower() not in student_lower
        ]
        for mp in missing_prereqs:
            if mp not in missing_prereq_all:
                missing_prereq_all.append(mp)
        if is_miss:
            first_to_learn = missing_prereqs[0] if missing_prereqs else req
            for step in chain:
                sl = step.lower()
                if sl not in student_lower and sl not in seen_learning:
                    seen_learning.add(sl)
                    learning_order.append(step)
        else:
            first_to_learn = req

        chains.append(
            SkillDependencyChainItem(
                target_skill=req,
                is_missing=is_miss,
                chain=chain,
                missing_prerequisites=missing_prereqs,
                recommended_first_skill=first_to_learn,
            )
        )

        for idx, node_skill in enumerate(chain):
            nl = node_skill.lower()
            has_skill = nl in student_lower
            is_req = nl in seen_req
            status_tag = "MATCHED" if has_skill else ("MISSING_TARGET" if is_req else "MISSING_PREREQUISITE")
            nodes_map[nl] = {
                "id": node_skill,
                "label": node_skill,
                "status": status_tag,
                "is_required": is_req,
                "is_known": has_skill,
            }
            if idx > 0:
                prev_skill = chain[idx - 1]
                edge_key = (prev_skill.lower(), nl)
                if edge_key not in seen_edges:
                    seen_edges.add(edge_key)
                    edges_list.append(
                        {
                            "from": prev_skill,
                            "to": node_skill,
                            "relationship": "REQUIRES",
                        }
                    )

    return SkillDependencyGraphOut(
        nodes=list(nodes_map.values()),
        edges=edges_list,
        chains=chains,
        recommended_learning_order=learning_order,
        matched_skills=matched,
        missing_skills=missing,
        missing_target_skills=missing,
        missing_prerequisite_skills=missing_prereq_all,
    )


@router.get("/skill-dependencies", response_model=List[SkillDependencyOut])
def list_skill_dependencies(db: Session = Depends(get_db)):
    """Lists all Skill Dependency edges from the database."""
    return db.query(SkillDependency).order_by(SkillDependency.skill.asc(), SkillDependency.id.asc()).all()


@router.post("/skill-dependencies/graph", response_model=SkillDependencyGraphOut)
def compute_skill_dependency_graph_endpoint(
    payload: SkillDependencyGraphRequest,
    db: Session = Depends(get_db),
):
    """Computes prerequisite chains and recommended learning order for a student's skills and required internship skills."""
    req_skills = list(payload.required_skills or [])
    if payload.internship_id and not req_skills:
        intr = db.query(Internship).filter(Internship.id == payload.internship_id).first()
        if intr:
            req_skills = [s.skill_name for s in intr.skills if s.skill_name]
    return _compute_dependency_graph(db, payload.student_skills or [], req_skills)


@router.get("/admin/skill-dependencies", response_model=List[SkillDependencyOut])
def list_admin_skill_dependencies(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin endpoint to list all skill dependencies."""
    return db.query(SkillDependency).order_by(SkillDependency.id.desc()).all()


@router.post("/admin/skill-dependencies", response_model=SkillDependencyOut, status_code=status.HTTP_201_CREATED)
def create_admin_skill_dependency(
    payload: SkillDependencyCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin endpoint to create a new skill dependency edge."""
    clean_skill = payload.skill.strip()
    clean_prereq = payload.prerequisite_skill.strip()
    if not clean_skill or not clean_prereq:
        raise HTTPException(status_code=400, detail="Both skill and prerequisite_skill are required")
    if clean_skill.lower() == clean_prereq.lower():
        raise HTTPException(status_code=400, detail="A skill cannot be a prerequisite of itself")

    existing = (
        db.query(SkillDependency)
        .filter(
            SkillDependency.skill.ilike(clean_skill),
            SkillDependency.prerequisite_skill.ilike(clean_prereq),
        )
        .first()
    )
    if existing:
        return existing

    dep = SkillDependency(
        skill=clean_skill,
        prerequisite_skill=clean_prereq,
        relationship=(payload.relationship or "REQUIRES").upper().strip(),
        description=payload.description.strip() if payload.description else None,
    )
    db.add(dep)
    db.commit()
    db.refresh(dep)
    return dep


@router.put("/admin/skill-dependencies/{dep_id}", response_model=SkillDependencyOut)
def update_admin_skill_dependency(
    dep_id: int,
    payload: SkillDependencyUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin endpoint to update a skill dependency edge."""
    dep = db.query(SkillDependency).filter(SkillDependency.id == dep_id).first()
    if not dep:
        raise HTTPException(status_code=404, detail="Skill dependency not found")
    if payload.skill is not None and payload.skill.strip():
        dep.skill = payload.skill.strip()
    if payload.prerequisite_skill is not None and payload.prerequisite_skill.strip():
        dep.prerequisite_skill = payload.prerequisite_skill.strip()
    if payload.relationship is not None and payload.relationship.strip():
        dep.relationship = payload.relationship.strip().upper()
    if payload.description is not None:
        dep.description = payload.description.strip() or None
    db.commit()
    db.refresh(dep)
    return dep


@router.delete("/admin/skill-dependencies/{dep_id}")
def delete_admin_skill_dependency(
    dep_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin endpoint to delete a skill dependency edge."""
    dep = db.query(SkillDependency).filter(SkillDependency.id == dep_id).first()
    if not dep:
        raise HTTPException(status_code=404, detail="Skill dependency not found")
    db.delete(dep)
    db.commit()
    return {"status": "deleted", "id": dep_id}


# ==============================================================================
# FEATURE 4: INTERNSHIP COMPLETION CERTIFICATE ENDPOINTS
# ==============================================================================


def _generate_next_certificate_code(db: Session) -> str:
    """Generates a unique certificate code in CERT-2026-0001 format."""
    year = datetime.now(timezone.utc).year
    existing_codes = [c.certificate_id for c in db.query(Certificate).all() if c.certificate_id]
    used = set(existing_codes)
    max_num = 0
    for code in existing_codes:
        m = re.match(r"^CERT-\d{4}-(\d+)$", code.strip().upper())
        if m:
            num = int(m.group(1))
            if num > max_num:
                max_num = num
    next_num = max_num + 1
    while True:
        cand = f"CERT-{year}-{next_num:04d}"
        if cand not in used:
            return cand
        next_num += 1


def _evaluate_internship_completion(student: Student, internship: Internship, db: Session) -> CompletionStatusOut:
    tasks = (
        db.query(Task)
        .filter(Task.student_id == student.id, Task.internship_id == internship.id)
        .all()
    )
    reports = (
        db.query(WeeklyReport)
        .filter(WeeklyReport.student_id == student.id, WeeklyReport.internship_id == internship.id)
        .all()
    )
    tasks_total = len(tasks)
    tasks_completed = sum(1 for t in tasks if t.is_completed)
    all_tasks_completed = tasks_total > 0 and tasks_completed == tasks_total

    reports_submitted = len(reports)
    reports_required = 1
    reports_requirement_met = reports_submitted >= reports_required

    comp_status = getattr(internship, "completion_status", None) or (
        "COMPLETED" if internship.status == "COMPLETED" else "IN_PROGRESS"
    )
    mentor_confirmed = internship.status == "COMPLETED" or comp_status == "COMPLETED"

    blocking_reasons: List[str] = []
    if tasks_total == 0:
        blocking_reasons.append("No internship milestone tasks have been completed yet.")
    elif not all_tasks_completed:
        blocking_reasons.append(
            f"All required internship tasks must be completed ({tasks_completed}/{tasks_total} completed)."
        )
    if not reports_requirement_met:
        blocking_reasons.append(
            f"At least {reports_required} weekly report(s) with evidence must be submitted ({reports_submitted} submitted)."
        )
    if not mentor_confirmed:
        blocking_reasons.append("Faculty Mentor or Admin must confirm final internship completion.")

    eligible = all_tasks_completed and reports_requirement_met and mentor_confirmed
    cert = (
        db.query(Certificate)
        .filter(Certificate.student_id == student.id, Certificate.internship_id == internship.id)
        .first()
    )

    return CompletionStatusOut(
        internship_id=internship.id,
        internship_title=internship.title,
        company_name=internship.company.name if internship.company else "Partner Company",
        domain=getattr(internship, "domain", None) or "Software Development",
        status=internship.status,
        completion_status="COMPLETED" if mentor_confirmed else comp_status,
        tasks_total=tasks_total,
        tasks_completed=tasks_completed,
        all_tasks_completed=all_tasks_completed,
        reports_submitted=reports_submitted,
        reports_required=reports_required,
        reports_requirement_met=reports_requirement_met,
        mentor_confirmed=mentor_confirmed,
        eligible_for_certificate=eligible,
        blocking_reasons=blocking_reasons,
        certificate=CertificateOut.model_validate(cert) if cert else None,
    )


def _issue_or_get_certificate(student: Student, internship: Internship, db: Session) -> Certificate:
    existing = (
        db.query(Certificate)
        .filter(Certificate.student_id == student.id, Certificate.internship_id == internship.id)
        .first()
    )
    if existing:
        return existing

    mentor = _resolve_student_mentor(student, db)
    mentor_name = mentor.user.full_name if mentor and mentor.user else "Faculty Mentor"
    student_name = student.user.full_name if student.user else f"Student #{student.id}"
    company_name = internship.company.name if internship.company else "Partner Company"
    domain_val = getattr(internship, "domain", None) or "Software Development"
    now = datetime.now(timezone.utc)
    start_dt = internship.start_date or now
    end_dt = internship.end_date or now
    cert_code = _generate_next_certificate_code(db)

    statement = (
        f"This is to certify that {student_name} has successfully completed the "
        f"{internship.title} internship in the {domain_val} domain at {company_name} "
        f"for a duration of {internship.duration_weeks} weeks under the academic supervision of {mentor_name}."
    )

    cert = Certificate(
        certificate_id=cert_code,
        student_id=student.id,
        internship_id=internship.id,
        mentor_id=mentor.id if mentor else internship.mentor_id,
        student_name=student_name,
        internship_title=internship.title,
        company_name=company_name,
        domain=domain_val,
        duration_weeks=internship.duration_weeks,
        start_date=start_dt,
        end_date=end_dt,
        mentor_name=mentor_name,
        institution_name="Smart Internship Monitoring & Academic Governance System",
        statement=statement,
        issued_at=now,
    )
    db.add(cert)
    db.flush()

    if student.user_id:
        db.add(
            Notification(
                user_id=student.user_id,
                title=f"Internship Completion Certificate Issued ({cert_code})",
                message=(
                    f"Congratulations! Your internship '{internship.title}' at {company_name} is complete "
                    f"and Certificate {cert_code} is ready for download."
                ),
                notification_type="CERTIFICATE_ISSUED",
                is_read=False,
            )
        )

    return cert


@router.get("/students/me/completion-status", response_model=Optional[CompletionStatusOut])
def get_my_completion_status(
    internship_id: Optional[int] = Query(default=None),
    student_ctx=Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Returns completion eligibility checklist and issued certificate (if any) for the student's internship."""
    _, student = student_ctx
    query = db.query(Internship).filter(Internship.student_id == student.id)
    if internship_id:
        query = query.filter(Internship.id == internship_id)
    internship = query.order_by(Internship.id.asc()).first()
    if not internship:
        return None
    return _evaluate_internship_completion(student, internship, db)


@router.post("/mentors/students/{student_id}/confirm-completion", response_model=CompletionStatusOut)
def mentor_confirm_internship_completion(
    student_id: int,
    internship_id: Optional[int] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Allows an assigned Mentor (or Admin) to confirm final internship completion for a student
    once all tasks and required weekly reports are completed, automatically issuing their Certificate.
    """
    if current_user.role not in ("MENTOR", "ADMIN"):
        raise HTTPException(status_code=403, detail="Only Mentors or Admin can confirm internship completion")

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    query = db.query(Internship).filter(Internship.student_id == student.id)
    if internship_id:
        query = query.filter(Internship.id == internship_id)
    internship = query.order_by(Internship.id.asc()).first()
    if not internship:
        raise HTTPException(status_code=400, detail="Student does not have an assigned internship")

    if current_user.role == "MENTOR":
        mentor = current_user.mentor_profile
        mentor_ids = _get_authorized_mentor_ids(current_user, mentor, db) if mentor else []
        if student.mentor_id not in mentor_ids and internship.mentor_id not in mentor_ids:
            raise HTTPException(status_code=403, detail="Forbidden: You are not assigned to this student")

    tasks = db.query(Task).filter(Task.student_id == student.id, Task.internship_id == internship.id).all()
    reports = db.query(WeeklyReport).filter(WeeklyReport.student_id == student.id, WeeklyReport.internship_id == internship.id).all()
    if not tasks or any(not t.is_completed for t in tasks):
        raise HTTPException(
            status_code=400,
            detail="Cannot confirm completion: All assigned internship tasks must be completed first.",
        )
    if len(reports) < 1:
        raise HTTPException(
            status_code=400,
            detail="Cannot confirm completion: Required weekly progress reports must be submitted first.",
        )

    internship.completion_status = "COMPLETED"
    if not internship.end_date:
        internship.end_date = datetime.now(timezone.utc)
    db.flush()

    _issue_or_get_certificate(student, internship, db)
    db.commit()
    db.refresh(internship)
    return _evaluate_internship_completion(student, internship, db)


@router.post("/students/internships/{internship_id}/certificate", response_model=CertificateOut)
def generate_student_certificate(
    internship_id: int,
    student_ctx=Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Generates or retrieves the official Internship Completion Certificate for the logged-in student.
    Strictly blocks generation (400 Bad Request) if tasks, reports, or mentor confirmation are incomplete.
    """
    _, student = student_ctx
    internship = db.query(Internship).filter(Internship.id == internship_id).first()
    if not internship:
        raise HTTPException(status_code=404, detail="Internship not found")
    if internship.student_id != student.id:
        raise HTTPException(status_code=403, detail="Forbidden: This internship is not assigned to you")

    status_eval = _evaluate_internship_completion(student, internship, db)
    if not status_eval.eligible_for_certificate:
        raise HTTPException(
            status_code=400,
            detail="Certificate cannot be generated before internship completion: " + " ".join(status_eval.blocking_reasons),
        )

    cert = _issue_or_get_certificate(student, internship, db)
    db.commit()
    db.refresh(cert)
    return cert


@router.get("/students/certificates", response_model=List[CertificateOut])
@router.get("/students/me/certificates", response_model=List[CertificateOut])
def list_my_certificates(
    student_ctx=Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Lists all issued Internship Completion Certificates for the logged-in student."""
    _, student = student_ctx
    return (
        db.query(Certificate)
        .filter(Certificate.student_id == student.id)
        .order_by(Certificate.issued_at.desc())
        .all()
    )


def _authorize_certificate_access(cert: Certificate, current_user: User, db: Session) -> None:
    if current_user.role == "ADMIN":
        return
    if current_user.role == "STUDENT":
        st = current_user.student_profile
        if not st or cert.student_id != st.id:
            raise HTTPException(status_code=403, detail="Forbidden: You can only access your own certificate")
        return
    if current_user.role == "MENTOR":
        mentor = current_user.mentor_profile
        mentor_ids = _get_authorized_mentor_ids(current_user, mentor, db) if mentor else []
        student = db.query(Student).filter(Student.id == cert.student_id).first()
        internship = db.query(Internship).filter(Internship.id == cert.internship_id).first()
        is_auth = (
            (student and student.mentor_id in mentor_ids)
            or (internship and internship.mentor_id in mentor_ids)
            or (cert.mentor_id in mentor_ids)
        )
        if not is_auth:
            raise HTTPException(status_code=403, detail="Forbidden: You are not assigned to this student")
        return
    raise HTTPException(status_code=403, detail="Forbidden")


def _find_certificate(cert_identifier: str, db: Session) -> Certificate:
    cert = None
    if cert_identifier.isdigit():
        cert = db.query(Certificate).filter(Certificate.id == int(cert_identifier)).first()
    if not cert:
        cert = db.query(Certificate).filter(Certificate.certificate_id == cert_identifier).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return cert


@router.get("/students/certificates/{certificate_id}", response_model=CertificateOut)
@router.get("/certificates/{certificate_id}", response_model=CertificateOut)
def get_certificate_details(
    certificate_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetches a specific certificate by ID or certificate code (with strict RBAC)."""
    cert = _find_certificate(certificate_id, db)
    _authorize_certificate_access(cert, current_user, db)
    return cert


@router.get("/students/certificates/{certificate_id}/download")
@router.get("/certificates/{certificate_id}/download")
def download_certificate_pdf(
    certificate_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generates and downloads an official binary PDF (%PDF-1.4) for an Internship Completion Certificate."""
    cert = _find_certificate(certificate_id, db)
    _authorize_certificate_access(cert, current_user, db)

    start_str = cert.start_date.strftime("%Y-%m-%d") if cert.start_date else "N/A"
    end_str = cert.end_date.strftime("%Y-%m-%d") if cert.end_date else "N/A"
    issued_str = cert.issued_at.strftime("%Y-%m-%d %H:%M UTC") if cert.issued_at else "N/A"

    lines = [
        "## OFFICIAL INTERNSHIP COMPLETION CERTIFICATE",
        f"Certificate Number: {cert.certificate_id}",
        f"Institution: {cert.institution_name}",
        "## Recipient & Placement Details",
        f"Student Name: {cert.student_name}",
        f"Internship Role: {cert.internship_title}",
        f"Host Organization: {cert.company_name}",
        f"Technical Domain: {cert.domain}",
        f"Internship Duration: {cert.duration_weeks} Weeks ({start_str} to {end_str})",
        f"Faculty Mentor / Supervisor: {cert.mentor_name or 'Faculty Supervisor'}",
        "## Completion Citation",
        cert.statement[:95],
        cert.statement[95:190] if len(cert.statement) > 95 else "",
        cert.statement[190:285] if len(cert.statement) > 190 else "",
        "## Verification & Digital Signature",
        f"Date of Issue: {issued_str}",
        f"Verification Status: VERIFIED & COMPLETE ({cert.certificate_id})",
        "Authorized Signatory: Dean of Engineering (System Controller) & Faculty Mentor",
    ]
    clean_lines = [ln for ln in lines if ln]

    pdf_bytes = _generate_pdf_bytes(
        title="CERTIFICATE OF INTERNSHIP COMPLETION",
        subtitle=f"{cert.institution_name} | Certificate ID: {cert.certificate_id}",
        lines=clean_lines,
    )
    filename = f"Certificate_{cert.certificate_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store",
        },
    )


@router.get("/mentors/students/{student_id}/certificates", response_model=List[CertificateOut])
def list_student_certificates_for_mentor(
    student_id: int,
    mentor_ctx=Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """Lists certificates for an assigned student (403 if mentor is not assigned)."""
    user, mentor = mentor_ctx
    mentor_ids = _get_authorized_mentor_ids(user, mentor, db)
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    internship = db.query(Internship).filter(Internship.student_id == student.id).first()
    if student.mentor_id not in mentor_ids and (not internship or internship.mentor_id not in mentor_ids):
        raise HTTPException(status_code=403, detail="Forbidden: You are not assigned to this student")
    return db.query(Certificate).filter(Certificate.student_id == student.id).order_by(Certificate.issued_at.desc()).all()


@router.get("/admin/certificates", response_model=List[CertificateOut])
def list_admin_certificates(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Lists all issued Internship Completion Certificates across the institution (Admin only)."""
    return db.query(Certificate).order_by(Certificate.issued_at.desc()).all()


