"""
API SPA blueprint — JSON endpoints consumed by the React frontend (kisan-alert-).

All routes are under /api prefix. They reuse existing services so no ML logic
is duplicated. Responses use camelCase keys to match the React TypeScript types.
"""

import os
import io
import base64
from flask import Blueprint, jsonify, request
from flask_login import login_required, login_user, logout_user, current_user
from werkzeug.utils import secure_filename
from config import Config
from extensions import db
from models.user import User
from models.crop_recommendation import CropRecommendation
from models.disease_log import DiseaseLog
from models.support_ticket import SupportTicket
from services.crop_service import predict_crop, get_crop_details_fallback
from services.soil_service import predict_soil
from services.disease_service import (
    detect_disease,
    classify_severity,
    generate_fertilizer_recommendation,
    get_disease_details,
    get_disease_remedies,
)
from services.weather_service import weather_fetch
from services.voice_service import generate_voice_reply
from services.sms_service import normalize_phone
from PIL import Image

api_spa = Blueprint('api_spa', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}


def _allowed_image_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------

@api_spa.route('/auth/signup', methods=['POST'])
def signup():
    """Register a new user and return user JSON."""
    data = request.json or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    phone = data.get('phone', '').strip()
    district = data.get('district', '').strip()
    village = data.get('village', '').strip()
    farm_size = data.get('farm_size', '').strip()
    crop_type = data.get('crop_type', '').strip()
    preferred_language = data.get('preferred_language', '').strip()

    if not name or not email or not password:
        return jsonify({'success': False, 'error': 'Name, email, and password are required.'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'error': 'Email already registered.'}), 409

    phone_clean, _ = normalize_phone(phone) if phone else (None, None)

    new_user = User(
        name=name,
        email=email,
        phone=phone_clean,
        district=district if district else 'Pune',
        village=village if village else 'Haveli',
        farm_size=farm_size if farm_size else '5 Acres',
        crop_type=crop_type if crop_type else 'Wheat',
        preferred_language=preferred_language if preferred_language else 'hi'
    )
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    login_user(new_user)

    return jsonify({
        'success': True,
        'user': _serialize_user(new_user),
    }), 201


@api_spa.route('/auth/login', methods=['POST'])
def login():
    """Authenticate user and return user JSON."""
    data = request.json or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'success': False, 'error': 'Email and password are required.'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'success': False, 'error': 'Invalid email or password.'}), 401

    login_user(user)

    return jsonify({
        'success': True,
        'user': _serialize_user(user),
    })


@api_spa.route('/auth/logout', methods=['POST'])
@login_required
def logout():
    """End the current session."""
    logout_user()
    return jsonify({'success': True})


@api_spa.route('/auth/me', methods=['GET'])
@login_required
def me():
    """Return the currently logged-in user's profile."""
    return jsonify({'user': _serialize_user(current_user)})


# ---------------------------------------------------------------------------
# Crop recommendation
# ---------------------------------------------------------------------------

@api_spa.route('/crop/recommend', methods=['POST'])
@login_required
def crop_recommend():
    """AI-powered crop recommendation, returns JSON."""
    data = request.json or {}

    try:
        location = data.get('location', 'Pune')
        season = data.get('season', 'kharif')
        model_type = data.get('modelType', 'random_forest')
        
        # Load NPK data mapping based on location
        NPK_MAPPING = {
            'indore': {'N': 80.0, 'P': 45.0, 'K': 52.0, 'ph': 6.6},
            'pune': {'N': 70.0, 'P': 50.0, 'K': 45.0, 'ph': 6.8},
            'mumbai': {'N': 60.0, 'P': 40.0, 'K': 35.0, 'ph': 6.2},
            'nashik': {'N': 75.0, 'P': 48.0, 'K': 52.0, 'ph': 6.7},
            'nagpur': {'N': 85.0, 'P': 42.0, 'K': 48.0, 'ph': 7.0},
            'ahmednagar': {'N': 78.0, 'P': 46.0, 'K': 50.0, 'ph': 6.9},
            'aurangabad': {'N': 72.0, 'P': 50.0, 'K': 44.0, 'ph': 7.1},
            'hyderabad': {'N': 90.0, 'P': 55.0, 'K': 60.0, 'ph': 6.5},
            'jaipur': {'N': 50.0, 'P': 30.0, 'K': 40.0, 'ph': 7.5},
            'delhi': {'N': 65.0, 'P': 45.0, 'K': 55.0, 'ph': 7.2},
            'bangalore': {'N': 85.0, 'P': 50.0, 'K': 58.0, 'ph': 6.4},
            'chennai': {'N': 70.0, 'P': 42.0, 'K': 40.0, 'ph': 6.3},
            'kolkata': {'N': 95.0, 'P': 60.0, 'K': 65.0, 'ph': 6.0},
            'lucknow': {'N': 88.0, 'P': 48.0, 'K': 50.0, 'ph': 7.0},
            'bhopal': {'N': 80.0, 'P': 45.0, 'K': 52.0, 'ph': 6.6},
            'patna': {'N': 92.0, 'P': 52.0, 'K': 54.0, 'ph': 6.8},
        }

        # Determine defaults based on location
        loc_lower = location.lower()
        default_npk = {'N': 80.0, 'P': 45.0, 'K': 50.0, 'ph': 6.5}
        for city, values in NPK_MAPPING.items():
            if city in loc_lower:
                default_npk = values
                break

        # If data has NPK, parse it; otherwise fall back to location-specific defaults
        in_N = data.get('nitrogen')
        in_P = data.get('phosphorous', data.get('phosphorus'))
        in_K = data.get('potassium')
        in_ph = data.get('ph')

        # Override default values from frontend
        N = float(in_N) if in_N is not None and float(in_N) != 80.0 else default_npk['N']
        P = float(in_P) if in_P is not None and float(in_P) != 45.0 else default_npk['P']
        K = float(in_K) if in_K is not None and float(in_K) != 50.0 else default_npk['K']
        ph = float(in_ph) if in_ph is not None and float(in_ph) != 6.5 else default_npk['ph']
        
        # Determine soil type
        soil_type = data.get('soilType', 'Alluvial')
        soil_image_b64 = data.get('soilImage')
        if soil_image_b64 and ',' in soil_image_b64:
            try:
                header, encoded = soil_image_b64.split(',', 1)
                img_data = base64.b64decode(encoded)
                temp_filename = f"temp_soil_{current_user.id}.jpg"
                file_path = os.path.join(Config.UPLOAD_FOLDER, temp_filename)
                with open(file_path, 'wb') as f:
                    f.write(img_data)
                
                predicted_soil, _ = predict_soil(file_path, 'soilnet')
                soil_type = predicted_soil
            except Exception as pe:
                print(f"Error predicting soil type: {pe}")
            finally:
                try:
                    os.remove(file_path)
                except Exception:
                    pass
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid input values.'}), 400

    # Fetch weather
    weather_tuple = weather_fetch(location)
    if weather_tuple:
        temperature, humidity = weather_tuple
    else:
        temperature, humidity = 28.0, 65.0

    rainfall_map = {'kharif': 300.0, 'rabi': 50.0, 'zaid': 50.0}
    rainfall = rainfall_map.get(season, 100.0)

    features = [N, P, K, temperature, humidity, ph, rainfall]
    predicted_crop, confidence, model_name = predict_crop(features, model_type)
    details = get_crop_details_fallback(predicted_crop)

    # Save to DB
    rec = CropRecommendation(
        user_id=current_user.id,
        soil_type=soil_type,
        location=location,
        season=season,
        temperature=temperature,
        humidity=humidity,
        ph=ph,
        rainfall=rainfall,
        crop=predicted_crop,
        confidence=confidence,
        water_requirement=details['water'],
        expected_yield=details['yield'],
        profitability_index=details['profitability'],
        fertilizer_recommendation=details['fertilizer'],
    )
    db.session.add(rec)
    db.session.commit()

    return jsonify({
        'cropName': predicted_crop,
        'confidence': f'{round(confidence * 100 if confidence <= 1.0 else confidence)}%',
        'expectedYield': details['yield'],
        'profit': details['profitability'],
        'waterRequirement': details['water'],
        'fertilizer': details['fertilizer'],
        'modelName': model_name,
        'inputs': {
            'location': location,
            'season': season,
            'nitrogen': N,
            'phosphorous': P,
            'potassium': K,
            'ph': ph,
            'temperature': temperature,
            'humidity': humidity,
        },
    })


# ---------------------------------------------------------------------------
# AI Day-wise Crop Growing Plan
# ---------------------------------------------------------------------------

@api_spa.route('/crop/growing-plan', methods=['POST'])
@login_required
def crop_growing_plan():
    """
    Generate a structured day-wise crop growing plan using AI (Groq/Gemini).
    Accepts soil analysis results and returns a detailed plan.
    """
    data = request.json or {}
    crop_name    = data.get('cropName', 'Wheat')
    soil_type    = data.get('soilType', 'Alluvial')
    location     = data.get('location', 'India')
    season       = data.get('season', 'rabi')
    nitrogen     = data.get('nitrogen', 80)
    phosphorous  = data.get('phosphorous', 45)
    potassium    = data.get('potassium', 50)
    ph           = data.get('ph', 6.5)
    duration_days = int(data.get('durationDays', 90))

    prompt = f"""You are KrishiSaar AI, an expert agricultural advisor for Indian farmers.

Based on the following soil analysis and crop recommendation, create a detailed, practical, day-wise crop growing plan.

Crop: {crop_name}
Soil Type: {soil_type}
Location: {location}
Season: {season}
Soil NPK: N={nitrogen}, P={phosphorous}, K={potassium}
Soil pH: {ph}
Planning Duration: {duration_days} days

Generate a structured day-wise plan with the following format:
- Group days into phases (e.g., Day 1-7: Land Preparation, Day 8-14: Sowing, etc.)
- For each phase, list specific tasks the farmer must do each day or every few days
- Include: irrigation schedule, fertilizer application dates, pesticide/fungicide schedule, weeding, thinning, harvesting indicators
- Keep language simple and actionable
- Return the plan as a JSON array of phases, where each phase has:
  - "phase": phase name
  - "days": day range string (e.g. "Day 1-7")
  - "tasks": array of task strings
  - "tip": one expert tip for this phase

Return ONLY valid JSON, no markdown, no explanation outside the JSON."""

    from services.gemini_service import query_gemini
    import json

    raw = query_gemini(prompt)
    plan = None

    if raw:
        # Strip markdown code fences if present
        cleaned = raw.strip().lstrip('```json').lstrip('```').rstrip('```').strip()
        try:
            plan = json.loads(cleaned)
        except Exception:
            # Return raw text as single phase if JSON parse fails
            plan = [{
                "phase": "Complete Growing Plan",
                "days": f"Day 1-{duration_days}",
                "tasks": [line.strip() for line in cleaned.split('\n') if line.strip()],
                "tip": "Follow the schedule consistently for best results."
            }]

    if not plan:
        # Offline fallback
        plan = _offline_growing_plan(crop_name, duration_days)

    return jsonify({
        'cropName': crop_name,
        'soilType': soil_type,
        'season': season,
        'durationDays': duration_days,
        'plan': plan
    })


def _offline_growing_plan(crop_name, duration_days):
    """Fallback day-wise plan when AI is unavailable."""
    third = duration_days // 3
    return [
        {
            "phase": "Land Preparation & Sowing",
            "days": f"Day 1-{third}",
            "tasks": [
                "Plough and level the field to 15-20 cm depth.",
                "Apply basal dose of fertilizer (NPK as per soil report).",
                "Treat seeds with fungicide before sowing.",
                "Sow seeds at recommended spacing.",
                "Apply first irrigation within 24 hours of sowing."
            ],
            "tip": "Ensure good soil moisture at sowing time for uniform germination."
        },
        {
            "phase": "Vegetative Growth",
            "days": f"Day {third+1}-{2*third}",
            "tasks": [
                "Irrigate every 7-10 days based on soil moisture.",
                "Apply top-dress nitrogen fertilizer at tillering stage.",
                "Monitor for pests — spray neem oil if needed.",
                "Do first weeding at 3 weeks after sowing.",
                "Do second weeding at 5-6 weeks."
            ],
            "tip": "Weeding in early stages is critical to avoid 30-40% yield loss."
        },
        {
            "phase": "Flowering, Grain Fill & Harvest",
            "days": f"Day {2*third+1}-{duration_days}",
            "tasks": [
                f"Stop irrigation 2 weeks before expected harvest of {crop_name}.",
                "Watch for fungal disease signs — apply fungicide if spotted.",
                "Check grain moisture content before harvest (should be 14-18%).",
                "Harvest at right maturity to avoid shattering losses.",
                "Store grain in dry, ventilated storage."
            ],
            "tip": "Timely harvest prevents 10-15% yield loss from over-ripening."
        }
    ]


# ---------------------------------------------------------------------------
# Disease detection
# ---------------------------------------------------------------------------

@api_spa.route('/disease/detect', methods=['POST'])
@login_required
def disease_detect():
    """Detect crop disease from leaf image, returns JSON."""
    if 'file' not in request.files:
        return jsonify({'error': 'No image file provided.'}), 400

    file = request.files.get('file')
    if not file or not _allowed_image_file(file.filename):
        return jsonify({'error': 'Allowed file types are png, jpg, jpeg.'}), 400

    voice_desc = request.form.get('voiceDesc', '')
    expert_escalate = request.form.get('expertEscalate', 'false') == 'true'

    try:
        # Read image and convert to base64
        img_data = file.read()
        img = Image.open(io.BytesIO(img_data)).convert('RGB')
        buffered = io.BytesIO()
        img.save(buffered, format='PNG')
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

        # Detect disease
        disease_name, confidence = detect_disease(img)
        severity = classify_severity(disease_name)

        # Fertilizer recommendation
        lat, lon = _get_user_coords()
        fertilizer_info = generate_fertilizer_recommendation(disease_name, lat, lon)

        # Disease details and remedies
        disease_details = get_disease_details(disease_name)
        remedies = get_disease_remedies(disease_name)

        # Save to DB
        log = DiseaseLog(
            user_id=current_user.id,
            image_base64=img_base64,
            disease=disease_name,
            severity=severity,
            confidence=confidence,
            treatment=remedies['chemical'],
            prevention=remedies['prevention'],
            organic_alternatives=remedies['organic'],
            fertilizer=fertilizer_info['fertilizer'],
            voice_description=voice_desc,
        )
        db.session.add(log)
        db.session.commit()

        # Send SMS alert for disease detection if phone exists
        if current_user.phone:
            try:
                from services.sms_service import send_farmer_sms
                disease_clean = disease_name.replace('___', ' – ').replace('_', ' ')
                sms_text = f"ArogyaKrishi: {disease_clean} ({severity} severity) detected. Remedy: {remedies['chemical'][:80]}..."
                send_farmer_sms(current_user, sms_text, alert_type="disease")
            except Exception as sms_err:
                print(f"Error triggering disease SMS alert: {sms_err}")

        # Auto-escalate to support ticket
        ticket_created = False
        ticket_id = None
        assigned_center = f'RSK-{current_user.district or "Pune"}'

        if confidence < 0.65 or expert_escalate:
            ticket = SupportTicket(
                user_id=current_user.id,
                disease=disease_name,
                image_base64=img_base64,
                severity=severity,
                priority='High' if severity == 'High' else 'Medium',
                assigned_center=assigned_center,
                status='Open',
            )
            db.session.add(ticket)
            db.session.commit()
            ticket_created = True
            ticket_id = ticket.id

        return jsonify({
            'diseaseName': disease_name,
            'confidence': f'{round(confidence * 100)}%',
            'severity': severity,
            'treatment': remedies['chemical'],
            'prevention': remedies['prevention'],
            'organicAlternatives': remedies['organic'],
            'fertilizer': {
                'name': fertilizer_info['fertilizer'],
                'details': fertilizer_info['details'],
                'applicationMethod': fertilizer_info['application_method'],
            },
            'ticketCreated': ticket_created,
            'ticketId': ticket_id,
            'details': disease_details,
        })

    except Exception as e:
        print(f'Error in API disease detection: {e}')
        return jsonify({'error': 'Could not analyze the image. Please try again with a clear photo.'}), 500

@api_spa.route('/profile/update', methods=['POST'])
@login_required
def update_profile():
    """Update user profile details in database."""
    data = request.json or {}

    if 'name' in data:
        current_user.name = data['name'].strip()
    if 'phone' in data:
        phone_clean, _ = normalize_phone(data['phone'].strip())
        current_user.phone = phone_clean
    if 'preferredLanguage' in data:
        current_user.preferred_language = data['preferredLanguage'].strip()
    if 'district' in data:
        current_user.district = data['district'].strip()
    if 'village' in data:
        current_user.village = data['village'].strip()
    if 'farmSize' in data:
        current_user.farm_size = data['farmSize'].strip()
    if 'cropType' in data:
        current_user.crop_type = data['cropType'].strip()

    db.session.commit()
    return jsonify({
        'success': True,
        'user': _serialize_user(current_user)
    })


@api_spa.route('/disease/escalate', methods=['POST'])
@login_required
def disease_escalate():
    """Manually escalate the most recent disease log to a support ticket."""
    log = DiseaseLog.query.filter_by(user_id=current_user.id).order_by(DiseaseLog.created_at.desc()).first()
    if not log:
        return jsonify({'error': 'No recent disease log found to escalate.'}), 404

    # Check if a ticket already exists for this log to prevent duplicate escalation
    existing_ticket = SupportTicket.query.filter_by(user_id=current_user.id, disease=log.disease, status='Open').first()
    if existing_ticket:
        return jsonify({
            'success': True,
            'ticketId': existing_ticket.id,
            'assignedCenter': existing_ticket.assigned_center
        })

    assigned_center = f"RSK-{current_user.district or 'Pune'}"
    ticket = SupportTicket(
        user_id=current_user.id,
        disease=log.disease,
        image_base64=log.image_base64,
        severity=log.severity,
        priority='High' if log.severity == 'High' else 'Medium',
        assigned_center=assigned_center,
        status='Open',
    )
    db.session.add(ticket)
    db.session.commit()
    return jsonify({
        'success': True,
        'ticketId': ticket.id,
        'assignedCenter': assigned_center
    })


# ---------------------------------------------------------------------------
# Profile / Dashboard history
# ---------------------------------------------------------------------------


@api_spa.route('/profile', methods=['GET'])
@login_required
def get_profile():
    """Return user profile with recent activity."""
    crop_recs = (
        CropRecommendation.query
        .filter_by(user_id=current_user.id)
        .order_by(CropRecommendation.created_at.desc())
        .limit(10)
        .all()
    )
    disease_logs = (
        DiseaseLog.query
        .filter_by(user_id=current_user.id)
        .order_by(DiseaseLog.created_at.desc())
        .limit(10)
        .all()
    )

    return jsonify({
        'user': _serialize_user(current_user),
        'recentCrops': [
            {
                'crop': rec.crop,
                'location': rec.location,
                'season': rec.season,
                'confidence': rec.confidence,
            }
            for rec in crop_recs
        ],
        'recentDiseases': [
            {
                'disease': log.disease,
                'severity': log.severity,
                'confidence': log.confidence,
            }
            for log in disease_logs
        ],
    })


@api_spa.route('/dashboard/history', methods=['GET'])
@login_required
def dashboard_history():
    """Alias of the existing JSON endpoint, under /api for the SPA."""
    crop_recs = (
        CropRecommendation.query
        .filter_by(user_id=current_user.id)
        .order_by(CropRecommendation.created_at.desc())
        .limit(10)
        .all()
    )
    disease_logs = (
        DiseaseLog.query
        .filter_by(user_id=current_user.id)
        .order_by(DiseaseLog.created_at.desc())
        .limit(10)
        .all()
    )
    tickets = (
        SupportTicket.query
        .filter_by(user_id=current_user.id)
        .order_by(SupportTicket.created_at.desc())
        .all()
    )

    return jsonify({
        'cropHistory': [
            {
                'crop': rec.crop,
                'location': rec.location,
                'season': rec.season,
                'confidence': rec.confidence,
            }
            for rec in crop_recs
        ],
        'diseaseHistory': [
            {
                'disease': log.disease,
                'severity': log.severity,
                'confidence': log.confidence,
                'fertilizer': log.fertilizer,
            }
            for log in disease_logs
        ],
        'tickets': [
            {
                'id': t.id,
                'disease': t.disease,
                'assigned_center': t.assigned_center,
                'priority': t.priority,
                'status': t.status,
                'expert_recommendation': t.expert_recommendation,
            }
            for t in tickets
        ],
    })


# ---------------------------------------------------------------------------
# AI Chat
# ---------------------------------------------------------------------------

@api_spa.route('/ai/ask', methods=['POST'])
@login_required
def ai_ask():
    """AI chat endpoint — text answer + optional TTS audio URL."""
    data = request.json or {}
    question = data.get('question', '').strip()
    language  = data.get('language', getattr(current_user, 'preferred_language', 'en') or 'en')

    if not question:
        return jsonify({'error': 'question is required'}), 400

    # Generate text reply (Groq / Gemini / local fallback)
    reply = generate_voice_reply(question, language)

    # Try to generate TTS audio (ElevenLabs)
    audio_url = None
    try:
        from services.voice_service import text_to_speech_elevenlabs
        audio_b64 = text_to_speech_elevenlabs(reply, language)
        if audio_b64:
            # Return as a data-URI so the browser can play it directly
            audio_url = f'data:audio/mpeg;base64,{audio_b64}'
    except Exception as tts_err:
        print(f'[TTS] Skipped: {tts_err}')

    return jsonify({'reply': reply, 'audioUrl': audio_url})


# ---------------------------------------------------------------------------
# Smart Alerts — full real-data endpoint
# ---------------------------------------------------------------------------

@api_spa.route('/alerts', methods=['GET'])
@login_required
def get_alerts():
    """
    Returns a structured alerts payload for the SPA alerts page:
      - riskScores: derived from live weather + recent disease detections
      - activeAlerts: disease logs + open support tickets + weather warnings
      - upcomingAlerts: next-day forecast predictions
    """
    from datetime import datetime, timedelta

    # --- 1. Fetch live weather ---
    location = current_user.district or 'Pune'
    weather_tuple = weather_fetch(location)
    if weather_tuple:
        temp, humidity = weather_tuple
    else:
        temp, humidity = 28.0, 65.0

    # --- 2. Recent disease detections (last 30 days) ---
    cutoff = datetime.utcnow() - timedelta(days=30)
    recent_diseases = (
        DiseaseLog.query
        .filter_by(user_id=current_user.id)
        .filter(DiseaseLog.created_at >= cutoff)
        .order_by(DiseaseLog.created_at.desc())
        .all()
    )

    # --- 3. Open support tickets ---
    open_tickets = (
        SupportTicket.query
        .filter_by(user_id=current_user.id)
        .order_by(SupportTicket.created_at.desc())
        .limit(5)
        .all()
    )

    # --- 4. Compute risk scores ---
    # Weather risk: based on temp extremes and humidity
    weather_risk = 0
    if temp > 40:
        weather_risk = 95
    elif temp > 38:
        weather_risk = 85
    elif temp > 35:
        weather_risk = 65
    elif humidity > 85:
        weather_risk = 75
    elif humidity > 70:
        weather_risk = 50
    elif temp < 15:
        weather_risk = 60
    elif temp < 20:
        weather_risk = 40
    else:
        weather_risk = 20

    # Disease risk: based on recent detections
    if not recent_diseases:
        disease_risk = 10
    else:
        severity_scores = {'High': 80, 'Medium': 50, 'Low': 25}
        max_severity = max(
            severity_scores.get(d.severity, 25) for d in recent_diseases
        )
        # Scale by recency — more recent = higher risk
        most_recent = recent_diseases[0]
        days_ago = (datetime.utcnow() - most_recent.created_at).days
        recency_factor = max(0.4, 1.0 - days_ago * 0.05)
        disease_risk = int(min(90, max_severity * recency_factor))

    # Water/irrigation risk: inverse of humidity (dry = risk)
    water_risk = max(5, int((100 - humidity) * 0.3))
    if humidity < 30:
        water_risk = 70
    elif humidity < 50:
        water_risk = 40

    # Overall risk level
    overall = int(weather_risk * 0.5 + disease_risk * 0.35 + water_risk * 0.15)
    if overall >= 70:
        risk_label = 'High Risk'
        risk_color = 'error'
    elif overall >= 40:
        risk_label = 'Moderate Risk'
        risk_color = 'warning'
    else:
        risk_label = 'Low Risk'
        risk_color = 'success'

    # --- 5. Build active alerts list ---
    active_alerts = []

    # Weather-derived alerts
    weather_alerts_raw = _derive_alerts(temp, humidity)
    for i, msg in enumerate(weather_alerts_raw):
        if 'No active' in msg:
            continue
        is_danger = 'Heatwave' in msg or 'Heavy' in msg or 'Cold' in msg
        active_alerts.append({
            'id': f'weather-{i}',
            'type': 'weather',
            'severity': 'danger' if is_danger else 'warning',
            'title': msg.split('—')[0].strip(),
            'description': msg,
            'time': 'Today',
            'advice': _derive_advisory(temp, humidity),
        })

    # Disease log alerts
    for log in recent_diseases[:3]:
        days_ago = (datetime.utcnow() - log.created_at).days
        time_str = 'Today' if days_ago == 0 else f'{days_ago}d ago'
        disease_clean = log.disease.replace('___', ' – ').replace('_', ' ')
        active_alerts.append({
            'id': f'disease-{log.id}',
            'type': 'disease',
            'severity': 'danger' if log.severity == 'High' else 'warning' if log.severity == 'Medium' else 'info',
            'title': disease_clean,
            'description': f'Detected {disease_clean} ({log.severity} severity, {int((log.confidence or 0) * 100)}% confidence)',
            'time': time_str,
            'advice': log.treatment or 'Consult an agricultural expert.',
        })

    # Support ticket alerts
    for ticket in open_tickets:
        if ticket.status == 'Open':
            disease_clean = (ticket.disease or 'Unknown').replace('___', ' – ').replace('_', ' ')
            active_alerts.append({
                'id': f'ticket-{ticket.id}',
                'type': 'general',
                'severity': 'warning',
                'title': f'Ticket #{ticket.id}: {disease_clean}',
                'description': f'Expert review pending — Assigned to {ticket.assigned_center or "RSK Center"}',
                'time': 'Pending',
                'advice': ticket.expert_recommendation or 'Your case is being reviewed by an agricultural expert.',
            })

    # --- 6. Upcoming alerts (forecast-derived) ---
    upcoming = []

    if humidity > 60:
        upcoming.append({
            'id': 'upcoming-rain',
            'icon': 'rain',
            'when': 'Tomorrow',
            'description': f'Rainfall expected ({"Heavy" if humidity > 80 else "Moderate"})',
        })

    if weather_risk > 30:
        upcoming.append({
            'id': 'upcoming-fert',
            'icon': 'plant',
            'when': 'In 2 days',
            'description': 'Fertilizer window opens',
        })

    if temp > 34:
        upcoming.append({
            'id': 'upcoming-heat',
            'icon': 'thermometer',
            'when': 'In 3 days',
            'description': f'Heatwave risk ({"High" if temp > 38 else "Low"})',
        })

    if not upcoming:
        upcoming.append({
            'id': 'upcoming-clear',
            'icon': 'sun',
            'when': 'Next 3 days',
            'description': 'Clear conditions expected for field work',
        })

    return jsonify({
        'riskScores': {
            'overall': overall,
            'label': risk_label,
            'color': risk_color,
            'weather': weather_risk,
            'disease': disease_risk,
            'water': water_risk,
        },
        'activeAlerts': active_alerts,
        'upcomingAlerts': upcoming,
        'weather': {
            'temp': int(temp),
            'humidity': int(humidity),
            'location': location,
            'forecast': _derive_advisory(temp, humidity),
        },
    })


@api_spa.route('/alerts/dismiss', methods=['POST'])
@login_required
def dismiss_alert():
    """Dismiss a weather alert (no-op for disease/ticket alerts which persist)."""
    return jsonify({'success': True})


# ---------------------------------------------------------------------------
# Weather advisory
# ---------------------------------------------------------------------------


@api_spa.route('/weather/advisory', methods=['GET'])
def weather_advisory():
    """Public weather advisory for the SPA dashboard."""
    location = request.args.get('location', 'Pune')
    weather_tuple = weather_fetch(location)

    if weather_tuple:
        temp, humidity = weather_tuple
        if temp > 38:
            description = 'Hot & Sunny'
        elif temp > 30 and humidity > 70:
            description = 'Humid & Partly Cloudy'
        elif humidity > 80:
            description = 'Overcast & Rainy'
        elif temp < 20:
            description = 'Cool & Pleasant'
        else:
            description = 'Clear Skies'
    else:
        temp = 28.0
        humidity = 65.0
        description = 'Sunny Clear Skies'

    return jsonify({
        'forecast': f'{int(temp)}°C {description}',
        'advice': _derive_advisory(temp, humidity),
        'alerts': _derive_alerts(temp, humidity),
    })


# ---------------------------------------------------------------------------
# SMS Alert Logs & Test Trigger API
# ---------------------------------------------------------------------------

@api_spa.route('/sms/logs', methods=['GET'])
@login_required
def get_sms_logs():
    """Returns a list of SMS notifications sent to the current user."""
    from models.sms_log import SmsLog
    logs = SmsLog.query.filter_by(user_id=current_user.id).order_by(SmsLog.created_at.desc()).all()
    return jsonify([
        {
            'id': log.id,
            'phoneNumber': log.phone_number,
            'message': log.message,
            'alertType': log.alert_type,
            'status': log.status,
            'timestamp': log.timestamp.isoformat()
        } for log in logs
    ])


@api_spa.route('/sms/send-test', methods=['POST'])
@login_required
def send_test_sms():
    """Send an SMS alert to the mobile number entered in the request (or profile fallback)."""
    data = request.json or {}
    message = data.get('message', 'ArogyaKrishi Alert: Heavy rain warning in your area. Avoid fertilizer spray today.')
    alert_type = data.get('alertType', 'custom')
    phone = (data.get('phoneNumber') or data.get('phone') or current_user.phone or '').strip()

    if not phone:
        return jsonify({
            'error': 'Please enter a mobile number to receive the alert.'
        }), 400

    from services.sms_service import send_farmer_sms, normalize_phone
    phone_clean, _ = normalize_phone(phone)
    if not phone_clean or len(phone_clean) != 10:
        return jsonify({
            'error': 'Please enter a valid 10-digit Indian mobile number.'
        }), 400

    # Persist entered number on profile when user provides one
    if not current_user.phone or current_user.phone != phone_clean:
        current_user.phone = phone_clean
        db.session.commit()

    success, status = send_farmer_sms(current_user, message, alert_type, phone=phone_clean)

    return jsonify({
        'success': success,
        'status': status,
        'sentTo': phone_clean,
        'message': message
    })


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _serialize_user(user):
    """Convert a User model to a JSON-serializable dict with camelCase keys."""
    return {
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'phone': user.phone or '',
        'preferredLanguage': user.preferred_language or 'hi',
        'district': user.district or 'Pune',
        'village': user.village or 'Haveli',
        'farmSize': user.farm_size or '5 Acres',
        'cropType': user.crop_type or 'Wheat',
    }


def _get_user_coords():
    """Return approximate (lat, lon) based on user's district."""
    DISTRICT_COORDS = {
        'pune': (18.52, 73.85), 'mumbai': (19.08, 72.88),
        'nashik': (19.99, 73.79), 'nagpur': (21.15, 79.08),
        'ahmednagar': (19.08, 74.74), 'aurangabad': (19.88, 75.32),
        'hyderabad': (17.39, 78.49), 'jaipur': (26.91, 75.79),
        'delhi': (28.61, 77.21), 'bangalore': (12.97, 77.59),
        'chennai': (13.08, 80.27), 'kolkata': (22.57, 88.36),
        'lucknow': (26.85, 80.91), 'bhopal': (23.26, 77.41),
        'indore': (22.72, 75.86), 'patna': (25.60, 85.14),
    }
    district = (current_user.district or 'pune').lower().strip()
    return DISTRICT_COORDS.get(district, (19.07, 72.87))


def _derive_advisory(temp, humidity):
    """Generate advisory text from temperature/humidity."""
    if temp > 38:
        return 'Apply mulch to conserve soil moisture. Avoid afternoon field work.'
    elif humidity > 80:
        return 'Rain likely. Skip irrigation today and check drainage channels.'
    elif temp < 20:
        return 'Cool conditions. Protect sensitive crops from cold stress.'
    else:
        return 'Good conditions for fieldwork. Monitor soil moisture regularly.'


def _derive_alerts(temp, humidity):
    """Generate alert strings for the SPA alerts feed."""
    alerts = []
    if temp > 38:
        alerts.append('Heatwave warning — temperatures above 38°C')
    if humidity > 80:
        alerts.append('Heavy rainfall expected — check drainage')
    if temp < 20:
        alerts.append('Cold spell advisory — protect sensitive crops')
    if not alerts:
        alerts.append('No active weather warnings for your area')
    return alerts
