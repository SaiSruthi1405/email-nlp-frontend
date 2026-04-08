from parser import extract_skills
from skillNer.general_params import SKILL_DB

# Build valid skills set from ALL surface forms in SKILL_DB
VALID_SKILLS = set()
for key, val in SKILL_DB.items():
    # Add skill name lowercase
    VALID_SKILLS.add(val["skill_name"].lower().strip())
    # Add high surface forms
    for form in val["high_surfce_forms"].values():
        VALID_SKILLS.add(form.lower().strip())
    # Add low surface forms
    for form in val["low_surface_forms"]:
        VALID_SKILLS.add(form.lower().strip())


def match(resume_text, job_email_body):
    resume_skills_raw = extract_skills(resume_text)
    job_skills = extract_skills(job_email_body)

    if not job_skills:
        return {"error": "No skills found in job email"}

    # Filter resume skills — only keep ones validated by SKILL_DB surface forms
    resume_skills = [s for s in resume_skills_raw if s in VALID_SKILLS]

    matched = [s for s in job_skills if s in resume_skills]
    missing = [s for s in job_skills if s not in resume_skills]
    score = round((len(matched) / len(job_skills)) * 100, 2)

    suggestions = {
        skill: f"Learn {skill} — search on YouTube or Coursera"
        for skill in missing
    }

    return {
        "match_score": f"{score}%",
        "matched_skills": matched,
        "missing_skills": missing,
        "suggestions": suggestions,
        "resume_skills": resume_skills,
        "job_skills": job_skills
    }