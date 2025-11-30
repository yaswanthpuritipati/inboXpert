from typing import List, Tuple
import re
import networkx as nx
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
# add at top
import os, joblib

_spam_model = None
def load_spam_model():
    global _spam_model
    if _spam_model is None:
        path = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "models", "spam_model.joblib"))
        if os.path.exists(path):
            _spam_model = joblib.load(path)
    return _spam_model

def predict_spam(text: str) -> bool:
    model = load_spam_model()
    if model:
        # model returns 1 for spam, 0 for ham in the training script
        return bool(model.predict([text])[0])
    return simple_is_spam(text)  # fallback

# --- TextRank summary ---
def textrank_summary(text: str, k: int = 3) -> str:
    sents = _split_sentences(text)
    if len(sents) <= k:
        return text
    vect = TfidfVectorizer().fit_transform(sents)
    sim = cosine_similarity(vect)
    nx_graph = nx.from_numpy_array(sim)
    scores = nx.pagerank(nx_graph)
    ranked = sorted([(scores[i], s) for i, s in enumerate(sents)], reverse=True)
    return " ".join([s for _, s in ranked[:k]])

def _split_sentences(text: str) -> List[str]:
    # a very light sentence splitter to avoid heavy NLTK data
    parts = re.split(r'(?<=[.!?])\s+', text.strip())
    return [p.strip() for p in parts if p.strip()]

# --- Keywords by cosine ---
def best_matching_snippets(keywords: str, sentences: List[str], topn: int = 3) -> List[Tuple[str, float]]:
    if not sentences:
        return []
    vect = TfidfVectorizer().fit([keywords] + sentences)
    mat = vect.transform([keywords] + sentences)
    sims = cosine_similarity(mat[0], mat[1:]).flatten()
    idxs = sims.argsort()[::-1][:topn]
    return [(sentences[i], float(sims[i])) for i in idxs]

# --- Simple spam/intent fallbacks ---
SPAM_WORDS = {"lottery","win money","crypto double","urgent reward","viagra","casino","100% free"}
INTENT_KEYWORDS = {
    "schedule_meeting": {"schedule","meeting","call","reschedule","slots","calendar"},
    "follow_up": {"follow up","checking in","gentle reminder","nudge"},
    "submit_document": {"attach","attached","submission","resume","cv","invoice","report"},
    "request_info": {"could you","please share","information","details","clarify","question"},
    "acknowledge": {"noted","thanks","thank you","acknowledge","received"},
    "escalate": {"escalate","urgent"," asap","priority","complaint"},
}

def simple_is_spam(text: str) -> bool:
    t = text.lower()
    return any(w in t for w in SPAM_WORDS)

def simple_intent(text: str) -> str:
    t = text.lower()
    for intent, kws in INTENT_KEYWORDS.items():
        if any(k in t for k in kws):
            return intent
    return "request_info"
