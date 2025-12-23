from backend.services.nlp import textrank_summary, best_matching_snippets, simple_intent, _split_sentences
from backend.services.translation import detect_lang, translate_text

def enhance_prompt(user_prompt: str, context_text: str = "", tone: str = "formal", length: str = "medium", target_lang: str = "en"):
    src_lang = detect_lang(user_prompt) or "en"
    prompt_en = user_prompt if src_lang == "en" else translate_text(user_prompt, src="auto", tgt="en")
    intent = simple_intent(prompt_en)
    summary = textrank_summary(context_text, k=3) if context_text else ""
    snippets = best_matching_snippets(prompt_en, _split_sentences(context_text), topn=3) if context_text else []
    controls = f"Tone: {tone}; Length: {length}; Intent: {intent}"
    enhanced = f"""Prompt:
{prompt_en}

Context Summary:
{summary}

Top Snippets:
{chr(10).join(f'- {s} (score {sc:.2f})' for s, sc in snippets)}

Controls:
{controls}
""".strip()
    return enhanced, intent, src_lang, target_lang
