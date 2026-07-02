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
)
from services.weather_service import weather_fetch
from services.voice_service import generate_voice_reply
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

    if not name or not email or not password:
        return jsonify({'success': False, 'error': 'Name, email, and password are required.'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'error': 'Email already registered.'}), 409

    new_user = User(name=name, email=email)
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
        in_P = data.get('phosphorous')
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
        'confidence': f'{round(confidence * 100)}%',
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

        # Disease details
        disease_details = get_disease_details(disease_name)

        # Save to DB
        log = DiseaseLog(
            user_id=current_user.id,
            image_base64=img_base64,
            disease=disease_name,
            severity=severity,
            confidence=confidence,
            treatment=fertilizer_info['fertilizer'],
            prevention='Wash gardening tools; apply mulching; avoid overhead watering.',
            organic_alternatives='Neem oil spray, compost tea, baking soda solution.',
            fertilizer=fertilizer_info['fertilizer'],
            voice_description=voice_desc,
        )
        db.session.add(log)
        db.session.commit()

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
            'treatment': fertilizer_info['fertilizer'],
            'prevention': 'Wash gardening tools; apply mulching; avoid overhead watering.',
            'organicAlternatives': 'Neem oil spray, compost tea, baking soda solution.',
            'fertilizer': fertilizer_info['fertilizer'],
            'ticketCreated': ticket_created,
            'ticketId': ticket_id,
        })

    except Exception as e:
        print(f'Error in API disease detection: {e}')
        return jsonify({'error': 'Could not analyze the image. Please try again with a clear photo.'}), 500


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
        'crop_recommendations': [
            {
                'crop': rec.crop,
                'location': rec.location,
                'season': rec.season,
                'confidence': rec.confidence,
            }
            for rec in crop_recs
        ],
        'disease_logs': [
            {
                'disease': log.disease,
                'severity': log.severity,
                'confidence': log.confidence,
                'fertilizer': log.fertilizer,
            }
            for log in disease_logs
        ],
        'support_tickets': [
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
