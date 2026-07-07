"""
Models package — import all models here so that db.create_all()
detects every table.
"""

from models.user import User
from models.crop_recommendation import CropRecommendation
from models.disease_log import DiseaseLog
from models.weather_alert import WeatherAlert
from models.support_ticket import SupportTicket
from models.sensor_data import SensorData
from models.sms_log import SmsLog

__all__ = [
    'User',
    'CropRecommendation',
    'DiseaseLog',
    'WeatherAlert',
    'SupportTicket',
    'SensorData',
    'SmsLog',
]
