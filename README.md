# Intelligent Email Automation App (Starter Scaffold)

Features:
- Gmail OAuth login and mail ingestion (scaffolded).
- Spam / Not Spam buckets (SVM-ready; rule fallback if no model).
- Prompt Enhancer → intent + summary + keywords.
- Multi-language detection (stub) and translation hooks.
- Simple HTML UI (All / Not Spam / Spam).
- REST API with FastAPI.
- SQLite via SQLAlchemy for quick start.
- UiPath queue contract sample for handoff.

## Quickstart

```bash
cd backend
python -m venv .venv && . .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Fill GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT in .env
uvicorn app:app --reload --port 8000
```

Open http://localhost:8000 in your browser.

## Notes
- Gmail endpoints require a Google Cloud project + OAuth consent. Use the same redirect defined in `.env`.
- If ML model files are missing (`models/spam_model.joblib`, `models/intent_model.joblib`), the app uses simple rule-based fallbacks.
- Train scripts are in `scripts/`. Save artifacts to `backend/models/`.
