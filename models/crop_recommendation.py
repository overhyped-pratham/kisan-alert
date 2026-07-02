from datetime import datetime
from extensions import db


class CropRecommendation(db.Model):
    """Stores crop recommendation results for each user query."""

    __tablename__ = 'crop_recommendation'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    soil_type = db.Column(db.String(100))
    location = db.Column(db.String(100))
    season = db.Column(db.String(100))
    temperature = db.Column(db.Float)
    humidity = db.Column(db.Float)
    ph = db.Column(db.Float)
    rainfall = db.Column(db.Float)
    crop = db.Column(db.String(100))
    confidence = db.Column(db.Float)
    water_requirement = db.Column(db.String(100))
    expected_yield = db.Column(db.String(100))
    profitability_index = db.Column(db.Float)
    fertilizer_recommendation = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
