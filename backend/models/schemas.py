from pydantic import BaseModel
from typing import Optional, List

class EmailOut(BaseModel):
    id: int
    user_email: str
    gmail_id: str
    from_addr: str
    to_addr: str
    subject: str
    snippet: Optional[str] = ""
    body_text: Optional[str] = ""
    is_spam: bool
    lang: str
    class Config:
        from_attributes = True

class DraftIn(BaseModel):
    prompt: str
    tone: str = "formal"
    length: str = "medium"
    target_lang: str = "en"
    context_email_ids: Optional[List[int]] = None

class DraftOut(BaseModel):
    subject: str
    body: str
    language: str
    intent: str
