from datetime import datetime
from extensions import db


class DiseaseLog(db.Model):
    """Stores crop disease detection results with images and treatments."""

    __tablename__ = 'disease_log'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    image_base64 = db.Column(db.Text)
    disease = db.Column(db.String(100))
    severity = db.Column(db.String(50))
    confidence = db.Column(db.Float)
    treatment = db.Column(db.Text)
    prevention = db.Column(db.Text)
    organic_alternatives = db.Column(db.Text)
    fertilizer = db.Column(db.String(200))
    voice_description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
