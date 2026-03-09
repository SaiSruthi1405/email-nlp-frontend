from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from dotenv import load_dotenv
import os

load_dotenv()

router = APIRouter()

CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = "http://localhost:8000/auth/google/callback"
DASHBOARD_URL = "http://localhost:5173/dashboard"

SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/gmail.readonly",
]

@router.get("/auth/google/login")
def google_login(request: Request):
    # Clear session before login (dev only)
    request.session.clear()

    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI,
    )

    auth_url, state = flow.authorization_url(prompt="consent")

    # Store state in session
    request.session["state"] = state

    return RedirectResponse(auth_url)

@router.get("/auth/google/callback")
def google_callback(request: Request, code: str, state: str):
    try:
        session_state = request.session.get("state")
        if not session_state or session_state != state:
            return {"error": "Invalid state. Try logging in again."}

        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": CLIENT_ID,
                    "client_secret": CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
            },
            scopes=SCOPES,
            state=session_state,
            redirect_uri=REDIRECT_URI,
        )

        # Exchange code for tokens
        flow.fetch_token(code=code)
        credentials = flow.credentials
        access_token = credentials.token

        # For debugging: print access token
        print("Access Token:", access_token)

        # Redirect to React dashboard
        return RedirectResponse(DASHBOARD_URL)

    except Exception as e:
        # Catch any exception to avoid 500
        print("Google callback error:", e)
        return {"error": str(e)}