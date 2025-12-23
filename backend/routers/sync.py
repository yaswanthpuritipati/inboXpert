from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from backend.models.db import Email, get_session
from backend.services.gmail import fetch_messages
from backend.services import nlp  # optional: for spam prediction
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import os, json

router = APIRouter(tags=["sync"])

def _token_path_for(email_addr: str) -> str:
    # Use persistent disk on Render if available
    base_dir = "/data/tokens" if os.path.exists("/data") else os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "models"))
    return os.path.join(base_dir, f"token_{email_addr}.json")

def load_creds(email_addr: str) -> Credentials:
    token_path = _token_path_for(email_addr)
    if not os.path.exists(token_path):
        raise FileNotFoundError("Token file not found. Sign in via /auth/google first.")
    with open(token_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    creds = Credentials(**data)

    # Refresh if needed (uses stored refresh_token)
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        # persist refreshed access token
        with open(token_path, "w", encoding="utf-8") as f:
            json.dump({
                "token": creds.token,
                "refresh_token": creds.refresh_token,
                "token_uri": creds.token_uri,
                "client_id": creds.client_id,
                "client_secret": creds.client_secret,
                "scopes": creds.scopes,
            }, f)
    return creds

@router.post("/emails/sync")
def sync_emails(
    user_email: str = Query(..., description="Your Gmail address used to sign in"),
    max_results: int = 50,
    session: Session = Depends(get_session),
):
    try:
        creds = load_creds(user_email)
    except FileNotFoundError as e:
        raise HTTPException(400, str(e))

    svc = build("gmail", "v1", credentials=creds)
    # fetch_messages returns minimal decoded fields
    msgs = fetch_messages(svc, max_results=max_results)

    created = 0
    for m in msgs:
        # idempotency: skip if already saved
        exists = session.query(Email).filter_by(gmail_id=m["gmail_id"], user_email=user_email).first()
        if exists:
            continue

        # optional auto-spam
        try:
            is_spam = nlp.predict_spam(f"{m.get('subject','')} {m.get('body_text','')}")
        except Exception:
            is_spam = False  # fallback

        session.add(Email(
            user_email=user_email,
            gmail_id=m.get("gmail_id",""),
            from_addr=m.get("from_addr",""),
            to_addr=m.get("to_addr",""),
            subject=m.get("subject",""),
            snippet=m.get("snippet",""),
            body_text=m.get("body_text",""),
            is_spam=is_spam,
            lang="en",
        ))
        created += 1

    session.commit()
    return {"ok": True, "inserted": created}
