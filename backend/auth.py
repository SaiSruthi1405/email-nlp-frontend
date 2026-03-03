from fastapi import APIRouter
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from dotenv import load_dotenv
import os

load_dotenv()

router = APIRouter()

CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

flow = Flow.from_client_config(
    {
        "web": {
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    },
    scopes=[
        "openid",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/gmail.readonly",
    ],
    redirect_uri="http://localhost:8000/auth/google/callback",
)


@router.get("/auth/google/login")
def google_login():

    auth_url, _ = flow.authorization_url(prompt="consent")

    return RedirectResponse(auth_url)


@router.get("/auth/google/callback")
def google_callback(code: str):

    flow.fetch_token(code=code)

    credentials = flow.credentials

    access_token = credentials.token
    refresh_token = credentials.refresh_token

    print("Access Token:", access_token)
    print("Refresh Token:", refresh_token)

    return RedirectResponse("http://localhost:5173/dashboard")