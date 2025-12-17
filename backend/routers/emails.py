from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..models.db import Email, get_session
from ..models.schemas import EmailOut
from ..services import nlp

router = APIRouter()

@router.get("", response_model=List[EmailOut])
def list_emails(folder: Optional[str] = "all", user_email: Optional[str] = None, session: Session = Depends(get_session)):
    q = session.query(Email).order_by(Email.received_at.desc())
    
    # Filter by user if provided (multi-user support)
    if user_email:
        q = q.filter(Email.user_email == user_email)

    if folder == "sent":
        # Sent emails: from the user
        if user_email:
            q = q.filter(Email.from_addr.ilike(f"%{user_email}%"))
    elif folder == "inbox":
        q = q.filter(Email.is_spam == False)
        if user_email:
            q = q.filter(Email.from_addr.notilike(f"%{user_email}%"))
    elif folder == "spam":
        q = q.filter(Email.is_spam == True)
    elif folder == "not_spam":
        q = q.filter(Email.is_spam == False)
        # Exclude sent emails from "Not Spam" (Inbox) view if user_email is known
        if user_email:
            q = q.filter(Email.from_addr.notilike(f"%{user_email}%"))
    
    return q.all()

@router.post("/ingest/sample")
def ingest_sample(session: Session = Depends(get_session)):
    # Seed a few emails to demo UI
    samples = [
        Email(user_email="demo@user", gmail_id="local1", from_addr="hr@company.com", to_addr="you@demo", subject="Interview schedule", body_text="Can we schedule a meeting this Friday? Share your available slots.", is_spam=False, lang="en"),
        Email(user_email="demo@user", gmail_id="local2", from_addr="lotto@scam.com", to_addr="you@demo", subject="You WIN money!!!", body_text="Claim your urgent reward now, 100% free!", is_spam=True, lang="en"),
        Email(user_email="demo@user", gmail_id="local3", from_addr="prof@uni.edu", to_addr="you@demo", subject="Assignment submission", body_text="Please submit the report by Monday. Attach the PDF.", is_spam=False, lang="en"),
    ]
    for s in samples:
        session.add(s)
    session.commit()
    return {"ok": True, "count": len(samples)}

@router.post("/mark/{email_id}")
def mark_email(email_id: int, spam: bool, session: Session = Depends(get_session)):
    em = session.get(Email, email_id)
    if not em:
        raise HTTPException(404, "Email not found")
    em.is_spam = spam
    session.add(em)
    session.commit()
    return {"ok": True}

