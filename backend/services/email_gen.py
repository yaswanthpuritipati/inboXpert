# backend/services/email_gen.py
"""
Drop-in email generation service that forces JSON output.

Requirements:
  pip install openai requests python-dateutil

Environment:
  LLM_PROVIDER - optional (default: "openai", options: "openai", "gemini", "ollama")
  OPENAI_API_KEY - required if LLM_PROVIDER=openai
  GEMINI_API_KEY - required if LLM_PROVIDER=gemini
  EMAIL_GEN_MODEL - optional (default: gpt-3.5-turbo for openai, gemini-2.5-flash for gemini, llama2 for ollama)
"""

import os
import re
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, Optional
import requests
from requests.adapters import HTTPAdapter

# Try to import Retry from urllib3 (it's a dependency of requests)
try:
    from urllib3.util.retry import Retry  # type: ignore
except ImportError:
    # If Retry is not available, we'll use a simple retry mechanism
    Retry = None

# try openai SDK
try:
    import openai  # type: ignore
    _HAS_OPENAI = True
except Exception:
    _HAS_OPENAI = False

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PROVIDER = os.getenv("LLM_PROVIDER", "openai").lower()  # "openai", "gemini", or "ollama"

# Set default model based on provider
if PROVIDER == "gemini":
    MODEL = os.getenv("EMAIL_GEN_MODEL", "gemini-2.5-flash")
elif PROVIDER == "ollama":
    MODEL = os.getenv("EMAIL_GEN_MODEL", "llama2")
else:
    MODEL = os.getenv("EMAIL_GEN_MODEL", "gpt-3.5-turbo")
    # For OpenAI, if SDK installed prefer it, else use HTTP
    if PROVIDER == "openai" and not _HAS_OPENAI:
        PROVIDER = "http"

logger = logging.getLogger("email_gen")
if not logger.handlers:
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    logger.addHandler(ch)
logger.setLevel(logging.INFO)

# Create a session with retry strategy for better connection handling
def create_session_with_retries():
    """Create a requests session with retry strategy"""
    session = requests.Session()
    if Retry is not None:
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["POST", "GET"]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
    return session

# Global session for connection reuse
_http_session = None

def get_session():
    """Get or create HTTP session"""
    global _http_session
    if _http_session is None:
        _http_session = create_session_with_retries()
    return _http_session


# ---------------- utilities ----------------
def prompt_enhancer(user_prompt: str) -> str:
    if not user_prompt:
        return ""
    p = user_prompt.strip()
    p = re.sub(r"\b(beacuse|becuase)\b", "because", p, flags=re.I)
    # capitalize weekdays
    p = re.sub(r"\bmonday\b", "Monday", p, flags=re.I)
    p = re.sub(r"\btuesday\b", "Tuesday", p, flags=re.I)
    p = re.sub(r"\bwednesday\b", "Wednesday", p, flags=re.I)
    p = re.sub(r"\bthursday\b", "Thursday", p, flags=re.I)
    p = re.sub(r"\bfriday\b", "Friday", p, flags=re.I)
    p = re.sub(r"\bsaturday\b", "Saturday", p, flags=re.I)
    p = re.sub(r"\bsunday\b", "Sunday", p, flags=re.I)
    return p


WEEKDAYS = {
    "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
    "friday": 4, "saturday": 5, "sunday": 6,
}


def find_next_weekday_date(text: str) -> Optional[str]:
    if not text:
        return None
    txt = text.lower()
    for name, idx in WEEKDAYS.items():
        if name in txt:
            today = datetime.now().date()
            today_idx = today.weekday()
            days_ahead = (idx - today_idx + 7) % 7
            if days_ahead == 0:
                days_ahead = 7
            next_date = today + timedelta(days=days_ahead)
            return next_date.isoformat()
    return None


def replace_weekday_with_date(body: str, user_prompt: str) -> str:
    date_str = find_next_weekday_date(user_prompt)
    if not date_str:
        return body
    def repl(m):
        wd = m.group(0)
        try:
            d = datetime.fromisoformat(date_str)
            friendly = d.strftime("%A, %b %d")
        except Exception:
            friendly = date_str
        return f"{wd} ({friendly})"
    pattern = re.compile(r"\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b")
    return pattern.sub(repl, body, count=1)


# ---------------- LLM wrappers ----------------
def call_openai_sdk(messages, model=MODEL, temperature=0.2, max_tokens=500):
    """
    Unified SDK call that supports both openai<1.0 (old) and openai>=1.0 (new).
    For openai>=1.0 we use the `OpenAI` client: client = openai.OpenAI(); client.chat.completions.create(...)
    For older versions we fall back to openai.ChatCompletion.create or openai.chat.completions.create
    """
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY not set")

    # Newer openai package (v1+): has OpenAI class
    if hasattr(openai, "OpenAI"):
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        # the new client returns a complex object; we extract text safely
        resp = client.chat.completions.create(model=model, messages=messages, temperature=temperature, max_tokens=max_tokens)
        # Try common shapes for response
        try:
            # v1: resp.choices[0].message.content (attribute access first)
            return resp.choices[0].message.content
        except Exception:
            try:
                # fallback: try dict access
                return resp.choices[0].message["content"]
            except Exception:
                # fallback: stringify
                return str(resp)
    else:
        # Older openai SDKs
        openai.api_key = OPENAI_API_KEY
        try:
            if hasattr(openai, "ChatCompletion"):
                resp = openai.ChatCompletion.create(model=model, messages=messages, temperature=temperature, max_tokens=max_tokens)
                return resp.choices[0].message["content"]
            else:
                resp = openai.chat.completions.create(model=model, messages=messages, temperature=temperature, max_tokens=max_tokens)
                return resp.choices[0].message.content
        except Exception:
            # propagate for outer handler to log
            raise



def call_openai_http(messages, model=MODEL, temperature=0.2, max_tokens=500):
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY not set")
    url = "https://api.openai.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"}
    payload = {"model": model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens}
    r = requests.post(url, json=payload, headers=headers, timeout=30)
    r.raise_for_status()
    data = r.json()
    try:
        return data["choices"][0]["message"]["content"]
    except Exception:
        raise RuntimeError("Unexpected response from OpenAI HTTP API: " + str(data))


def call_gemini_api(messages, model="gemini-2.5-flash", temperature=0.2, max_tokens=500):
    """Call Google Gemini API (free tier available)"""
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not set")
    
    # Convert messages to Gemini format
    # Gemini uses different message format - combine system + user messages
    text_parts = []
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role == "system":
            text_parts.append(f"System: {content}")
        elif role == "user":
            text_parts.append(f"User: {content}")
        elif role == "assistant":
            text_parts.append(f"Assistant: {content}")
    
    prompt_text = "\n\n".join(text_parts)
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{"parts": [{"text": prompt_text}]}],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
            # Disable thinking tokens to get more actual output
            "responseModalities": ["TEXT"],
        }
    }
    
    # Use session with retries and longer timeout for connection stability
    session = get_session()
    max_retries = 2
    last_error = None
    
    for attempt in range(max_retries):
        try:
            # Increase timeout to 60 seconds to handle slow connections
            r = session.post(url, json=payload, headers=headers, timeout=(10, 60))
            r.raise_for_status()
            data = r.json()
            break
        except requests.exceptions.ConnectionError as e:
            last_error = e
            logger.warning(f"Connection error on attempt {attempt + 1}/{max_retries}: {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff: 1s, 2s
                continue
            raise RuntimeError(f"Connection aborted after {max_retries} attempts. Check your internet connection. Error: {str(e)}")
        except requests.exceptions.Timeout as e:
            last_error = e
            logger.warning(f"Timeout error on attempt {attempt + 1}/{max_retries}: {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
                continue
            raise RuntimeError(f"Request timeout after {max_retries} attempts. The API may be slow. Error: {str(e)}")
        except requests.exceptions.RequestException as e:
            last_error = e
            logger.error(f"Request error on attempt {attempt + 1}/{max_retries}: {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
                continue
            raise RuntimeError(f"Request failed after {max_retries} attempts: {str(e)}")
    else:
        if last_error:
            raise RuntimeError(f"Failed to connect to Gemini API after {max_retries} attempts: {str(last_error)}")
    
    try:
        # Check if we have candidates
        if not data.get("candidates") or len(data["candidates"]) == 0:
            raise RuntimeError("No candidates in Gemini API response: " + str(data))
        
        candidate = data["candidates"][0]
        
        # Check finish reason
        finish_reason = candidate.get("finishReason", "")
        if finish_reason == "MAX_TOKENS":
            logger.warning("Gemini API hit MAX_TOKENS limit. Response may be truncated.")
        
        # Try to get the content
        content = candidate.get("content", {})
        text_content = ""
        
        if "parts" in content and len(content["parts"]) > 0:
            text_content = content["parts"][0].get("text", "")
        elif "text" in content:
            text_content = content["text"]
        
        # If we got some text, return it (even if truncated)
        if text_content:
            if finish_reason == "MAX_TOKENS":
                logger.warning(f"Gemini response truncated at MAX_TOKENS. Got {len(text_content)} chars.")
            return text_content
        
        # If no text at all, this is a problem
        if finish_reason == "MAX_TOKENS":
            raise RuntimeError(
                f"Gemini API hit MAX_TOKENS limit but generated no text. "
                f"This usually means the token limit is too low. Try increasing max_tokens. "
                f"Response: {str(data)[:500]}"
            )
        else:
            raise RuntimeError(
                f"Gemini API response missing text content. Finish reason: {finish_reason}. "
                f"Response: {str(data)[:500]}"
            )
    except KeyError as e:
        raise RuntimeError(f"Unexpected response structure from Gemini API (missing key: {e}): " + str(data))
    except Exception as e:
        if isinstance(e, RuntimeError):
            raise
        raise RuntimeError("Unexpected error processing Gemini API response: " + str(e) + " | Response: " + str(data))


def call_ollama_api(messages, model="llama2", temperature=0.2, max_tokens=500):
    """Call local Ollama API (completely free, runs locally)"""
    url = "http://localhost:11434/api/chat"
    
    # Convert to Ollama format
    ollama_messages = []
    for msg in messages:
        ollama_messages.append({
            "role": msg.get("role", "user"),
            "content": msg.get("content", "")
        })
    
    payload = {
        "model": model,
        "messages": ollama_messages,
        "options": {
            "temperature": temperature,
            "num_predict": max_tokens
        }
    }
    
    r = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=60)
    r.raise_for_status()
    data = r.json()
    
    try:
        return data["message"]["content"]
    except Exception:
        raise RuntimeError("Unexpected response from Ollama API: " + str(data))


def llm_chat(messages, model=MODEL, temperature=0.2, max_tokens=500):
    """Unified LLM chat interface supporting multiple providers"""
    if PROVIDER == "gemini":
        return call_gemini_api(messages, model=model or "gemini-2.5-flash", temperature=temperature, max_tokens=max_tokens)
    elif PROVIDER == "ollama":
        return call_ollama_api(messages, model=model or "llama2", temperature=temperature, max_tokens=max_tokens)
    elif PROVIDER == "openai" and _HAS_OPENAI:
        return call_openai_sdk(messages, model=model, temperature=temperature, max_tokens=max_tokens)
    else:
        return call_openai_http(messages, model=model, temperature=temperature, max_tokens=max_tokens)


# ---------------- parse helpers ----------------
def fallback_parse(raw: str):
    # fallback: try Subject: header or heuristics
    text = raw.replace("\r\n", "\n").strip()
    m = re.match(r"Subject:\s*(.+?)\n\s*\n(.*)", text, flags=re.I | re.S)
    if m:
        subj = m.group(1).strip()
        body = m.group(2).strip()
        return subj, body
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    if not lines:
        return "(No subject)", ""
    first = lines[0]
    if len(first) < 80 and len(lines) > 1:
        return first, "\n".join(lines[1:]).strip()
    sentence = re.split(r"(?<=[.!?])\s+", text, maxsplit=1)[0]
    subj = sentence.strip()
    if len(subj) > 80:
        subj = subj[:77].rsplit(" ", 1)[0] + "..."
    return subj, text


# ---------------- main: generate email forcing JSON ----------------
def generate_email_json_forced(
    user_prompt: str,
    tone: str = "formal",
    length: str = "medium",
    target_lang: str = "en",
    intent: Optional[str] = None,
    model: Optional[str] = None,
) -> Dict[str, str]:
    model = model or MODEL
    logger.info("generate_email_json_forced model=%s provider=%s", model, PROVIDER)

    enhanced = prompt_enhancer(user_prompt)
    
    # Auto-detect intent from prompt if not provided
    if intent is None:
        prompt_lower = enhanced.lower()
        if any(word in prompt_lower for word in ["request", "ask", "need", "require", "please"]):
            intent = "request_info"
        elif any(word in prompt_lower for word in ["greet", "hello", "hi", "good morning", "good afternoon", "welcome"]):
            intent = "greeting"
        elif any(word in prompt_lower for word in ["thank", "appreciate", "grateful"]):
            intent = "gratitude"
        elif any(word in prompt_lower for word in ["apolog", "sorry", "regret"]):
            intent = "apology"
        else:
            intent = "general"  # Neutral default

    system_msg = {
        "role": "system",
        "content": (
            "You are a professional email assistant. "
            "When asked to produce an email, you MUST return ONLY valid JSON and nothing else. "
            "The JSON object MUST contain exactly two keys: subject (a short subject line) and body (the full email body with \\n\\n between paragraphs). "
            "Do NOT provide commentary, do not wrap JSON in markdown or code fences. Use placeholders like [Manager's Name] or [Your Name] if no names are provided. "
            "IMPORTANT: Follow the user's prompt EXACTLY. If they ask for a simple greeting, write a simple greeting. If they ask for a request, write a request. Do not add content that wasn't requested."
        ),
    }

    # Only include example if it's relevant to the user's request (request-related)
    # Otherwise, skip the example to avoid biasing the model
    messages = [system_msg]
    
    # Include example only for request-related intents to avoid bias
    if intent in ["request_info", "request_action"]:
        example = {
            "role": "user",
            "content": """Example:
Prompt: "ask for a day off tomorrow for a medical appointment"
Tone: formal
Length: short

Return JSON only:
{"subject":"Request for one day leave due to medical appointment","body":"Dear [Manager's Name]\n\nI am writing to request one day of leave tomorrow, [date], due to a medical appointment. I have updated the team and will be available by phone for emergencies.\n\nRegards,\n[Your Name]"}"""
        }
        messages.append(example)

    user_msg = {
        "role": "user",
        "content": (
            f"Compose an email based on the user's request. Follow their prompt EXACTLY - do not add extra content.\n\n"
            f"User's request: {enhanced}\n"
            f"Tone: {tone}\n"
            f"Length: {length}\n"
            f"Target language: {target_lang}\n\n"
            "Return ONLY a single valid JSON object with keys: subject (string), body (string).\n"
            "Example format: {\"subject\":\"...\",\"body\":\"...\"}\n"
            "Do not include any other text or explanation. Follow the user's request exactly.\n"
        ),
    }

    messages.append(user_msg)

    # attempt up to 2 times if we do not get parseable JSON
    raw = None
    parsed = None
    for attempt in range(2):
        try:
            # Increase max_tokens for Gemini to account for thinking tokens
            # Gemini 2.5 models use thinking tokens which count toward the limit
            gemini_max_tokens = 2000 if PROVIDER == "gemini" else 1000
            raw = llm_chat(messages, model=model, temperature=0.2, max_tokens=gemini_max_tokens)
        except Exception as e:
            logger.exception("LLM call failed")
            raise

        if isinstance(raw, dict):
            # some SDKs may already parse; convert to string
            raw = json.dumps(raw)

        raw_str = str(raw).strip()
        logger.info("LLM raw reply (attempt %s): %s", attempt + 1, raw_str[:400])

        # try to extract JSON substring
        data = None
        try:
            data = json.loads(raw_str)
        except Exception:
            m = re.search(r"(\{[\s\S]*\})", raw_str)
            if m:
                candidate = m.group(1)
                try:
                    data = json.loads(candidate)
                except Exception:
                    data = None

        if data and isinstance(data, dict) and "subject" in data and "body" in data:
            parsed = data
            break

        # if not parsed, on second iteration we will add a strict followup instruction
        messages.append({"role": "user", "content": "You must return ONLY valid JSON with subject and body, nothing else. Return it now."})

    if parsed is None:
        # fallback parsing from raw text
        subj, body = fallback_parse(raw_str if raw_str else "")
    else:
        subj = parsed.get("subject", "").strip()
        body = parsed.get("body", "").strip()

    # replace weekday mention with actual date if present in prompt
    body = replace_weekday_with_date(body, user_prompt)

    # ensure signature
    if "regards" not in body.lower() and "sincerely" not in body.lower():
        body = f"{body}\n\nRegards,\n[Your Name]"

    result = {
        "subject": subj or "(No subject)",
        "body": body,
        "intent": intent,
        "raw": raw_str,
        "language": target_lang,
    }
    return result


# convenience alias - keep compatibility with older code
def generate_email(user_prompt: str, tone="formal", length="medium", target_lang="en", intent="request_info"):
    return generate_email_json_forced(user_prompt, tone=tone, length=length, target_lang=target_lang, intent=intent)


# quick test when run directly
if __name__ == "__main__":
    test = "write a email for requesting leave on monday beacuse of project work"
    print(json.dumps(generate_email(test), indent=2))
