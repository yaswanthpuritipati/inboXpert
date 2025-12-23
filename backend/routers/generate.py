# backend/routers/generate.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging
from backend.services.email_gen import generate_email_json_forced

# simple logger
logger = logging.getLogger("generate_router")
if not logger.handlers:
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    logger.addHandler(ch)
logger.setLevel(logging.INFO)

# IMPORTANT: no prefix here — the app mounts this router at /generate
router = APIRouter(tags=["generate"])

class DraftReq(BaseModel):
    prompt: str
    tone: str = "formal"
    length: str = "medium"
    target_lang: str = "en"

@router.post("/draft")
def create_draft(req: DraftReq):
    try:
        logger.info("generate/draft request prompt=%s tone=%s length=%s", (req.prompt or "")[:120], req.tone, req.length)
        out = generate_email_json_forced(req.prompt, tone=req.tone, length=req.length, target_lang=req.target_lang)
        logger.info("Model raw (first 400 chars): %s", out.get("raw", "")[:400])
        return out
    except Exception as e:
        logger.exception("Error generating draft")
        raise HTTPException(status_code=500, detail=str(e))

class SummaryReq(BaseModel):
    text: str
    length: int = 3

@router.post("/summary")
def create_summary(req: SummaryReq):
    try:
        from backend.services.nlp import textrank_summary
        return {"summary": textrank_summary(req.text, k=req.length)}
    except Exception as e:
        logger.exception("Error generating summary")
        raise HTTPException(status_code=500, detail=str(e))
