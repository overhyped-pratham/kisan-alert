"""
AI service — uses Groq (primary, fast & free) with Gemini as fallback.

Groq provides ultra-fast inference on Llama-3 / Mixtral models.
Gemini is kept as a secondary fallback in case Groq quota is exhausted.
"""

import requests
from config import Config

# ---------------------------------------------------------------------------
# Groq (primary)
# ---------------------------------------------------------------------------
_GROQ_MODELS = [
    "llama-3.3-70b-versatile",   # best quality, generous quota
    "llama-3.1-8b-instant",      # ultra-fast fallback
]
_GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


def _query_groq(prompt):
    """Query Groq API (OpenAI-compatible). Returns text or None."""
    api_key = Config.GROQ_API_KEY
    if not api_key:
        return None

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    for model in _GROQ_MODELS:
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 500,
            "temperature": 0.7,
        }
        try:
            response = requests.post(_GROQ_URL, headers=headers, json=payload, timeout=12)
            if response.status_code == 200:
                data = response.json()
                choices = data.get("choices", [])
                if choices:
                    return choices[0].get("message", {}).get("content", "").strip()
            elif response.status_code == 429:
                print(f"Groq {model} quota exceeded, trying next model...")
                continue
            else:
                print(f"Groq API ({model}) error: {response.status_code} - {response.text[:200]}")
                continue
        except Exception as e:
            print(f"Error querying Groq ({model}): {e}")
            continue

    return None


# ---------------------------------------------------------------------------
# Gemini (fallback)
# ---------------------------------------------------------------------------
_GEMINI_MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite"]


def _query_gemini(prompt, base64_image=None, mime_type="image/png"):
    """Query Gemini REST API. Returns text or None."""
    api_key = Config.GEMINI_API_KEY
    if not api_key:
        return None

    headers = {"Content-Type": "application/json"}
    parts = [{"text": prompt}]
    if base64_image:
        parts.append({"inlineData": {"mimeType": mime_type, "data": base64_image}})

    payload = {"contents": [{"parts": parts}]}

    for model in _GEMINI_MODELS:
        url = (
            f"https://generativelanguage.googleapis.com/v1beta"
            f"/models/{model}:generateContent?key={api_key}"
        )
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=12)
            if response.status_code == 200:
                res_data = response.json()
                candidates = res_data.get("candidates", [])
                if candidates:
                    content = candidates[0].get("content", {})
                    res_parts = content.get("parts", [])
                    if res_parts:
                        return res_parts[0].get("text", "").strip()
            elif response.status_code == 429:
                print(f"Gemini {model} quota exceeded, trying next model...")
                continue
            else:
                print(f"Gemini API ({model}) error: {response.text[:200]}")
                continue
        except Exception as e:
            print(f"Error querying Gemini ({model}): {e}")
            continue

    return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def query_gemini(prompt, base64_image=None, mime_type="image/png"):
    """
    Query the best available AI backend.

    Priority:
      1. Groq  (fast, free, no image support)
      2. Gemini (supports images, used as fallback or for image queries)
    """
    # For image queries, go directly to Gemini (Groq doesn't support vision)
    if base64_image:
        return _query_gemini(prompt, base64_image, mime_type)

    # Text-only: Groq first, Gemini fallback
    reply = _query_groq(prompt)
    if reply:
        return reply

    return _query_gemini(prompt)
