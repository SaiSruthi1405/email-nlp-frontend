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

# Tokens we want to always ignore as non-skills
NOISE_WORDS = {
    "linkedin",
    "gmail",
    "email",
    "mail",
    "hello",
    "hi",
    "regards",
    "thanks",
    "thank",
    "click",
    "apply",
    "unsubscribe",
    "job",
    "role",
    "position",
    "company",
    "dear",
    "sir",
    "madam",
    "please",
}


def _filter_noise(skills):
    """
    Remove obvious non-skill tokens like 'linkedin' from extracted skills.
    """
    return [s for s in skills if s.lower().strip() not in NOISE_WORDS]


def match(resume_text, job_email_body):
    # Raw extraction from parser
    resume_skills_raw = extract_skills(resume_text)
    job_skills_raw = extract_skills(job_email_body)

    # Drop noise tokens like "linkedin"
    job_skills_raw = _filter_noise(job_skills_raw)
    resume_skills_raw = _filter_noise(resume_skills_raw)

    # If still no job skills, return a "valid but empty" result,
    # not an error, so the frontend doesn't break.
    if not job_skills_raw:
        return {
            "match_score": 0.0,
            "matched_skills": [],
            "missing_skills": [],
            "suggestions": {},
            "resume_skills": [],
            "job_skills": [],
            "message": "No skills found in job email",
        }

    # Filter resume skills — only keep ones validated by SKILL_DB surface forms
    resume_skills = [
        s for s in resume_skills_raw if s.lower().strip() in VALID_SKILLS
    ]

    # Remove duplicates and normalize lowercase
    job_skills = sorted({s.lower().strip() for s in job_skills_raw})
    resume_skills = sorted({s.lower().strip() for s in resume_skills})

    matched = [s for s in job_skills if s in resume_skills]
    missing = [s for s in job_skills if s not in resume_skills]

    if job_skills:
        score = round((len(matched) / len(job_skills)) * 100.0, 2)
    else:
        score = 0.0

    suggestions = {
        skill: f"Learn {skill} — search on YouTube or Coursera"
        for skill in missing
    }

    return {
        "match_score": score,  # numeric, easier for frontend
        "matched_skills": matched,
        "missing_skills": missing,
        "suggestions": suggestions,
        "resume_skills": resume_skills,
        "job_skills": job_skills,
    }