from datetime import datetime
import bcrypt
from extensions import db
from flask_login import UserMixin


class User(UserMixin, db.Model):
    """Farmer / user account model with bcrypt password hashing."""

    __tablename__ = 'user'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    preferred_language = db.Column(db.String(10), default='en')
    district = db.Column(db.String(100), default='Pune')
    village = db.Column(db.String(100), default='Haveli')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    crop_recommendations = db.relationship(
        'CropRecommendation', backref='user', lazy=True
    )
    disease_logs = db.relationship('DiseaseLog', backref='user', lazy=True)
    weather_alerts = db.relationship('WeatherAlert', backref='user', lazy=True)
    support_tickets = db.relationship('SupportTicket', backref='user', lazy=True)
    sensor_readings = db.relationship('SensorData', backref='user', lazy=True)

    def set_password(self, password):
        """Hash and set the user's password."""
        self.password = bcrypt.hashpw(
            password.encode('utf-8'), bcrypt.gensalt()
        ).decode('utf-8')

    def check_password(self, password):
        """Verify a plaintext password against the stored hash."""
        return bcrypt.checkpw(
            password.encode('utf-8'), self.password.encode('utf-8')
        )
