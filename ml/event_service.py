from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
import requests
import re
import os
import base64
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR.parent / ".env")

CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/callback")

access_token = None
user_tokens = {}

print("ACCESS TOKEN:", bool(access_token))


def decode_base64url(data: str) -> str:
    if not data:
        return ""
    try:
        data += "=" * (-len(data) % 4)
        return base64.urlsafe_b64decode(data.encode("utf-8")).decode("utf-8", errors="ignore")
    except Exception:
        return ""


def extract_body(payload):
    if not payload:
        return ""

    body_data = payload.get("body", {}).get("data")
    if body_data:
        return decode_base64url(body_data)

    parts = payload.get("parts", [])
    for part in parts:
        mime_type = part.get("mimeType", "")
        data = part.get("body", {}).get("data")
        if mime_type in ["text/plain", "text/html"] and data:
            return decode_base64url(data)

        nested_parts = part.get("parts", [])
        for nested in nested_parts:
            nested_type = nested.get("mimeType", "")
            nested_data = nested.get("body", {}).get("data")
            if nested_type in ["text/plain", "text/html"] and nested_data:
                return decode_base64url(nested_data)

    return ""


@app.get("/login")
def login():
    if not CLIENT_ID:
        return {"error": "Missing GOOGLE_CLIENT_ID in .env"}

    url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}"
        "&response_type=code"
        "&scope=https://www.googleapis.com/auth/gmail.readonly"
        "&access_type=offline"
        "&prompt=consent"
    )
    return RedirectResponse(url)


@app.get("/callback")
def callback(code: str):
    global access_token

    token_res = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "redirect_uri": REDIRECT_URI,
            "grant_type": "authorization_code",
        },
        timeout=30,
    ).json()

    if "access_token" not in token_res:
        return {"error": "Token exchange failed", "details": token_res}

    access_token = token_res.get("access_token")
    refresh_token = token_res.get("refresh_token")

    if "default" not in user_tokens:
        user_tokens["default"] = {}

    user_tokens["default"]["access_token"] = access_token

    if refresh_token:
        user_tokens["default"]["refresh_token"] = refresh_token

    print("ACCESS TOKEN EXISTS:", bool(access_token))
    print("REFRESH TOKEN EXISTS:", bool(refresh_token))

    return RedirectResponse("http://localhost:5173/events")


def extract_date(text):
    patterns = [
        r"\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b",
        r"\b\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b",
        r"\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(0)
    return None


def parse_date(date_str):
    if not date_str:
        return None

    formats = ["%d-%m-%Y", "%d/%m/%Y", "%d %b %Y", "%d %b", "%b %d %Y", "%b %d"]
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            if "%Y" not in fmt:
                dt = dt.replace(year=datetime.now().year)
            return dt
        except Exception:
            continue
    return None


def is_relevant_email(text):
    keywords = [
        "meeting", "meet", "webinar", "workshop",
        "invite", "invitation", "event", "reminder",
        "session", "call", "discussion", "zoom", "teams",
        "interview", "resume", "compare resume", "assessment",
        "screening", "recruiter", "hiring", "job", "candidate"
    ]
    text = text.lower()
    return any(k in text for k in keywords)


@app.get("/emails")
def get_emails():
    global access_token

    if not access_token:
        return {"error": "Please login first"}

    headers = {"Authorization": f"Bearer {access_token}"}

    res = requests.get(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages",
        headers=headers,
        params={
            "maxResults": 25,
            "q": "meeting OR interview OR resume OR invitation OR webinar OR recruiter"
        },
        timeout=30,
    ).json()

    print("EMAIL LIST RESPONSE:", res)

    if "error" in res:
        return {"error": "Gmail API error", "details": res["error"]}

    messages = res.get("messages", [])
    email_list = []

    for msg in messages:
        detail = requests.get(
            f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg['id']}",
            headers=headers,
            params={"format": "full"},
            timeout=30,
        ).json()

        if "error" in detail:
            continue

        payload = detail.get("payload", {})
        headers_data = payload.get("headers", [])

        subject = next((h["value"] for h in headers_data if h["name"].lower() == "subject".lower()), "")
        sender = next((h["value"] for h in headers_data if h["name"].lower() == "from".lower()), "")
        snippet = detail.get("snippet", "")
        body_text = extract_body(payload)

        full_text = f"{subject} {snippet} {body_text}"

        print("CHECKING SUBJECT:", subject)
        print("CHECKING TEXT:", full_text[:500])

        if not is_relevant_email(full_text):
            continue

        date_str = extract_date(full_text)
        parsed_date = parse_date(date_str)

        if parsed_date:
            today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            if parsed_date < today:
                continue

        email_list.append({
            "subject": subject,
            "from": sender,
            "snippet": snippet,
            "body": body_text[:1000],
            "date": date_str,
            "parsedDate": parsed_date.isoformat() if parsed_date else None
        })

    print("FINAL FILTERED EMAILS:", email_list)
    return email_list