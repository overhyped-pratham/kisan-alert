from datetime import datetime
from extensions import db


class WeatherAlert(db.Model):
    """Weather alerts generated for farmers based on sensor data."""

    __tablename__ = 'weather_alert'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    alert_type = db.Column(db.String(100))
    message = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
