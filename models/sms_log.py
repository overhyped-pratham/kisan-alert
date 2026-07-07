from datetime import datetime
from extensions import db

class SmsLog(db.Model):
    """Logs of SMS notifications sent (or simulated) to farmers."""
    __tablename__ = 'sms_log'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    message = db.Column(db.Text, nullable=False)
    alert_type = db.Column(db.String(50))   # 'weather', 'disease', 'manual', 'auto_weather', 'auto_morning'
    status = db.Column(db.String(50))        # 'Sent (Twilio)', 'Failed (...)', 'Simulated'
    location = db.Column(db.String(100))     # district/village that triggered the alert
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Keep backward-compat alias so old code using .timestamp still works
    @property
    def timestamp(self):
        return self.created_at

    # Relationship
    user = db.relationship('User', backref=db.backref('sms_logs', lazy=True, cascade="all, delete-orphan"))
