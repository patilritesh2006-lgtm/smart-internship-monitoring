from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ==============================================================================
# Authentication Schemas
# ==============================================================================

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=255)
    role: str = Field(default="STUDENT", max_length=50)  # "STUDENT" or "MENTOR" only via public API
    department: Optional[str] = Field(default="Computer Science & Engineering", max_length=100)
    roll_number: Optional[str] = Field(default=None, max_length=50)  # for student
    academic_year: Optional[int] = Field(default=3, ge=1, le=6)  # 1-6 valid academic years
    designation: Optional[str] = Field(default=None, max_length=100)  # for mentor
    employee_id: Optional[str] = Field(default=None, max_length=50)  # for mentor


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    full_name: str
    role: str
    mentor_id: Optional[str] = None
    employee_id: Optional[str] = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    mentor_id: Optional[str] = None
    employee_id: Optional[str] = None


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
    mentor_id: Optional[int] = None
    mentor_code: Optional[str] = None
    mentor_employee_id: Optional[str] = None
    mentor_name: Optional[str] = None
    mentor_email: Optional[str] = None
    mentor_department: Optional[str] = None
    mentor_designation: Optional[str] = None
    internship_id: Optional[int] = None
    internship_title: Optional[str] = None
    company_name: Optional[str] = None
    internship_status: Optional[str] = None
    application_status: Optional[str] = None


class AssignMentorRequest(BaseModel):
    mentor_id: Optional[int] = None


class StudentProfileUpdate(BaseModel):
    phone: Optional[str] = Field(default=None, max_length=50)
    department: Optional[str] = Field(default=None, max_length=100)
    academic_year: Optional[int] = Field(default=None, ge=1, le=6)
    skills: Optional[List[str]] = Field(default=None, max_length=50)  # max 50 skills


class MentorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    mentor_id: str = ""
    mentor_code: str = ""
    user_id: int
    department: str
    designation: str
    employee_id: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    status: str = "ACTIVE"
    is_active: bool = True
    assigned_students_count: int = 0
    active_internships_count: int = 0
    assigned_student_names: List[str] = []


# ==============================================================================
# External Mentor / Company Coordinator Schemas
# ==============================================================================

class ExternalMentorCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=255)
    company_id: int
    phone: Optional[str] = Field(default=None, max_length=50)
    designation: Optional[str] = Field(default="Company Internship Coordinator", max_length=100)
    assigned_student_ids: Optional[List[int]] = []


class ExternalMentorUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=50)
    designation: Optional[str] = Field(default=None, max_length=100)
    company_id: Optional[int] = None
    is_active: Optional[bool] = None
    assigned_student_ids: Optional[List[int]] = None


class ExternalMentorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    company_id: int
    company_name: str
    full_name: str
    email: str
    phone: Optional[str] = None
    designation: str
    is_active: bool = True
    assigned_students_count: int = 0
    assigned_students: List[Dict[str, Any]] = []
    created_at: datetime
    updated_at: datetime


class ExternalMentorAssignRequest(BaseModel):
    student_ids: List[int]
    action: Optional[str] = "assign"  # "assign" or "remove"


class CompanyCoordinatorInfo(BaseModel):
    id: int
    user_id: int
    name: str
    email: str
    coordinator_name: Optional[str] = None
    coordinator_email: Optional[str] = None
    phone: Optional[str] = None
    designation: str
    company_id: int
    company_name: str
    internship_id: Optional[int] = None
    internship_title: Optional[str] = None


# ==============================================================================
# Company & Internship Schemas
# ==============================================================================

class CompanyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    industry: str = Field(default="Technology", min_length=1, max_length=100)
    location: Optional[str] = "Global"
    website: Optional[str] = None
    contact_email: Optional[str] = None
    description: Optional[str] = None
    is_verified: Optional[bool] = True
    is_active: bool = True


class CompanyUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    industry: Optional[str] = Field(default=None, min_length=1, max_length=100)
    location: Optional[str] = None
    website: Optional[str] = None
    contact_email: Optional[str] = None
    description: Optional[str] = None
    is_verified: Optional[bool] = None
    is_active: Optional[bool] = None


class CompanyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    industry: str
    location: Optional[str] = "Global"
    website: Optional[str] = None
    contact_email: Optional[str] = None
    description: Optional[str] = None
    is_verified: bool = True
    is_active: bool = True
    internships_count: int = 0
    active_internships_count: int = 0


class InternshipCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    company_id: Optional[int] = None
    company_name: Optional[str] = None
    industry: str = "Technology"
    domain: str = "Software Development"
    description: str = Field(..., min_length=1)
    location: str = "Remote"
    is_remote: bool = True
    stipend: float = 0.0
    duration_weeks: int = 8
    required_skills: List[str] = []
    deadline: Optional[datetime] = None
    status: str = "AVAILABLE"
    publish: bool = True


class InternshipUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    company_id: Optional[int] = None
    company_name: Optional[str] = None
    industry: Optional[str] = None
    domain: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    is_remote: Optional[bool] = None
    stipend: Optional[float] = None
    duration_weeks: Optional[int] = None
    required_skills: Optional[List[str]] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None
    completion_status: Optional[str] = None


class InternshipOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    company_id: int
    company_name: str
    company_industry: Optional[str] = None
    domain: str = "Software Development"
    location: str
    is_remote: bool
    stipend: float
    duration_weeks: int
    status: str
    completion_status: str = "IN_PROGRESS"
    description: str
    required_skills: List[str] = []
    deadline: Optional[datetime] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    mentor_id: Optional[int] = None
    mentor_name: Optional[str] = None
    student_id: Optional[int] = None
    student_name: Optional[str] = None
    company_coordinator_name: Optional[str] = None
    company_coordinator_email: Optional[str] = None
    created_at: datetime


# ==============================================================================
# Application Schemas
# ==============================================================================

class ApplicationCreate(BaseModel):
    internship_id: int


class ApplicationSubmitPayload(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    college: Optional[str] = None
    degree: Optional[str] = None
    department: Optional[str] = None
    current_year: Optional[int] = None
    graduation_year: Optional[int] = None
    technical_skills: Optional[List[str]] = None
    programming_languages: Optional[List[str]] = None
    frameworks: Optional[List[str]] = None
    tools: Optional[List[str]] = None
    soft_skills: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    cgpa: Optional[str] = None
    relevant_coursework: Optional[str] = None
    previous_internship_experience: Optional[str] = None
    work_experience: Optional[str] = None
    project_title: Optional[str] = None
    project_description: Optional[str] = None
    project_technologies: Optional[str] = None
    projects: Optional[List[Dict[str, Any]]] = None
    resume_url: Optional[str] = None
    certifications: Optional[str] = None
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    additional_info: Optional[str] = None


class ApplicationReview(BaseModel):
    status: Optional[str] = None  # "APPROVED", "SELECTED", "SHORTLISTED", "UNDER_REVIEW", "REJECTED"
    action: Optional[str] = None  # "APPROVED", "ACCEPTED", "SELECTED", "SHORTLISTED", "UNDER_REVIEW", or "REJECTED"
    mentor_id: Optional[int] = None
    review_notes: Optional[str] = None


class TaskCreateByCoordinator(BaseModel):
    student_id: int
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    priority: Optional[str] = "MEDIUM"
    due_date: Optional[datetime] = None


class TaskEvaluationPayload(BaseModel):
    feedback: str = Field(..., min_length=1)
    score: Optional[float] = Field(None, ge=0.0, le=100.0)


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    internship_id: int
    student_id: int
    student_name: Optional[str] = None
    application_id: Optional[int] = None
    mentor_id: Optional[int] = None
    internal_mentor_name: Optional[str] = None
    external_mentor_id: Optional[int] = None
    internship_title: Optional[str] = None
    company_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    priority: str = "MEDIUM"
    status: str = "PENDING"
    due_date: Optional[datetime] = None
    is_completed: bool
    completed_at: Optional[datetime] = None
    company_coordinator_name: Optional[str] = None
    company_coordinator_email: Optional[str] = None
    assigned_by: Optional[str] = "Company Coordinator"
    source: Optional[str] = "Company Provided"
    feedback: Optional[str] = None
    score: Optional[float] = None
    task_link: Optional[str] = None
    evidence_url: Optional[str] = None
    created_at: datetime


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    student_name: str
    student_email: str
    internship_id: int
    internship_title: str
    company_name: str
    domain: Optional[str] = "Software Development"
    status: str
    applied_at: datetime
    reviewed_at: Optional[datetime] = None
    review_notes: Optional[str] = None
    skill_match_percentage: float = 0.0
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    skill_recommendation: Optional[str] = None
    required_skills: List[str] = []
    submitted_skills: List[str] = []
    application_data: Optional[Dict[str, Any]] = None
    mentor_id: Optional[int] = None
    mentor_name: Optional[str] = None
    mentor_code: Optional[str] = None
    tasks_total: int = 0
    tasks_completed: int = 0
    tasks: List[TaskOut] = []
    company_coordinator_name: Optional[str] = None
    company_coordinator_email: Optional[str] = None


# ==============================================================================
# Task Schemas
# ==============================================================================

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[str] = "MEDIUM"
    internship_id: Optional[int] = None
    application_id: Optional[int] = None
    source: Optional[str] = None


class TaskUpdate(BaseModel):
    is_completed: bool


# ==============================================================================
# Weekly Report & Timesheet Schemas
# ==============================================================================

class WeeklyReportCreate(BaseModel):
    week_number: int = Field(..., ge=1, le=52)
    achievements: str = Field(..., min_length=1, max_length=5000)
    challenges: Optional[str] = Field(default=None, max_length=5000)
    evidence_url: Optional[str] = Field(default=None, max_length=500)
    require_evidence: Optional[bool] = False
    hours_spent: float = Field(default=40.0, ge=0, le=168)  # max 168 hours/week
    task_id: Optional[int] = None
    task_title: Optional[str] = None
    task_link: Optional[str] = None


class TimesheetTaskSubmission(BaseModel):
    task_id: Optional[int] = None
    task_title: str
    task_link: str
    hours_spent: Optional[float] = 8.0
    week_number: Optional[int] = None
    notes: Optional[str] = None


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
    evidence_url: Optional[str] = None
    hours_spent: float
    status: str
    mentor_feedback: Optional[str] = None
    mentor_score: Optional[float] = None
    task_id: Optional[int] = None
    task_title: Optional[str] = None
    task_link: Optional[str] = None
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
    attendance_rate: Optional[float] = None
    task_velocity: Optional[float] = None
    report_punctuality: Optional[float] = None
    days_since_last_activity: Optional[int] = None
    activity_consistency: Optional[float] = None
    progress_trend: Optional[str] = None
    days_remaining: Optional[int] = None


class ProgressAttentionResponseSchema(BaseModel):
    attention_score: float
    attention_status: str  # "ON_TRACK", "MONITOR", "NEEDS_ATTENTION"
    factors: ProgressFactorBreakdown
    reasons: List[str]
    recommendations: List[str]
    progress_health_score: Optional[float] = None
    progress_trend: Optional[str] = None
    risk_probability: Optional[float] = None
    risk_label: Optional[str] = None
    model_version: Optional[str] = None
    model_available: Optional[bool] = None
    top_risk_factors: Optional[List[Dict[str, Any]]] = None


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
    application_status: Optional[str] = None
    internship_status: Optional[str] = None
    pending_tasks_count: Optional[int] = None


# ==============================================================================
# Intervention Schemas
# ==============================================================================

class InterventionCreate(BaseModel):
    intervention_type: str = Field(default="1-on-1 Academic Check-in", max_length=100)
    notes: str = Field(..., min_length=1, max_length=5000)
    action_taken: Optional[str] = Field(default=None, max_length=255)


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
    internship_domain: str = "Software Development"
    internship_description: str
    internship_location: str
    internship_status: str
    completion_status: str = "IN_PROGRESS"
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
    total_mentors: int = 0
    total_companies: int = 0
    total_internships: int
    active_internships: int
    available_internships: int = 0
    total_applications: int = 0
    pending_applications: int
    pending_tasks_count: int = 0
    pending_reports_count: int = 0
    pending_work_count: int = 0
    on_track_count: int
    monitor_count: int
    needs_attention_count: int
    average_attention_score: float
    pending_mentor_allocations: int = 0
    completed_internships: int = 0
    task_completion_rate: float = 0.0
    lifecycle: Optional[LifecycleStages] = None
    departments: List[DepartmentAnalytics] = []


# ==============================================================================
# Messaging & Notification Schemas
# ==============================================================================

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    student_id: Optional[int] = None
    recipient_role: Optional[str] = None  # "MENTOR" or "EXTERNAL_MENTOR"
    external_mentor_id: Optional[int] = None


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sender_id: int
    sender_name: str
    sender_role: str
    receiver_id: int
    receiver_name: str
    student_id: int
    mentor_id: Optional[int] = None
    external_mentor_id: Optional[int] = None
    content: str
    is_read: bool
    created_at: datetime


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime


# ==============================================================================
# Knowledge Handoff Schemas
# ==============================================================================

class KnowledgeHandoffCreate(BaseModel):
    internship_id: Optional[int] = None
    title: str = Field(..., min_length=2, max_length=255)
    overview: str = Field(..., min_length=2)
    completed_work: Optional[str] = None
    technologies: Optional[Union[str, List[str]]] = None
    learned_concepts: Optional[str] = None
    implementation_notes: Optional[str] = None
    challenges: Optional[str] = None
    solutions: Optional[str] = None
    resources: Optional[str] = None
    repository_url: Optional[str] = None
    deployment_url: Optional[str] = None
    pending_work: Optional[str] = None
    recommendations: Optional[str] = None
    known_issues: Optional[str] = None
    final_notes: Optional[str] = None
    status: str = "SUBMITTED"  # "DRAFT" or "SUBMITTED"


class KnowledgeHandoffUpdate(BaseModel):
    title: Optional[str] = None
    overview: Optional[str] = None
    completed_work: Optional[str] = None
    technologies: Optional[Union[str, List[str]]] = None
    learned_concepts: Optional[str] = None
    implementation_notes: Optional[str] = None
    challenges: Optional[str] = None
    solutions: Optional[str] = None
    resources: Optional[str] = None
    repository_url: Optional[str] = None
    deployment_url: Optional[str] = None
    pending_work: Optional[str] = None
    recommendations: Optional[str] = None
    known_issues: Optional[str] = None
    final_notes: Optional[str] = None
    status: Optional[str] = None


class KnowledgeHandoffReview(BaseModel):
    status: str  # "APPROVED" or "CHANGES_REQUESTED"
    mentor_feedback: Optional[str] = None


class KnowledgeHandoffOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    student_name: str = ""
    student_email: str = ""
    mentor_id: Optional[int] = None
    mentor_name: Optional[str] = None
    internship_id: int
    internship_title: str = ""
    company_name: str = ""
    domain: str = "Software Development"
    title: str
    overview: str
    completed_work: Optional[str] = None
    technologies: Optional[str] = None
    learned_concepts: Optional[str] = None
    implementation_notes: Optional[str] = None
    challenges: Optional[str] = None
    solutions: Optional[str] = None
    resources: Optional[str] = None
    repository_url: Optional[str] = None
    deployment_url: Optional[str] = None
    pending_work: Optional[str] = None
    recommendations: Optional[str] = None
    known_issues: Optional[str] = None
    final_notes: Optional[str] = None
    status: str
    mentor_feedback: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ==============================================================================
# Skill Dependency Graph Schemas
# ==============================================================================

class SkillDependencyCreate(BaseModel):
    skill: str = Field(..., min_length=1, max_length=150)
    prerequisite_skill: str = Field(..., min_length=1, max_length=150)
    relationship: str = "REQUIRES"
    description: Optional[str] = None


class SkillDependencyUpdate(BaseModel):
    skill: Optional[str] = None
    prerequisite_skill: Optional[str] = None
    relationship: Optional[str] = None
    description: Optional[str] = None


class SkillDependencyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    skill: str
    prerequisite_skill: str
    relationship: str = "REQUIRES"
    description: Optional[str] = None
    created_at: datetime


class SkillDependencyChainItem(BaseModel):
    target_skill: str
    is_missing: bool
    chain: List[str] = []
    missing_prerequisites: List[str] = []
    recommended_first_skill: str


class SkillDependencyGraphRequest(BaseModel):
    student_skills: List[str] = []
    required_skills: List[str] = []
    internship_id: Optional[int] = None


class SkillDependencyGraphOut(BaseModel):
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []
    chains: List[SkillDependencyChainItem] = []
    recommended_learning_order: List[str] = []
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    missing_target_skills: List[str] = []
    missing_prerequisite_skills: List[str] = []


# ==============================================================================
# Certificate & Completion Schemas
# ==============================================================================

class CertificateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    certificate_id: str
    student_id: int
    internship_id: int
    mentor_id: Optional[int] = None
    student_name: str
    internship_title: str
    company_name: str
    domain: str
    duration_weeks: int
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    mentor_name: Optional[str] = None
    institution_name: str
    statement: str
    issued_at: datetime


class CompletionStatusOut(BaseModel):
    internship_id: int
    internship_title: str
    company_name: str
    domain: str
    status: str
    completion_status: str
    tasks_total: int
    tasks_completed: int
    all_tasks_completed: bool
    reports_submitted: int
    reports_required: int
    reports_requirement_met: bool
    mentor_confirmed: bool
    eligible_for_certificate: bool
    blocking_reasons: List[str] = []
    certificate: Optional[CertificateOut] = None




