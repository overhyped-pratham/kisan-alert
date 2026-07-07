"""
Services package — import all services to trigger model loading at startup.
"""

from services.weather_service import get_weather_data, weather_fetch
from services.crop_service import (
    load_crop_models,
    predict_crop,
    crop_class_label,
    get_crop_details_fallback,
)
from services.disease_service import (
    load_disease_pipeline,
    detect_disease,
    classify_severity,
    generate_fertilizer_recommendation,
    get_disease_details,
)
from services.fertilizer_service import recommend_fertilizer
from services.gemini_service import query_gemini
from services.soil_service import load_soil_models, predict_soil
from services.voice_service import generate_voice_reply, generate_sms_reply
from services.elevenlabs_service import transcribe_audio
from services.groq_stt_service import transcribe_audio_groq
from services.google_stt_service import transcribe_audio_google
from services.hf_whisper_service import transcribe_audio_hf
from services.sms_service import send_farmer_sms

__all__ = [
    'get_weather_data',
    'weather_fetch',
    'load_crop_models',
    'predict_crop',
    'crop_class_label',
    'get_crop_details_fallback',
    'load_disease_pipeline',
    'detect_disease',
    'classify_severity',
    'generate_fertilizer_recommendation',
    'get_disease_details',
    'recommend_fertilizer',
    'query_gemini',
    'load_soil_models',
    'predict_soil',
    'generate_voice_reply',
    'generate_sms_reply',
    'transcribe_audio',
    'transcribe_audio_groq',
    'transcribe_audio_google',
    'transcribe_audio_hf',
    'send_farmer_sms',
]
