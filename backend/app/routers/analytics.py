from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_user
from backend.app.models import Internship, Mentor, Student, User
from backend.app.routers.students import compute_student_attention_metrics
from backend.app.schemas import (
    ProgressAttentionResponseSchema,
    ProgressFactorBreakdown,
    SkillGapRequestSchema,
    SkillGapResponseSchema,
)
from intelligence.app import analyze_skill_gap, evaluate_progress_attention

router = APIRouter(prefix="/analytics", tags=["Analytics & Intelligence"])


@router.post("/skill-gap", response_model=SkillGapResponseSchema)
def run_skill_gap_analysis(
    payload: SkillGapRequestSchema,
    current_user: User = Depends(get_current_user),
):
    """
    Executes deterministic skill gap analysis using the Intelligence Engine.
    Performs case-insensitive matching, deduplication, and generates actionable recommendations.
    """
    result = analyze_skill_gap(
        student_skills=payload.student_skills,
        required_skills=payload.required_skills,
    )

    return SkillGapResponseSchema(
        matched_skills=result.matched_skills,
        missing_skills=result.missing_skills,
        match_percentage=float(result.match_percentage),
        recommendation=result.recommendation,
    )


@router.get("/progress-attention/{student_id}", response_model=ProgressAttentionResponseSchema)
def get_student_progress_attention(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Evaluates real progress attention for a student from database milestones,
    task completion, weekly report submissions, and mentor feedback.
    Enforces role-based resource ownership:
    - Students may only view their own attention metrics.
    - Mentors may only view attention metrics for interns they actively supervise.
    - Admins have institutional oversight across all students.
    """
    if current_user.role == "STUDENT":
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student or student.id != student_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You cannot view another student's progress attention data",
            )
    elif current_user.role == "MENTOR":
        mentor = db.query(Mentor).filter(Mentor.user_id == current_user.id).first()
        if not mentor:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Mentor profile not found")
        assigned = (
            db.query(Internship)
            .filter(Internship.mentor_id == mentor.id, Internship.student_id == student_id)
            .first()
        )
        if not assigned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You are not assigned to supervise this student",
            )
    elif current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return compute_student_attention_metrics(student_id, db)


@router.post("/evaluate-progress-simulation", response_model=ProgressAttentionResponseSchema)
def simulate_progress_evaluation(
    payload: ProgressFactorBreakdown,
    current_user: User = Depends(get_current_user),
):
    """
    Interactive simulation endpoint for testing the 4-factor Attention Engine with arbitrary values.
    """
    try:
        engine_result = evaluate_progress_attention({
            "progress_consistency": payload.progress_consistency,
            "task_completion": payload.task_completion,
            "report_submission": payload.report_submission,
            "mentor_feedback": payload.mentor_feedback,
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return ProgressAttentionResponseSchema(
        attention_score=float(engine_result.score),
        attention_status=str(engine_result.status),
        factors=payload,
        reasons=engine_result.reasons,
        recommendations=engine_result.recommendations,
    )
