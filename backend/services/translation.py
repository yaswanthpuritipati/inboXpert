from langdetect import detect

# Stubs: replace with googletrans / Azure / MarianMT as needed.
def detect_lang(text: str) -> str:
    try:
        return detect(text)
    except Exception:
        return "en"

def translate_text(text: str, src: str = "auto", tgt: str = "en") -> str:
    # TODO: integrate real translator. For now, return input if tgt==en, else annotate.
    if tgt == "en":
        return text
    return f"[Translated to {tgt}]\n{text}"
