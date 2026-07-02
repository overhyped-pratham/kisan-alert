"""
Crop blueprint — crop recommendation and soil prediction routes.
"""

import os
import numpy as np
from flask import Blueprint, render_template, request, jsonify
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from extensions import db
from models.crop_recommendation import CropRecommendation
from services.soil_service import predict_soil
from services.crop_service import predict_crop, get_crop_details_fallback
from services.weather_service import weather_fetch
from config import Config

crop = Blueprint('crop', __name__)


@crop.route('/crop-recommend')
def crop_recommend():
    """Crop recommendation page."""
    return render_template('crop.html', title='Arogya Krishi - Crop Recommendation')


@crop.route('/soil-predict', methods=['POST'])
@login_required
def soil_prediction():
    """Predict soil type from uploaded image."""
    title = 'Arogya Krishi - Soil Prediction'

    if 'soil_image' not in request.files:
        return render_template('try_again.html', title=title, error_message="No file part in the request.")

    file = request.files['soil_image']
    if file.filename == '':
        return render_template('try_again.html', title=title, error_message="No file selected.")

    # Validate file extension and MIME type
    if not _allowed_image_file(file.filename):
        return render_template('try_again.html', title=title, error_message="Allowed file types are png, jpg, jpeg.")

    soil_model_type = request.form.get('soil_model_type', 'soilnet')

    try:
        filename = secure_filename(file.filename)
        file_path = os.path.join(Config.UPLOAD_FOLDER, filename)
        file.save(file_path)

        soil_name, template_name = predict_soil(file_path, soil_model_type)

        # Clean up uploaded file after prediction (don't keep user uploads)
        try:
            os.remove(file_path)
        except OSError:
            pass

        return render_template(template_name, prediction=soil_name, title=title)
    except Exception as e:
        # Log full error server-side; show generic message to user
        print(f"Soil prediction error: {e}")
        return render_template('try_again.html', title=title, error_message="Could not analyze the soil image. Please try again with a clear photo.")

    return render_template('try_again.html', title=title, error_message="Something went wrong.")


def _allowed_image_file(filename):
    """Check if the uploaded file has an allowed image extension."""
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@crop.route('/crop-recommend-ai', methods=['POST'])
@login_required
def crop_recommend_ai():
    """AI-powered crop recommendation using ML models + weather data."""
    title = 'Arogya Krishi - Crop Recommendation'

    try:
        location = request.form.get('location', 'Pune')
        season = request.form.get('season', 'kharif')
        N = float(request.form.get('nitrogen', 80))
        P = float(request.form.get('phosphorous', 45))
        K = float(request.form.get('potassium', 50))
        ph = float(request.form.get('ph', 6.5))
        soil_type = request.form.get('soil_type', 'Alluvial')
        model_type = request.form.get('model_type', 'random_forest')
    except (ValueError, TypeError):
        return render_template(
            'try_again.html', title=title,
            error_message="Invalid input values. Please enter valid numbers for soil parameters."
        )

    # Fetch weather dynamically
    weather_tuple = weather_fetch(location)
    if weather_tuple:
        temperature, humidity = weather_tuple
    else:
        temperature, humidity = 28.0, 65.0

    # Estimate rainfall by season (all three Indian cropping seasons)
    rainfall_map = {'kharif': 300.0, 'rabi': 50.0, 'zaid': 50.0}
    rainfall = rainfall_map.get(season, 100.0)

    # Predict crop
    features = [N, P, K, temperature, humidity, ph, rainfall]
    predicted_crop, confidence, model_name = predict_crop(features, model_type)

    # Lookup crop details
    details = get_crop_details_fallback(predicted_crop)

    # Save to database
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

    return render_template(
        'crop-result-ai.html',
        crop_name=predicted_crop,
        confidence=confidence,
        profitability=details['profitability'],
        water_requirement=details['water'],
        expected_yield=details['yield'],
        fertilizer_recommendation=details['fertilizer'],
        model_name=model_name,
        inputs={
            'location': location,
            'season': season,
            'N': N, 'P': P, 'K': K, 'ph': ph,
            'temperature': temperature,
            'humidity': humidity,
        },
    )
