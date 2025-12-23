import os
from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic_settings import BaseSettings
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .models.db import init_db, get_session
from .routers import auth, emails, generate
from .routers import sync as sync_router
from .routers import send as send_router 

ENV_PATH = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(ENV_PATH)
print(f"DEBUG: Loaded .env from {ENV_PATH}")
print(f"DEBUG: LLM_PROVIDER = {os.getenv('LLM_PROVIDER')}")

class Settings(BaseSettings):

    ALLOWED_ORIGINS: str = "*"

settings = Settings()

app = FastAPI(title="Intelligent Email Automation")
app.mount("/static", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "static")), name="static")
templates = Jinja2Templates(directory=os.path.join(os.path.dirname(__file__), "templates"))

# include routers
app.include_router(auth.router, prefix="")
app.include_router(emails.router, prefix="/emails", tags=["emails"])
app.include_router(generate.router, prefix="/generate", tags=["generate"])
app.include_router(sync_router.router)
app.include_router(send_router.router, prefix="", tags=["send"])

# Production Port handling (for Render/Heroku)
import os
PORT = int(os.environ.get("PORT", 8000))

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/", response_class=HTMLResponse)
def index(request: Request, session=Depends(get_session)):
    # very simple UI driven by server-side rendering
    return templates.TemplateResponse("index.html", {"request": request})



# CORS


# CORS
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


