"""
Voice blueprint — voice/text assistant chatbot endpoint + speech-to-text.
"""

from flask import Blueprint, jsonify, request
from flask_login import login_required
from services.voice_service import generate_voice_reply
from services.elevenlabs_service import transcribe_audio

voice = Blueprint('voice', __name__)


@voice.route('/voice/query', methods=['POST'])
@login_required
def voice_assistant_query():
    """Process a voice/text query and return an AI response."""
    data = request.json or {}
    query = data.get('query', '')
    language = data.get('language', 'en')

    reply = generate_voice_reply(query, language)
    return jsonify({'reply': reply})


@voice.route('/voice/transcribe', methods=['POST'])
@login_required
def voice_transcribe():
    """
    Transcribe audio to text using ElevenLabs Scribe STT.

    Accepts multipart/form-data with:
        - audio: the audio file (webm/wav/mp3)
        - language: optional ISO language code (en, hi, mr, te, ta, kn, gu)

    Falls back to instructing the client to use the browser-native
    Web Speech API when the service is unavailable.
    """
    if 'audio' not in request.files:
        return jsonify({
            'success': False,
            'error': 'No audio file provided.',
            'use_fallback': True,
        }), 400

    audio_file = request.files['audio']
    language = request.form.get('language', 'en')

    # Determine MIME type from the uploaded file
    mime_type = audio_file.mimetype or 'audio/webm'

    audio_bytes = audio_file.read()
    if not audio_bytes:
        return jsonify({
            'success': False,
            'error': 'Audio file is empty.',
            'use_fallback': True,
        }), 400

    text = transcribe_audio(audio_bytes, mime_type=mime_type, language_code=language)

    if text:
        return jsonify({'success': True, 'text': text})

    # Graceful fallback — client should use browser Web Speech API
    return jsonify({
        'success': False,
        'error': 'Speech-to-text service unavailable. Using browser fallback.',
        'use_fallback': True,
    }), 200
