import os
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from datetime import datetime

DB_URL = os.environ.get("DB_URL", "sqlite:///./emailapp.db")

engine = create_engine(DB_URL, connect_args={"check_same_thread": False} if DB_URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

class Base(DeclarativeBase):
    pass

class Email(Base):
    __tablename__ = "emails"
    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True)
    gmail_id = Column(String, index=True)
    from_addr = Column(String)
    to_addr = Column(String)
    subject = Column(String)
    snippet = Column(Text)
    body_text = Column(Text)
    received_at = Column(DateTime, default=datetime.utcnow)
    is_spam = Column(Boolean, default=False)
    lang = Column(String, default="en")

def init_db():
    Base.metadata.create_all(bind=engine)

def get_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
