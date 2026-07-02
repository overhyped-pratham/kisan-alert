"""
Weather blueprint — sensor simulation, weather alerts, and advisory API.
"""

import numpy as np
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from extensions import db
from models.sensor_data import SensorData
from models.weather_alert import WeatherAlert
from services.weather_service import weather_fetch, get_weather_data
from config import Config

weather = Blueprint('weather', __name__)


@weather.route('/sensor/simulate', methods=['GET'])
@login_required
def simulate_telemetry():
    """Generate simulated IoT sensor readings and return as JSON."""
    soil_moisture = float(np.random.uniform(20.0, 60.0))
    ph = float(np.random.uniform(5.5, 7.8))
    temperature = float(np.random.uniform(22.0, 36.0))
    nitrogen = float(np.random.uniform(40.0, 110.0))
    phosphorous = float(np.random.uniform(20.0, 80.0))
    potassium = float(np.random.uniform(25.0, 95.0))
    humidity = float(np.random.uniform(50.0, 85.0))

    reading = SensorData(
        user_id=current_user.id,
        soil_moisture=soil_moisture,
        ph=ph,
        temperature=temperature,
        humidity=humidity,
        nitrogen=nitrogen,
        phosphorous=phosphorous,
        potassium=potassium,
    )
    db.session.add(reading)
    db.session.commit()

    return jsonify({
        'soil_moisture': soil_moisture,
        'ph': ph,
        'temperature': temperature,
        'nitrogen': nitrogen,
        'phosphorous': phosphorous,
        'potassium': potassium,
    })


@weather.route('/weather-alerts', methods=['POST'])
@login_required
def generate_weather_alerts():
    """Generate weather alerts based on sensor data."""
    sensor_data = request.json or {}
    soil_moisture = sensor_data.get('soil_moisture', 35.0)

    alerts = []

    if soil_moisture < 25.0:
        alerts.append({
            'type': 'Dry Spell Warning',
            'message': (
                'Soil moisture has dropped below 25%. Drought risk is critical. '
                'Please increase crop watering cycle immediately.'
            ),
        })
    elif soil_moisture > 55.0:
        alerts.append({
            'type': 'Irrigation Advisory',
            'message': (
                'Soil is saturated (moisture > 55%). Postpone next irrigation '
                'sequence to conserve water resources.'
            ),
        })
    else:
        alerts.append({
            'type': 'Weather Alert',
            'message': (
                'Rain predicted in your district within 8 hours. Delay irrigation '
                'to save 500 liters of water.'
            ),
        })

    for alert in alerts:
        db_alert = WeatherAlert(
            user_id=current_user.id,
            alert_type=alert['type'],
            message=alert['message'],
        )
        db.session.add(db_alert)
    db.session.commit()

    return jsonify(alerts)


@weather.route('/weather/advisory', methods=['GET'])
def weather_advisory_api():
    """Public weather advisory JSON endpoint — uses live weather API or smart fallback."""
    location = request.args.get('location', 'Pune')
    weather_tuple = weather_fetch(location)

    if weather_tuple:
        temp, humidity = weather_tuple
        # Derive description from temperature/humidity
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
        'temperature': temp,
        'humidity': humidity,
        'description': description,
        'wind_speed': 8.0,
        'rain': 0.0,
    })
