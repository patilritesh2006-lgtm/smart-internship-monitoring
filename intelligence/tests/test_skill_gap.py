"""
Unit tests for Skill Gap Analysis engine and recommendation generator.
Covers all 9 mandated scenarios and edge cases.
"""

import pytest
from intelligence.app.models import SkillGapRequest, SkillGapResult
from intelligence.app.skill_gap import (
    analyze_skill_gap,
    batch_analyze_skill_gaps,
    generate_skill_recommendation,
)


def test_1_perfect_skill_match():
    """Scenario 1: Perfect skill match (100% match, 0 missing skills)."""
    student_skills = ["Python", "SQL", "Docker"]
    required_skills = ["Python", "SQL", "Docker"]

    result = analyze_skill_gap(student_skills, required_skills)

    assert result.matched_skills == ["Python", "SQL", "Docker"]
    assert result.missing_skills == []
    assert result.match_percentage == 100
    assert "No skill gaps identified" in result.recommendation


def test_2_partial_skill_match():
    """Scenario 2: Partial skill match (standard hackathon example)."""
    student_skills = ["Python", "SQL", "Excel"]
    required_skills = ["Python", "SQL", "Power BI", "Tableau"]

    result = analyze_skill_gap(student_skills, required_skills)

    assert result.matched_skills == ["Python", "SQL"]
    assert result.missing_skills == ["Power BI", "Tableau"]
    assert result.match_percentage == 50
    assert result.recommendation == "Consider improving Power BI and Tableau skills."


def test_3_no_matching_skills():
    """Scenario 3: No matching skills (0% match, all required missing)."""
    student_skills = ["Ruby", "PHP", "Laravel"]
    required_skills = ["Python", "SQL", "Docker"]

    result = analyze_skill_gap(student_skills, required_skills)

    assert result.matched_skills == []
    assert result.missing_skills == ["Python", "SQL", "Docker"]
    assert result.match_percentage == 0
    assert result.recommendation == "Consider improving Python, SQL and Docker skills."


def test_4_empty_student_skills():
    """Scenario 4: Empty student skill list handled safely."""
    result = analyze_skill_gap([], ["Python", "SQL"])

    assert result.matched_skills == []
    assert result.missing_skills == ["Python", "SQL"]
    assert result.match_percentage == 0
    assert result.recommendation == "Consider improving Python and SQL skills."


def test_5_empty_required_skills():
    """Scenario 5: Empty required skills handled safely without division by zero."""
    result = analyze_skill_gap(["Python", "Java"], [])

    assert result.matched_skills == []
    assert result.missing_skills == []
    assert result.match_percentage == 100
    assert "No skill gaps identified" in result.recommendation


def test_6_different_capitalization():
    """Scenario 6: Case-insensitive matching across casing variations."""
    student_skills = ["python", "Sql", "EXCEL"]
    required_skills = ["Python", "SQL", "Excel", "Docker"]

    result = analyze_skill_gap(student_skills, required_skills)

    assert result.matched_skills == ["Python", "SQL", "Excel"]
    assert result.missing_skills == ["Docker"]
    assert result.match_percentage == 75
    assert result.recommendation == "Consider improving Docker skills."


def test_7_duplicate_skills():
    """Scenario 7: Duplicate skills in student or required lists are deduplicated cleanly."""
    student_skills = ["Python", "python", "PYTHON", "SQL", "sql"]
    required_skills = ["Python", "python", "SQL", "sql", "Docker", "Docker"]

    result = analyze_skill_gap(student_skills, required_skills)

    assert result.matched_skills == ["Python", "SQL"]
    assert result.missing_skills == ["Docker"]
    assert result.match_percentage == 66.67


def test_8_recommendation_with_missing_skills():
    """Scenario 8: Rule-based recommendation generated when skills are missing."""
    # Two missing skills
    rec_two = generate_skill_recommendation(["Power BI", "Tableau"])
    assert rec_two == "Consider improving Power BI and Tableau skills."

    # Single missing skill
    rec_one = generate_skill_recommendation(["Docker"])
    assert rec_one == "Consider improving Docker skills."

    # Three missing skills
    rec_three = generate_skill_recommendation(["Python", "SQL", "AWS"])
    assert rec_three == "Consider improving Python, SQL and AWS skills."


def test_9_recommendation_with_no_missing_skills():
    """Scenario 9: Recommendation when there are no missing skills."""
    rec_empty = generate_skill_recommendation([])
    assert "No skill gaps identified" in rec_empty
    assert "All required skills are met" in rec_empty

    rec_none = generate_skill_recommendation(None)
    assert "No skill gaps identified" in rec_none


def test_whitespace_and_formatting_normalization():
    """Trims whitespace and handles tabs/spaces in skill names."""
    student_skills = ["  Python  ", "\tSQL\n", "FastAPI "]
    required_skills = ["Python ", "  SQL", "fastapi"]

    result = analyze_skill_gap(student_skills, required_skills)

    assert len(result.matched_skills) == 3
    assert len(result.missing_skills) == 0
    assert result.match_percentage == 100


def test_dict_subscripting_and_pydantic_support():
    """SkillGapResult supports both object attribute and dict subscript access."""
    result = analyze_skill_gap(["Python"], ["Python", "Docker"])

    # Dict subscript access
    assert result["matched_skills"] == ["Python"]
    assert result["missing_skills"] == ["Docker"]
    assert result["match_percentage"] == 50

    # Attribute access
    assert result.matched_skills == ["Python"]
    assert result.missing_skills == ["Docker"]
    assert result.match_percentage == 50

    # Key check
    assert "matched_skills" in result
    assert result.get("nonexistent", "default") == "default"

    with pytest.raises(KeyError):
        _ = result["nonexistent_key"]


def test_whitespace_only_missing_skills():
    """Missing skills list containing only whitespace returns no gap message."""
    rec = generate_skill_recommendation(["   ", "\t"])
    assert "No skill gaps identified" in rec


def test_pydantic_request_compatibility():
    """SkillGapRequest Pydantic model can be passed directly."""
    req = SkillGapRequest(
        student_skills=["Machine Learning", "Python"],
        required_skills=["Python", "PyTorch", "Git"]
    )
    result = analyze_skill_gap(req)

    assert result.matched_skills == ["Python"]
    assert result.missing_skills == ["PyTorch", "Git"]
    assert result.match_percentage == 33.33


def test_batch_analyze_skill_gaps():
    """Cohort analysis using pandas returns correct summary DataFrame."""
    records = [
        {"student_id": "S1", "student_name": "Alice", "skills": ["Python", "SQL"]},
        {"student_id": "S2", "student_name": "Bob", "skills": ["Power BI"]},
        {"student_id": "S3", "student_name": "Charlie", "skills": ["Python", "SQL", "Power BI", "Tableau"]},
    ]
    required = ["Python", "SQL", "Power BI", "Tableau"]

    df = batch_analyze_skill_gaps(records, required)

    assert len(df) == 3
    assert df.loc[df["student_id"] == "S1", "match_percentage"].values[0] == 50
    assert df.loc[df["student_id"] == "S2", "match_percentage"].values[0] == 25
    assert df.loc[df["student_id"] == "S3", "match_percentage"].values[0] == 100
    assert "recommendation" in df.columns
