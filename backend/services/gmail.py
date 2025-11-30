import base64
from bs4 import BeautifulSoup
from typing import List, Dict
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

def gmail_service(creds_dict):
    creds = Credentials(**creds_dict)
    return build("gmail", "v1", credentials=creds)

def extract_text_from_payload(payload):
    txt = ""
    def walk(parts):
        nonlocal txt
        for p in parts or []:
            mime = p.get("mimeType","")
            data = p.get("body", {}).get("data")
            if data:
                decoded = base64.urlsafe_b64decode(data).decode("utf-8","ignore")
                if mime == "text/plain":
                    txt += decoded
                elif mime == "text/html":
                    txt += BeautifulSoup(decoded, "html.parser").get_text(" ", strip=True)
            if p.get("parts"):
                walk(p["parts"])
    walk(payload.get("parts", []))
    return txt.strip()

def fetch_messages(svc, max_results=50) -> List[Dict]:
    lst = svc.users().messages().list(userId="me", maxResults=max_results).execute().get("messages", [])
    out = []
    for m in lst:
        full = svc.users().messages().get(userId="me", id=m["id"], format="full").execute()
        headers = {h["name"].lower(): h["value"] for h in full["payload"]["headers"]}
        body_text = extract_text_from_payload(full["payload"]) or full.get("snippet","")
        out.append({
            "gmail_id": m["id"],
            "from_addr": headers.get("from",""),
            "to_addr": headers.get("to",""),
            "subject": headers.get("subject",""),
            "received_at": headers.get("date",""),
            "snippet": full.get("snippet",""),
            "body_text": body_text
        })
    return out
