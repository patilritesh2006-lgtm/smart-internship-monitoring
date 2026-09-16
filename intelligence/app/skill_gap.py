"""
Skill Gap Analysis module for internship candidates and enrolled interns.
Performs case-insensitive matching, normalization, gap analysis, and generates
transparent, rule-based recommendations.
"""

from typing import Any, Dict, List, Optional, Union
import pandas as pd
from intelligence.app.models import SkillGapRequest, SkillGapResult


def generate_skill_recommendation(missing_skills: Optional[List[str]] = None) -> str:
    """
    Generates a rule-based, transparent recommendation based on missing skills.
    Does not use external AI APIs.

    Parameters:
        missing_skills: List of skills the student currently lacks.

    Returns:
        Human-readable recommendation string.

    Examples:
        generate_skill_recommendation(["Power BI", "Tableau"])
        -> "Consider improving Power BI and Tableau skills."

        generate_skill_recommendation([])
        -> "No skill gaps identified. All required skills are met."
    """
    if not missing_skills:
        return "No skill gaps identified. All required skills are met."

    # Normalize, strip, and deduplicate while preserving readable original casing
    seen = set()
    cleaned_skills: List[str] = []
    for skill in missing_skills:
        if isinstance(skill, str):
            clean = skill.strip()
            norm = clean.lower()
            if norm and norm not in seen:
                seen.add(norm)
                cleaned_skills.append(clean)

    if not cleaned_skills:
        return "No skill gaps identified. All required skills are met."

    if len(cleaned_skills) == 1:
        skills_phrase = cleaned_skills[0]
    elif len(cleaned_skills) == 2:
        skills_phrase = f"{cleaned_skills[0]} and {cleaned_skills[1]}"
    else:
        skills_phrase = f"{', '.join(cleaned_skills[:-1])} and {cleaned_skills[-1]}"

    return f"Consider improving {skills_phrase} skills."


def analyze_skill_gap(
    student_skills: Union[List[str], SkillGapRequest],
    required_skills: Optional[List[str]] = None,
) -> SkillGapResult:
    """
    Compares a student's current skills against an internship's required skills.

    Requirements addressed:
    1. Case-insensitive comparison (e.g. 'python', 'Python', 'PYTHON' match).
    2. Deduplication of skills in comparison.
    3. Normalization of whitespace and capitalization.
    4. Safe handling of empty student skills (returns 0% match, all required missing).
    5. Safe handling of empty required skills (avoids division-by-zero).
    6. Preserves readable skill names in output matching required skill definitions.
    7. Calculates match_percentage as:
       (number of matched required skills / number of unique required skills) * 100

    Parameters:
        student_skills: List of student skills, or a SkillGapRequest model.
        required_skills: List of required skills (optional if student_skills is SkillGapRequest).

    Returns:
        SkillGapResult with matched_skills, missing_skills, match_percentage, and recommendation.
    """
    if isinstance(student_skills, SkillGapRequest):
        req_list = student_skills.required_skills
        stud_list = student_skills.student_skills
    else:
        stud_list = student_skills if student_skills is not None else []
        req_list = required_skills if required_skills is not None else []

    # 1. Normalize student skills: trim whitespace, convert to lower for O(1) case-insensitive check
    normalized_student_skills = set()
    for skill in stud_list:
        if isinstance(skill, str):
            clean_s = skill.strip().lower()
            if clean_s:
                normalized_student_skills.add(clean_s)

    # 2. Normalize and deduplicate required skills while preserving readable casing & order
    seen_req = set()
    unique_required: List[str] = []
    for skill in req_list:
        if isinstance(skill, str):
            clean_r = skill.strip()
            norm_r = clean_r.lower()
            if norm_r and norm_r not in seen_req:
                seen_req.add(norm_r)
                unique_required.append(clean_r)

    # 3. Identify matched and missing skills
    matched_skills: List[str] = []
    missing_skills: List[str] = []

    for req in unique_required:
        if req.lower() in normalized_student_skills:
            matched_skills.append(req)
        else:
            missing_skills.append(req)

    # 4. Calculate match percentage safely avoiding division-by-zero
    total_unique_required = len(unique_required)
    if total_unique_required == 0:
        # If no skills are required, student meets 100% of requirements
        match_percentage: Union[int, float] = 100
    else:
        calc_pct = (len(matched_skills) / total_unique_required) * 100.0
        # Return clean integer if whole number (e.g. 50 instead of 50.0), else round to 2 decimals
        match_percentage = int(calc_pct) if calc_pct.is_integer() else round(calc_pct, 2)

    # 5. Generate action-oriented recommendation
    recommendation = generate_skill_recommendation(missing_skills)

    return SkillGapResult(
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        match_percentage=match_percentage,
        recommendation=recommendation,
    )


def batch_analyze_skill_gaps(
    students_records: List[Dict[str, Any]],
    required_skills: List[str],
) -> pd.DataFrame:
    """
    Analyzes skill gaps for a cohort of students using pandas.

    Parameters:
        students_records: List of dicts containing student information and 'skills'.
        required_skills: List of required skills.

    Returns:
        pd.DataFrame containing summary metrics and recommendations for each student.
    """
    rows = []
    for rec in students_records:
        student_id = rec.get("student_id") or rec.get("id") or "N/A"
        student_name = rec.get("student_name") or rec.get("name") or "Unknown"
        skills = rec.get("skills") or rec.get("student_skills") or []

        result = analyze_skill_gap(student_skills=skills, required_skills=required_skills)

        rows.append({
            "student_id": student_id,
            "student_name": student_name,
            "matched_skills_count": len(result.matched_skills),
            "missing_skills_count": len(result.missing_skills),
            "match_percentage": result.match_percentage,
            "matched_skills": ", ".join(result.matched_skills),
            "missing_skills": ", ".join(result.missing_skills),
            "recommendation": result.recommendation,
        })

    return pd.DataFrame(rows)
