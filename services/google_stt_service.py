"""
Google Cloud Speech-to-Text service.

Transcribes audio using Google Cloud Speech-to-Text v1 REST API.
Uses the configured GOOGLE_API_KEY from environment.
"""

import base64
import requests
from config import Config


def transcribe_audio_google(audio_bytes, mime_type="audio/webm", language_code="en"):
    """
    Transcribe audio bytes to text using Google Cloud Speech-to-Text API.

    Args:
        audio_bytes: Raw audio file bytes.
        mime_type: MIME type of the audio.
        language_code: Optional ISO language code (e.g. 'hi', 'en', 'mr').

    Returns:
        Transcribed text string, or None on failure/blocking.
    """
    api_key = Config.GOOGLE_API_KEY
    if not api_key:
        print("[GOOGLE STT] Missing GOOGLE_API_KEY.")
        return None

    # Map internal language codes to Google BCP-47 locale tags
    lang_map = {
        'en': 'en-IN',
        'hi': 'hi-IN',
        'mr': 'mr-IN',
        'te': 'te-IN',
        'ta': 'ta-IN',
        'kn': 'kn-IN',
        'gu': 'gu-IN',
    }
    target_lang = lang_map.get(language_code, 'en-IN')

    # Map MIME types to Google Speech API Encodings
    encoding_map = {
        'audio/webm': 'WEBM_OPUS',
        'audio/ogg': 'OGG_OPUS',
        'audio/mp3': 'MP3',
        'audio/mpeg': 'MP3',
        'audio/wav': 'LINEAR16',
        'audio/x-wav': 'LINEAR16',
    }
    encoding = encoding_map.get(mime_type, 'WEBM_OPUS')

    url = f"https://speech.googleapis.com/v1/speech:recognize?key={api_key}"
    headers = {
        "Content-Type": "application/json"
    }

    # Base64 encode the audio content
    audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')

    payload = {
        "config": {
            "encoding": encoding,
            "languageCode": target_lang,
            "alternativeLanguageCodes": ["hi-IN", "mr-IN"],
            "enableAutomaticPunctuation": True
        },
        "audio": {
            "content": audio_b64
        }
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=20)
        res_json = response.json()

        if response.status_code == 200:
            results = res_json.get("results", [])
            if results:
                transcript = results[0].get("alternatives", [{}])[0].get("transcript", "")
                return transcript.strip()
            print("[GOOGLE STT] No transcription results returned.")
            return None
        else:
            err_msg = res_json.get("error", {}).get("message", response.text)
            print(f"[GOOGLE STT] API Error ({response.status_code}): {err_msg}")
            
            # Print a clear instruction if speech API is blocked or not enabled
            if "blocked" in err_msg.lower() or "not enabled" in err_msg.lower():
                print("[GOOGLE STT INFO] Enable Speech-to-Text API in Google Cloud Console for your key.")
    except Exception as e:
        print(f"[GOOGLE STT] Request failed: {e}")

    return None
