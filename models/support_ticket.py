from datetime import datetime
from extensions import db


class SupportTicket(db.Model):
    """Support tickets escalated to RSK (Rythu Seva Kendra) experts."""

    __tablename__ = 'support_ticket'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    disease = db.Column(db.String(100))
    image_base64 = db.Column(db.Text)
    severity = db.Column(db.String(50))
    priority = db.Column(db.String(50))
    assigned_center = db.Column(db.String(100))
    status = db.Column(db.String(50), default='Open')
    expert_recommendation = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
