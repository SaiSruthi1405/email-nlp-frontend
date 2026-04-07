from flask import Flask, request, jsonify
from classifier import classify_email, classify_emails_bulk

app = Flask(__name__)

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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8001, debug=True)