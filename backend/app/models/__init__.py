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


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    roll_number = Column(String(50), unique=True, index=True, nullable=False)
    department = Column(String(100), nullable=False, default="Computer Science & Engineering")
    academic_year = Column(Integer, default=3, nullable=False)
    phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="student_profile")
    skills = relationship("StudentSkill", back_populates="student", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="student", cascade="all, delete-orphan")
    active_internships = relationship("Internship", back_populates="student")
    tasks = relationship("Task", back_populates="student", cascade="all, delete-orphan")
    reports = relationship("WeeklyReport", back_populates="student", cascade="all, delete-orphan")


class Mentor(Base):
    __tablename__ = "mentors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    department = Column(String(100), nullable=False, default="Computer Science & Engineering")
    designation = Column(String(100), nullable=False, default="Assistant Professor")
    employee_id = Column(String(50), unique=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="mentor_profile")
    assigned_internships = relationship("Internship", back_populates="mentor")


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    industry = Column(String(100), nullable=False)
    website = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    internships = relationship("Internship", back_populates="company", cascade="all, delete-orphan")


class Internship(Base):
    __tablename__ = "internships"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    mentor_id = Column(Integer, ForeignKey("mentors.id", ondelete="SET NULL"), nullable=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="SET NULL"), nullable=True)
    description = Column(Text, nullable=False)
    location = Column(String(255), default="Remote", nullable=False)
    is_remote = Column(Boolean, default=True, nullable=False)
    stipend = Column(Float, default=0.0, nullable=False)
    duration_weeks = Column(Integer, default=8, nullable=False)
    status = Column(String(50), default="AVAILABLE", nullable=False)  # "AVAILABLE", "ACTIVE", "COMPLETED", "CLOSED"
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
    status = Column(String(50), default="PENDING", nullable=False)  # "PENDING", "APPROVED", "REJECTED"
    applied_at = Column(DateTime, default=utc_now, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)
    review_notes = Column(Text, nullable=True)

    student = relationship("Student", back_populates="applications")
    internship = relationship("Internship", back_populates="applications")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    internship_id = Column(Integer, ForeignKey("internships.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=True)
    is_completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    internship = relationship("Internship", back_populates="tasks")
    student = relationship("Student", back_populates="tasks")


class WeeklyReport(Base):
    __tablename__ = "weekly_reports"

    id = Column(Integer, primary_key=True, index=True)
    internship_id = Column(Integer, ForeignKey("internships.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    week_number = Column(Integer, nullable=False)
    achievements = Column(Text, nullable=False)
    challenges = Column(Text, nullable=True)
    hours_spent = Column(Float, default=40.0, nullable=False)
    status = Column(String(50), default="SUBMITTED", nullable=False)  # "SUBMITTED", "REVIEWED"
    mentor_feedback = Column(Text, nullable=True)
    mentor_score = Column(Float, nullable=True)  # 0 to 100
    submitted_at = Column(DateTime, default=utc_now, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)

    internship = relationship("Internship", back_populates="reports")
    student = relationship("Student", back_populates="reports")
