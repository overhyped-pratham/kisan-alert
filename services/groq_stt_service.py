"""
Groq Whisper Speech-to-Text service.

Wraps the Groq Cloud ASR API to transcribe audio using the whisper-large-v3 model.
Provides ultra-fast and free speech recognition with fallback.
"""

import requests
from config import Config

# Groq Transcription URL
GROQ_STT_URL = "https://api.groq.com/openai/v1/audio/transcriptions"


def transcribe_audio_groq(audio_bytes, mime_type="audio/webm", language_code=None):
    """
    Transcribe audio bytes to text using Groq's whisper-large-v3.

    Args:
        audio_bytes: Raw audio file bytes.
        mime_type: MIME type of the audio.
        language_code: Optional ISO language code (e.g. 'hi', 'en', 'mr').

    Returns:
        Transcribed text string, or None on failure.
    """
    api_key = Config.GROQ_API_KEY
    if not api_key:
        print("[GROQ STT] Missing GROQ_API_KEY.")
        return None

    # Map language codes if necessary
    lang_map = {
        'en': 'en',
        'hi': 'hi',
        'mr': 'mr',
        'te': 'te',
        'ta': 'ta',
        'kn': 'kn',
        'gu': 'gu',
    }
    lang = lang_map.get(language_code) if language_code else None

    headers = {
        "Authorization": f"Bearer {api_key}"
    }

    # Prepare multipart data
    files = {
        'file': ('audio.webm', audio_bytes, mime_type),
        'model': (None, 'whisper-large-v3'),
    }
    if lang:
        files['language'] = (None, lang)

    try:
        response = requests.post(GROQ_STT_URL, headers=headers, files=files, timeout=30)
        if response.status_code == 200:
            data = response.json()
            return data.get('text', '').strip()
        else:
            print(f"[GROQ STT] Error ({response.status_code}): {response.text}")
    except Exception as e:
        print(f"[GROQ STT] Request failed: {e}")

    return None
