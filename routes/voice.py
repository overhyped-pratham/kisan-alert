"""
Voice blueprint — voice/text assistant chatbot endpoint + speech-to-text.
"""

from flask import Blueprint, jsonify, request
from flask_login import login_required
from services.voice_service import generate_voice_reply
from services.elevenlabs_service import transcribe_audio
from services.groq_stt_service import transcribe_audio_groq
from services.google_stt_service import transcribe_audio_google
from services.hf_whisper_service import transcribe_audio_hf

voice = Blueprint('voice', __name__)


@voice.route('/voice/query', methods=['POST'])
@login_required
def voice_assistant_query():
    """Process a voice/text query and return an AI response."""
    data = request.json or {}
    query = data.get('query') or data.get('question', '')
    language = data.get('language', 'en')

    reply = generate_voice_reply(query, language)
    return jsonify({'reply': reply})


@voice.route('/voice/transcribe', methods=['POST'])
@login_required
def voice_transcribe():
    """
    Transcribe audio to text.

    Fallback chain:
      1. Google Cloud STT  (cloud, best accuracy, needs API enabled)
      2. Groq Whisper      (cloud, free, fast, multilingual)
      3. HuggingFace local (offline, whisper-tiny, WAV only)
      4. ElevenLabs Scribe (cloud, needs API key)
      5. Browser Web Speech API (client-side)
    """
    if 'audio' not in request.files:
        return jsonify({
            'success': False,
            'error': 'No audio file provided.',
            'use_fallback': True,
        }), 400

    audio_file = request.files['audio']
    language = request.form.get('language', 'en')
    mime_type = audio_file.mimetype or 'audio/webm'
    audio_bytes = audio_file.read()

    if not audio_bytes:
        return jsonify({
            'success': False,
            'error': 'Audio file is empty.',
            'use_fallback': True,
        }), 400

    # 1. Google Cloud STT
    text = transcribe_audio_google(audio_bytes, mime_type=mime_type, language_code=language)

    # 2. Groq Whisper
    if not text:
        print("[STT] Trying Groq Whisper...")
        text = transcribe_audio_groq(audio_bytes, mime_type=mime_type, language_code=language)

    # 3. HuggingFace local Whisper (WAV only, fully offline)
    if not text:
        print("[STT] Trying local HuggingFace Whisper...")
        text = transcribe_audio_hf(audio_bytes, mime_type=mime_type, language_code=language)

    # 4. ElevenLabs Scribe
    if not text:
        print("[STT] Trying ElevenLabs Scribe...")
        text = transcribe_audio(audio_bytes, mime_type=mime_type, language_code=language)

    if text:
        return jsonify({'success': True, 'text': text})

    # Graceful fallback — client should use browser Web Speech API
    return jsonify({
        'success': False,
        'error': 'Cloud Speech-to-text services unavailable. Using browser fallback.',
        'use_fallback': True,
    }), 200
