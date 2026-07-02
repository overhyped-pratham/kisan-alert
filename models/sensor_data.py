from datetime import datetime
from extensions import db


class SensorData(db.Model):
    """Simulated IoT sensor telemetry readings from farmer fields."""

    __tablename__ = 'sensor_data'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    soil_moisture = db.Column(db.Float)
    ph = db.Column(db.Float)
    nitrogen = db.Column(db.Float)
    phosphorous = db.Column(db.Float)
    potassium = db.Column(db.Float)
    temperature = db.Column(db.Float)
    humidity = db.Column(db.Float)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
