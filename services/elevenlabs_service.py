"""
ElevenLabs Speech-to-Text service.

Wraps the ElevenLabs Scribe STT API to transcribe audio. Falls back
gracefully (returns None) when the API key is missing or the request fails,
allowing the caller to fall back to the browser-native Web Speech API.
"""

import requests
from config import Config

# ElevenLabs Scribe (Speech-to-Text) endpoint
SCRIBE_URL = "https://api.elevenlabs.io/v1/speech-to-text"


def transcribe_audio(audio_bytes, mime_type="audio/webm", language_code=None):
    """
    Transcribe audio bytes to text using ElevenLabs Scribe.

    Args:
        audio_bytes: Raw audio file bytes (webm, wav, mp3, etc.).
        mime_type: MIME type of the audio (default: audio/webm from MediaRecorder).
        language_code: Optional ISO language code (e.g. 'hi', 'en', 'mr').
            If None, ElevenLabs auto-detects the language.

    Returns:
        Transcribed text string, or None on failure.
    """
    api_key = Config.ELEVENLABS_API_KEY
    if not api_key or api_key == "YOUR_ELEVENLABS_API_KEY":
        return None

    # Map our internal language codes to BCP-47 codes ElevenLabs expects
    lang_map = {
        'en': 'en',
        'hi': 'hi',
        'mr': 'mr',
        'te': 'te',
        'ta': 'ta',
        'kn': 'kn',
        'gu': 'gu',
    }
    model_id = lang_map.get(language_code) if language_code else 'en'

    headers = {"xi-api-key": api_key}

    files = {
        'file': ('audio.webm', audio_bytes, mime_type),
        'model_id': (None, 'scribe_v1'),
        'language_code': (None, model_id),
    }

    try:
        response = requests.post(SCRIBE_URL, headers=headers, files=files, timeout=30)
        if response.status_code == 200:
            data = response.json()
            return data.get('text', '').strip()
        else:
            print(f"ElevenLabs STT error ({response.status_code}): {response.text}")
    except Exception as e:
        print(f"ElevenLabs STT request failed: {e}")

    return None
