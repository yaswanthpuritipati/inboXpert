import base64
from email.mime.text import MIMEText
from fastapi import APIRouter, HTTPException, Depends  # type: ignore
from pydantic import BaseModel  # type: ignore
from googleapiclient.discovery import build
from sqlalchemy.orm import Session  # type: ignore
from ..models.db import get_session
from .sync import load_creds

router = APIRouter(tags=["send"])

def create_message(sender: str, to: str, subject: str, body: str) -> dict:
    """Create a message for an email."""
    message = MIMEText(body)
    message['to'] = to
    message['from'] = sender
    message['subject'] = subject
    
    raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
    return {'raw': raw_message}

class SendEmailRequest(BaseModel):
    user_email: str
    to: str
    subject: str
    body: str

@router.post("/send")
def send_email(req: SendEmailRequest, session: Session = Depends(get_session)):
    """
    Send an email using Gmail API.
    Requires the user to be authenticated via OAuth.
    """
    # Validate user_email is provided
    if not req.user_email or not req.user_email.strip():
        raise HTTPException(
            status_code=400, 
            detail="user_email is required. Please enter your Gmail address and sign in via /auth/google first."
        )
    
    # Normalize email (lowercase, strip)
    user_email = req.user_email.strip().lower()
    
    try:
        # Load credentials for the user
        creds = load_creds(user_email)
        
        # Build Gmail service
        service = build("gmail", "v1", credentials=creds)
        
        # Create the message
        message = create_message(user_email, req.to, req.subject, req.body)
        
        # Send the message
        sent_message = service.users().messages().send(userId="me", body=message).execute()
        
        return {
            "ok": True,
            "id": sent_message.get("id"),
            "threadId": sent_message.get("threadId"),
            "message": "Email sent successfully"
        }
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=401, 
            detail=f"No credentials found for {user_email}. Please sign in via the 'Sign in' button first, then try again."
        )
    except Exception as e:
        error_msg = str(e)
        # Provide more helpful error messages
        if "invalid_grant" in error_msg.lower() or "token" in error_msg.lower():
            raise HTTPException(
                status_code=401,
                detail=f"Authentication expired. Please sign in again via /auth/google. Error: {error_msg}"
            )
        raise HTTPException(status_code=500, detail=f"Failed to send email: {error_msg}")

