from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ==============================================================================
# Authentication Schemas
# ==============================================================================

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)
    role: str = Field(default="STUDENT")  # "STUDENT", "MENTOR", "ADMIN"
    department: Optional[str] = "Computer Science & Engineering"
    roll_number: Optional[str] = None  # for student
    academic_year: Optional[int] = 3   # for student
    designation: Optional[str] = None  # for mentor
    employee_id: Optional[str] = None  # for mentor


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    full_name: str
    role: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime


# ==============================================================================
# Student & Mentor Profile Schemas
# ==============================================================================

class StudentSkillOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    skill_name: str


class StudentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    roll_number: str
    department: str
    academic_year: int
    phone: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    skills: List[str] = []


class StudentProfileUpdate(BaseModel):
    phone: Optional[str] = None
    department: Optional[str] = None
    academic_year: Optional[int] = None
    skills: Optional[List[str]] = None


class MentorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    department: str
    designation: str
    employee_id: str
    full_name: Optional[str] = None
    email: Optional[str] = None


# ==============================================================================
# Company & Internship Schemas
# ==============================================================================

class CompanyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    industry: str
    website: Optional[str] = None
    contact_email: Optional[str] = None
    description: Optional[str] = None


class InternshipCreate(BaseModel):
    title: str
    company_name: str
    industry: str = "Technology"
    description: str
    location: str = "Remote"
    is_remote: bool = True
    stipend: float = 0.0
    duration_weeks: int = 8
    required_skills: List[str] = []


class InternshipOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    company_id: int
    company_name: str
    location: str
    is_remote: bool
    stipend: float
    duration_weeks: int
    status: str
    description: str
    required_skills: List[str] = []
    mentor_id: Optional[int] = None
    mentor_name: Optional[str] = None
    student_id: Optional[int] = None
    student_name: Optional[str] = None
    created_at: datetime


# ==============================================================================
# Application Schemas
# ==============================================================================

class ApplicationCreate(BaseModel):
    internship_id: int


class ApplicationReview(BaseModel):
    status: Optional[str] = None  # "APPROVED" or "REJECTED"
    action: Optional[str] = None  # "APPROVED", "ACCEPTED" or "REJECTED"
    mentor_id: Optional[int] = None
    review_notes: Optional[str] = None



class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    student_name: str
    student_email: str
    internship_id: int
    internship_title: str
    company_name: str
    status: str
    applied_at: datetime
    reviewed_at: Optional[datetime] = None
    review_notes: Optional[str] = None


# ==============================================================================
# Task Schemas
# ==============================================================================

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None


class TaskUpdate(BaseModel):
    is_completed: bool


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    internship_id: int
    student_id: int
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    is_completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime


# ==============================================================================
# Weekly Report Schemas
# ==============================================================================

class WeeklyReportCreate(BaseModel):
    week_number: int
    achievements: str
    challenges: Optional[str] = None
    hours_spent: float = 40.0


class WeeklyReportReview(BaseModel):
    mentor_feedback: str
    mentor_score: float = Field(..., ge=0, le=100)


class WeeklyReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    internship_id: int
    student_id: int
    student_name: Optional[str] = None
    week_number: int
    achievements: str
    challenges: Optional[str] = None
    hours_spent: float
    status: str
    mentor_feedback: Optional[str] = None
    mentor_score: Optional[float] = None
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None


# ==============================================================================
# Analytics & Intelligence Schemas
# ==============================================================================

class SkillGapRequestSchema(BaseModel):
    student_skills: List[str]
    required_skills: List[str]


class SkillGapResponseSchema(BaseModel):
    matched_skills: List[str]
    missing_skills: List[str]
    match_percentage: float
    recommendation: str


class ProgressFactorBreakdown(BaseModel):
    progress_consistency: float
    task_completion: float
    report_submission: float
    mentor_feedback: float


class ProgressAttentionResponseSchema(BaseModel):
    attention_score: float
    attention_status: str  # "ON_TRACK", "MONITOR", "NEEDS_ATTENTION"
    factors: ProgressFactorBreakdown
    reasons: List[str]
    recommendations: List[str]


class InternTriageItem(BaseModel):
    student_id: int
    student_name: str
    student_email: str
    internship_id: int
    internship_title: str
    company_name: str
    attention_score: float
    attention_status: str
    tasks_completed: int
    tasks_total: int
    reports_submitted: int
    reports_expected: int
    average_mentor_score: Optional[float] = None
    reasons: List[str] = []
    recommendations: List[str] = []


# ==============================================================================
# Intervention Schemas
# ==============================================================================

class InterventionCreate(BaseModel):
    intervention_type: str = "1-on-1 Academic Check-in"
    notes: str
    action_taken: Optional[str] = None


class InterventionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    mentor_id: Optional[int] = None
    mentor_name: Optional[str] = None
    intervention_type: str
    notes: str
    action_taken: Optional[str] = None
    status: str
    created_at: datetime


class StudentDetailOut(BaseModel):
    """Full student monitoring detail for faculty inspection - single aggregated response."""

    # Student Profile
    student_id: int
    student_name: str
    student_email: str
    department: str
    roll_number: str
    academic_year: int
    student_skills: List[str] = []

    # Internship Profile
    internship_id: int
    internship_title: str
    company_name: str
    internship_description: str
    internship_location: str
    internship_status: str
    duration_weeks: int
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    required_skills: List[str] = []

    # Mentor Info
    mentor_name: Optional[str] = None
    mentor_email: Optional[str] = None

    # Tasks / Milestones
    tasks: List[TaskOut] = []
    tasks_total: int
    tasks_completed: int

    # Weekly Reports
    reports: List[WeeklyReportOut] = []
    reports_submitted: int
    reports_expected: int

    # Attention Metrics (from deterministic intelligence engine)
    attention_score: float
    attention_status: str
    factors: ProgressFactorBreakdown
    reasons: List[str] = []
    recommendations: List[str] = []

    # Skill Gap Analysis
    skill_gap: Optional[Dict[str, Any]] = None

    # Interventions History
    interventions: List[InterventionOut] = []


class DepartmentAnalytics(BaseModel):
    department: str
    student_count: int
    active_internships: int
    completion_rate: float
    average_attention_score: float


class LifecycleStages(BaseModel):
    applications_total: int
    applications_pending: int
    applications_approved: int
    active_internships: int
    reports_submitted: int
    reports_reviewed: int
    completed_internships: int


class InstitutionalAnalyticsSchema(BaseModel):
    total_students: int
    total_internships: int
    active_internships: int
    pending_applications: int
    on_track_count: int
    monitor_count: int
    needs_attention_count: int
    average_attention_score: float
    pending_mentor_allocations: int = 0
    completed_internships: int = 0
    task_completion_rate: float = 0.0
    lifecycle: Optional[LifecycleStages] = None
    departments: List[DepartmentAnalytics] = []


