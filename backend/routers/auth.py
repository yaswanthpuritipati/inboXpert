import os, json
from fastapi import APIRouter
from fastapi.responses import JSONResponse, RedirectResponse
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from dotenv import load_dotenv
from oauthlib.oauth2.rfc6749.errors import InvalidGrantError

router = APIRouter(tags=["auth"])

# --- load .env from backend/.env explicitly ---
ENV_PATH = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(ENV_PATH)

CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT = os.getenv("GOOGLE_REDIRECT")
SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
]

def flow_factory():
    assert CLIENT_ID, "GOOGLE_CLIENT_ID missing"
    assert CLIENT_SECRET, "GOOGLE_CLIENT_SECRET missing"
    assert REDIRECT, "GOOGLE_REDIRECT missing"
    return Flow.from_client_config(
        {
            "web": {
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [REDIRECT],
            }
        },
        scopes=SCOPES,
        redirect_uri=REDIRECT,
    )

def tokens_dir():
    return os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "models"))

@router.get("/auth/google")
def auth_start():
    flow = flow_factory()
    auth_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    # Redirect directly to Google OAuth
    return RedirectResponse(url=auth_url)

@router.get("/auth/callback")
def auth_callback(code: str, state: str):
    flow = flow_factory()
    try:
        flow.fetch_token(code=code)
    except InvalidGrantError:
        # code reused or expired
        return JSONResponse({"ok": False, "message": "Auth code already used/expired. Start again at /auth/google."}, status_code=400)

    creds = flow.credentials

    # Get user's Gmail address
    svc = build("gmail", "v1", credentials=creds)
    profile = svc.users().getProfile(userId="me").execute()
    email_addr = profile.get("emailAddress", "me")

    # Save token to backend/models/token_<email>.json
    os.makedirs(tokens_dir(), exist_ok=True)
    token_path = os.path.join(tokens_dir(), f"token_{email_addr}.json")
    print("Saving token to:", token_path)
    with open(token_path, "w") as f:
        json.dump(
            {
                "token": creds.token,
                "refresh_token": getattr(creds, "refresh_token", None),
                "token_uri": creds.token_uri,
                "client_id": creds.client_id,
                "client_secret": creds.client_secret,
                "scopes": creds.scopes,
            },
            f,
        )

    # Redirect to frontend with success message
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    return RedirectResponse(url=f"{frontend_url}?auth=success&email={email_addr}")

@router.get("/auth/tokens")
def list_tokens():
    d = tokens_dir()
    os.makedirs(d, exist_ok=True)
    files = [f for f in os.listdir(d) if f.startswith("token_") and f.endswith(".json")]
    abs_dir = os.path.abspath(d)
    return {"dir": abs_dir, "files": files}
