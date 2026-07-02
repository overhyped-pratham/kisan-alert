"""
Gemini AI service — wraps Google Gemini REST API.

Tries gemini-2.0-flash first, then falls back to gemini-2.0-flash-lite
(which has more generous free-tier quotas) before giving up.
"""

import requests
from config import Config

# Model preference order — flash-lite is more generous on the free tier
_MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite"]


def query_gemini(prompt, base64_image=None, mime_type="image/png"):
    """
    Query the Gemini REST API.

    Args:
        prompt: Text prompt string.
        base64_image: Optional base64-encoded image data.
        mime_type: MIME type of the image (default: image/png).

    Returns:
        Response text string, or None on failure.
    """
    api_key = Config.GEMINI_API_KEY
    if not api_key or api_key == "YOUR_GEMINI_API_KEY":
        return None

    headers = {"Content-Type": "application/json"}

    parts = [{"text": prompt}]
    if base64_image:
        parts.append({
            "inlineData": {
                "mimeType": mime_type,
                "data": base64_image,
            }
        })

    payload = {"contents": [{"parts": parts}]}

    for model in _MODELS:
        url = (
            f"https://generativelanguage.googleapis.com/v1beta"
            f"/models/{model}:generateContent?key={api_key}"
        )
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=12)
            if response.status_code == 200:
                res_data = response.json()
                candidates = res_data.get('candidates', [])
                if candidates:
                    content = candidates[0].get('content', {})
                    res_parts = content.get('parts', [])
                    if res_parts:
                        return res_parts[0].get('text', '')
            elif response.status_code == 429:
                # Quota exceeded for this model — try the next one
                print(f"Gemini {model} quota exceeded, trying next model...")
                continue
            else:
                print(f"Gemini API ({model}) returned error: {response.text}")
                continue
        except Exception as e:
            print(f"Error querying Gemini ({model}): {e}")
            continue

    return None
