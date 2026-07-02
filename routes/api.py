"""
API blueprint — JSON data endpoints for dashboard and AJAX calls.
"""

from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from models.crop_recommendation import CropRecommendation
from models.disease_log import DiseaseLog
from models.support_ticket import SupportTicket

api = Blueprint('api', __name__)


@api.route('/dashboard/history-data', methods=['GET'])
@login_required
def get_dashboard_history():
    """Return crop, disease, and ticket history as JSON for the dashboard."""
    crop_recs = (
        CropRecommendation.query
        .filter_by(user_id=current_user.id)
        .order_by(CropRecommendation.created_at.desc())
        .limit(10)
        .all()
    )
    disease_logs = (
        DiseaseLog.query
        .filter_by(user_id=current_user.id)
        .order_by(DiseaseLog.created_at.desc())
        .limit(10)
        .all()
    )
    tickets = (
        SupportTicket.query
        .filter_by(user_id=current_user.id)
        .order_by(SupportTicket.created_at.desc())
        .all()
    )

    return jsonify({
        'crop_recommendations': [
            {
                'crop': rec.crop,
                'location': rec.location,
                'season': rec.season,
                'confidence': rec.confidence,
            }
            for rec in crop_recs
        ],
        'disease_logs': [
            {
                'disease': log.disease,
                'severity': log.severity,
                'confidence': log.confidence,
                'fertilizer': log.fertilizer,
            }
            for log in disease_logs
        ],
        'support_tickets': [
            {
                'id': t.id,
                'disease': t.disease,
                'assigned_center': t.assigned_center,
                'priority': t.priority,
                'status': t.status,
                'expert_recommendation': t.expert_recommendation,
            }
            for t in tickets
        ],
    })
