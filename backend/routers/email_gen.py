from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.services.email_gen import generate_email

router = APIRouter(prefix="/generate", tags=["ai"])

class DraftReq(BaseModel):
    prompt: str
    tone: str = "formal"
    length: str = "medium"
    target_lang: str = "en"

@router.post("/draft")
def create_draft(req: DraftReq):
    try:
        draft = generate_email(req.prompt, tone=req.tone, length=req.length, target_lang=req.target_lang)
        return draft
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
