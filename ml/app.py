import os
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename

from classifier import classify_email, classify_emails_bulk
from parser import extract_text_from_pdf, extract_skills
from matcher import match

app = Flask(__name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024

resume_store = {}


@app.before_request
def log_request_start():
    app.logger.info(f"REQUEST: {request.method} {request.path}")


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": True})


@app.route("/classify-email", methods=["POST"])
def classify_single():
    data = request.get_json(force=True) or {}
    subject = data.get("subject", "")
    body = data.get("body", "")

    app.logger.info(f"CLASSIFY SINGLE - subject: {subject}")
    app.logger.info(f"CLASSIFY SINGLE - body preview: {body[:120]}")
    app.logger.info(f"CLASSIFY SINGLE - body length: {len(body)}")

    category = classify_email(subject=subject, body=body)

    app.logger.info(f"CLASSIFY SINGLE - final category: {category}")

    return jsonify({"category": category})


@app.route("/classify-emails-bulk", methods=["POST"])
def classify_bulk_route():
    emails = request.get_json(force=True) or []

    app.logger.info(f"CLASSIFY BULK - count: {len(emails)}")
    if emails:
        first = emails[0]
        app.logger.info(f"CLASSIFY BULK - first subject: {first.get('subject', '')}")

    results = classify_emails_bulk(emails)

    app.logger.info(f"CLASSIFY BULK - results count: {len(results)}")

    return jsonify(results)


@app.route("/upload-resume", methods=["POST"])
def upload_resume():
    if "resume_file" not in request.files:
        return jsonify({"error": "No resume file provided"}), 400

    resume_file = request.files["resume_file"]

    if not resume_file or resume_file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    filename = secure_filename(resume_file.filename)
    save_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    resume_file.save(save_path)

    with open(save_path, "rb") as f:
        text = extract_text_from_pdf(f)

    skills = extract_skills(text)

    resume_store["text"] = text
    resume_store["skills"] = skills
    resume_store["path"] = save_path

    return jsonify({
        "message": "Resume uploaded!",
        "skills_found": skills,
        "resumePath": save_path
    })


@app.route("/match", methods=["POST"])
def match_job():
    job_body = request.form.get("job_body", "")

    if not job_body:
        return jsonify({"error": "job_body is required"}), 400

    if "text" not in resume_store:
        return jsonify({"error": "Upload resume first"}), 400

    result = match(resume_store["text"], job_body)
    return jsonify(result)


@app.route("/compare-resume-job", methods=["POST"])
def compare_resume_job():
    data = request.get_json(force=True) or {}
    resume_path = data.get("resumePath", "")
    job_text = data.get("jobText", "")

    if not resume_path:
        return jsonify({"error": "resumePath is required"}), 400

    if not job_text:
        return jsonify({"error": "jobText is required"}), 400

    if not os.path.exists(resume_path):
        return jsonify({"error": "Resume file not found"}), 404

    try:
        with open(resume_path, "rb") as f:
            resume_text = extract_text_from_pdf(f)

        result = match(resume_text, job_text)

        if "error" in result:
            return jsonify(result), 400

        return jsonify({
            "matchPercentage": result.get("match_score", "0%"),
            "matchingSkills": result.get("matched_skills", []),
            "missingSkills": result.get("missing_skills", []),
            "summary": {
                "resumeSkills": result.get("resume_skills", []),
                "jobSkills": result.get("job_skills", []),
                "suggestions": result.get("suggestions", {})
            }
        })

    except Exception as e:
        app.logger.exception("COMPARE RESUME JOB ERROR")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8001, debug=True)