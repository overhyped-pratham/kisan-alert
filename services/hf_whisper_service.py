"""
HuggingFace Local Whisper STT service.

Uses openai/whisper-tiny (150MB) running locally on CPU.
No API key required. Completely offline. No ffmpeg needed.
Audio bytes are decoded using python stdlib wave module and passed
directly as numpy arrays to the pipeline.
"""

import io
import wave
import numpy as np

# Lazy-load the pipeline so it doesn't block server startup
_pipe = None


def _get_pipeline():
    global _pipe
    if _pipe is None:
        from transformers import pipeline
        print("[HF Whisper] Loading whisper-tiny model (one-time)...")
        _pipe = pipeline(
            "automatic-speech-recognition",
            model="openai/whisper-tiny",
        )
        print("[HF Whisper] Model ready.")
    return _pipe


def _decode_wav_bytes(audio_bytes):
    """
    Decode raw WAV bytes to a float32 numpy array.
    Returns (audio_data, sample_rate) or raises an exception.
    """
    with wave.open(io.BytesIO(audio_bytes), "rb") as w:
        channels = w.getnchannels()
        sample_width = w.getsampwidth()
        framerate = w.getframerate()
        frames = w.readframes(w.getnframes())

    if sample_width == 2:
        audio = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
    elif sample_width == 4:
        audio = np.frombuffer(frames, dtype=np.int32).astype(np.float32) / 2147483648.0
    else:
        audio = (np.frombuffer(frames, dtype=np.uint8).astype(np.float32) - 128.0) / 128.0

    # Mix stereo → mono
    if channels > 1:
        audio = audio.reshape(-1, channels).mean(axis=1)

    return audio, framerate


def transcribe_audio_hf(audio_bytes, mime_type="audio/webm", language_code="en"):
    """
    Transcribe audio bytes using local HuggingFace Whisper-tiny.

    Supports WAV/PCM audio only (no ffmpeg needed).
    Returns transcribed text string, or None if format is unsupported.
    """
    import os
    if os.environ.get('RENDER') == 'true' or os.environ.get('DISABLE_LOCAL_AI_MODELS') == 'true' or os.environ.get('FLASK_ENV') == 'production':
        print("[HF Whisper] Production/Render detected. Skipping local Whisper to avoid Out of Memory.")
        return None

    # Only WAV can be decoded without ffmpeg on the server
    if mime_type not in ("audio/wav", "audio/x-wav", "audio/wave"):
        print(f"[HF Whisper] Unsupported MIME type '{mime_type}' — WAV only. Skipping.")
        return None

    try:
        audio_data, sample_rate = _decode_wav_bytes(audio_bytes)
    except Exception as e:
        print(f"[HF Whisper] Failed to decode WAV bytes: {e}")
        return None

    # Language code → Whisper BCP-47
    lang_map = {
        'hi': 'hi', 'mr': 'mr', 'te': 'te',
        'ta': 'ta', 'kn': 'kn', 'gu': 'gu', 'en': 'en',
    }
    lang = lang_map.get(language_code, 'en')

    try:
        pipe = _get_pipeline()
        result = pipe(
            {"raw": audio_data, "sampling_rate": sample_rate},
            generate_kwargs={"language": lang, "task": "transcribe"},
        )
        text = result.get("text", "").strip()
        print(f"[HF Whisper] Transcribed: {text!r}")
        return text if text else None
    except Exception as e:
        print(f"[HF Whisper] Transcription error: {e}")
        return None
