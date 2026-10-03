from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="STUDENT")  # "STUDENT", "MENTOR", "ADMIN"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    student_profile = relationship("Student", back_populates="user", uselist=False, cascade="all, delete-orphan")
    mentor_profile = relationship("Mentor", back_populates="user", uselist=False, cascade="all, delete-orphan")
    external_mentor_profile = relationship("ExternalMentor", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    mentor_id = Column(Integer, ForeignKey("mentors.id", ondelete="SET NULL"), nullable=True)
    roll_number = Column(String(50), unique=True, index=True, nullable=False)
    department = Column(String(100), nullable=False, default="Computer Science & Engineering")
    academic_year = Column(Integer, default=3, nullable=False)
    phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="student_profile")
    assigned_mentor = relationship("Mentor", back_populates="assigned_students", foreign_keys=[mentor_id])
    skills = relationship("StudentSkill", back_populates="student", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="student", cascade="all, delete-orphan")
    active_internships = relationship("Internship", back_populates="student")
    tasks = relationship("Task", back_populates="student", cascade="all, delete-orphan")
    reports = relationship("WeeklyReport", back_populates="student", cascade="all, delete-orphan")
    interventions = relationship("Intervention", back_populates="student", cascade="all, delete-orphan")


class Mentor(Base):
    __tablename__ = "mentors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    department = Column(String(100), nullable=False, default="Computer Science & Engineering")
    designation = Column(String(100), nullable=False, default="Assistant Professor")
    employee_id = Column(String(50), unique=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="mentor_profile")
    assigned_students = relationship("Student", back_populates="assigned_mentor", foreign_keys="Student.mentor_id")
    assigned_internships = relationship("Internship", back_populates="mentor")
    interventions = relationship("Intervention", back_populates="mentor")


class ExternalMentor(Base):
    __tablename__ = "external_mentors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    designation = Column(String(100), default="Company Internship Coordinator", nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="external_mentor_profile")
    company = relationship("Company", back_populates="external_mentors")
    assigned_students = relationship("ExternalMentorStudent", back_populates="external_mentor", cascade="all, delete-orphan")


class ExternalMentorStudent(Base):
    __tablename__ = "external_mentor_students"

    id = Column(Integer, primary_key=True, index=True)
    external_mentor_id = Column(Integer, ForeignKey("external_mentors.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    internship_id = Column(Integer, ForeignKey("internships.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    external_mentor = relationship("ExternalMentor", back_populates="assigned_students")
    student = relationship("Student")
    internship = relationship("Internship")


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    industry = Column(String(100), nullable=False)
    website = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    internships = relationship("Internship", back_populates="company", cascade="all, delete-orphan")
    external_mentors = relationship("ExternalMentor", back_populates="company", cascade="all, delete-orphan")


class Internship(Base):
    __tablename__ = "internships"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    mentor_id = Column(Integer, ForeignKey("mentors.id", ondelete="SET NULL"), nullable=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="SET NULL"), nullable=True)
    domain = Column(String(100), default="Software Development", nullable=False, index=True)
    description = Column(Text, nullable=False)
    location = Column(String(255), default="Remote", nullable=False)
    is_remote = Column(Boolean, default=True, nullable=False)
    stipend = Column(Float, default=0.0, nullable=False)
    duration_weeks = Column(Integer, default=8, nullable=False)
    status = Column(String(50), default="AVAILABLE", nullable=False)  # "AVAILABLE", "ACTIVE", "COMPLETED", "CLOSED"
    completion_status = Column(String(50), default="IN_PROGRESS", nullable=False)  # "IN_PROGRESS", "COMPLETION_PENDING", "COMPLETED"
    deadline = Column(DateTime, nullable=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    company = relationship("Company", back_populates="internships")
    mentor = relationship("Mentor", back_populates="assigned_internships")
    student = relationship("Student", back_populates="active_internships")
    skills = relationship("InternshipSkill", back_populates="internship", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="internship", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="internship", cascade="all, delete-orphan")
    reports = relationship("WeeklyReport", back_populates="internship", cascade="all, delete-orphan")


class StudentSkill(Base):
    __tablename__ = "student_skills"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    skill_name = Column(String(100), nullable=False, index=True)

    student = relationship("Student", back_populates="skills")


class InternshipSkill(Base):
    __tablename__ = "internship_skills"

    id = Column(Integer, primary_key=True, index=True)
    internship_id = Column(Integer, ForeignKey("internships.id", ondelete="CASCADE"), nullable=False)
    skill_name = Column(String(100), nullable=False, index=True)

    internship = relationship("Internship", back_populates="skills")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    internship_id = Column(Integer, ForeignKey("internships.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="PENDING", nullable=False)  # "PENDING", "APPLIED", "UNDER_REVIEW", "SHORTLISTED", "APPROVED", "SELECTED", "REJECTED"
    applied_at = Column(DateTime, default=utc_now, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)
    review_notes = Column(Text, nullable=True)
    application_data = Column(Text, nullable=True)
    submitted_skills = Column(Text, nullable=True)
    skill_match_percentage = Column(Float, default=0.0, nullable=False)
    matched_skills = Column(Text, nullable=True)
    missing_skills = Column(Text, nullable=True)
    skill_recommendation = Column(Text, nullable=True)

    student = relationship("Student", back_populates="applications")
    internship = relationship("Internship", back_populates="applications")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    internship_id = Column(Integer, ForeignKey("internships.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="SET NULL"), nullable=True)
    mentor_id = Column(Integer, ForeignKey("mentors.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String(50), default="MEDIUM", nullable=False)  # "LOW", "MEDIUM", "HIGH"
    status = Column(String(50), default="PENDING", nullable=False)  # "PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE"
    due_date = Column(DateTime, nullable=True)
    is_completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    external_mentor_id = Column(Integer, ForeignKey("external_mentors.id", ondelete="SET NULL"), nullable=True)
    assigned_by = Column(String(255), nullable=True)
    source = Column(String(100), default="Company Provided", nullable=True)
    feedback = Column(Text, nullable=True)
    score = Column(Float, nullable=True)
    task_link = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    internship = relationship("Internship", back_populates="tasks")
    student = relationship("Student", back_populates="tasks")
    external_mentor = relationship("ExternalMentor", foreign_keys=[external_mentor_id])


class WeeklyReport(Base):
    __tablename__ = "weekly_reports"

    id = Column(Integer, primary_key=True, index=True)
    internship_id = Column(Integer, ForeignKey("internships.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    week_number = Column(Integer, nullable=False)
    achievements = Column(Text, nullable=False)
    challenges = Column(Text, nullable=True)
    evidence_url = Column(String(500), nullable=True)
    hours_spent = Column(Float, default=40.0, nullable=False)
    status = Column(String(50), default="SUBMITTED", nullable=False)  # "SUBMITTED", "REVIEWED"
    mentor_feedback = Column(Text, nullable=True)
    mentor_score = Column(Float, nullable=True)  # 0 to 100
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    task_title = Column(String(255), nullable=True)
    submitted_at = Column(DateTime, default=utc_now, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)

    internship = relationship("Internship", back_populates="reports")
    student = relationship("Student", back_populates="reports")
    task = relationship("Task")


class Intervention(Base):
    __tablename__ = "interventions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    mentor_id = Column(Integer, ForeignKey("mentors.id", ondelete="SET NULL"), nullable=True)
    intervention_type = Column(String(100), nullable=False)  # e.g. "1-on-1 Academic Check-in"
    notes = Column(Text, nullable=False)
    action_taken = Column(String(255), nullable=True)
    status = Column(String(50), default="COMPLETED", nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    student = relationship("Student", back_populates="interventions")
    mentor = relationship("Mentor", back_populates="interventions")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    mentor_id = Column(Integer, ForeignKey("mentors.id", ondelete="CASCADE"), nullable=False, index=True)
    external_mentor_id = Column(Integer, ForeignKey("external_mentors.id", ondelete="SET NULL"), nullable=True, index=True)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])
    student = relationship("Student")
    mentor = relationship("Mentor")
    external_mentor = relationship("ExternalMentor", foreign_keys=[external_mentor_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="SYSTEM", nullable=False)  # "MENTOR_ASSIGNMENT", "REMINDER", "PENDING_WORK", "MESSAGE", "SYSTEM"
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User")


class KnowledgeHandoff(Base):
    __tablename__ = "knowledge_handoffs"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    mentor_id = Column(Integer, ForeignKey("mentors.id", ondelete="SET NULL"), nullable=True, index=True)
    internship_id = Column(Integer, ForeignKey("internships.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    overview = Column(Text, nullable=False)
    completed_work = Column(Text, nullable=True)
    technologies = Column(Text, nullable=True)
    learned_concepts = Column(Text, nullable=True)
    implementation_notes = Column(Text, nullable=True)
    challenges = Column(Text, nullable=True)
    solutions = Column(Text, nullable=True)
    resources = Column(Text, nullable=True)
    repository_url = Column(String(500), nullable=True)
    deployment_url = Column(String(500), nullable=True)
    pending_work = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    known_issues = Column(Text, nullable=True)
    final_notes = Column(Text, nullable=True)
    status = Column(String(50), default="DRAFT", nullable=False)  # "DRAFT", "SUBMITTED", "APPROVED", "CHANGES_REQUESTED"
    mentor_feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, nullable=False)

    student = relationship("Student")
    mentor = relationship("Mentor")
    internship = relationship("Internship")


class SkillDependency(Base):
    __tablename__ = "skill_dependencies"

    id = Column(Integer, primary_key=True, index=True)
    skill = Column(String(150), nullable=False, index=True)
    prerequisite_skill = Column(String(150), nullable=False, index=True)
    relationship = Column(String(50), default="REQUIRES", nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    certificate_id = Column(String(100), unique=True, nullable=False, index=True)  # e.g. CERT-2026-0001
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    internship_id = Column(Integer, ForeignKey("internships.id", ondelete="CASCADE"), nullable=False, index=True)
    mentor_id = Column(Integer, ForeignKey("mentors.id", ondelete="SET NULL"), nullable=True)
    student_name = Column(String(255), nullable=False)
    internship_title = Column(String(255), nullable=False)
    company_name = Column(String(255), nullable=False)
    domain = Column(String(100), default="Software Development", nullable=False)
    duration_weeks = Column(Integer, default=8, nullable=False)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    mentor_name = Column(String(255), nullable=True)
    institution_name = Column(String(255), default="Smart Internship Monitoring & Academic Governance System", nullable=False)
    statement = Column(Text, nullable=False)
    issued_at = Column(DateTime, default=utc_now, nullable=False)

    student = relationship("Student")
    internship = relationship("Internship")
    mentor = relationship("Mentor")



