"""
Expert blueprint — RSK expert portal for ticket resolution.

Access is restricted to users whose email is listed in EXPERT_EMAILS
(configured via the EXPERT_EMAILS environment variable).
"""

from functools import wraps

from flask import Blueprint, render_template, jsonify, request, abort
from flask_login import login_required, current_user
from extensions import db
from models.support_ticket import SupportTicket
from config import Config

expert = Blueprint('expert', __name__)


def expert_required(f):
    """Decorator: require login AND expert email authorization."""
    @wraps(f)
    @login_required
    def decorated_function(*args, **kwargs):
        allowed = Config.EXPERT_EMAILS
        user_email = (current_user.email or '').lower()
        # If no expert emails configured, allow any logged-in user (dev mode).
        # In production, set EXPERT_EMAILS to lock this down.
        if allowed and user_email not in allowed:
            abort(403)  # Forbidden
        return f(*args, **kwargs)
    return decorated_function


@expert.route('/expert-portal')
@expert_required
def expert_portal():
    """RSK expert portal — lists all support tickets."""
    tickets = SupportTicket.query.order_by(SupportTicket.created_at.desc()).all()
    return render_template('expert.html', tickets=tickets)


@expert.route('/ticket/expert-resolve', methods=['POST'])
@expert_required
def resolve_ticket():
    """Resolve a support ticket with expert recommendation."""
    data = request.json or {}
    ticket_id = data.get('ticket_id')
    recommendation = data.get('recommendation', '')

    if not ticket_id:
        return jsonify({'success': False, 'error': 'Ticket ID is required'}), 400

    ticket = SupportTicket.query.get(int(ticket_id) if str(ticket_id).isdigit() else None)
    if not ticket:
        return jsonify({'success': False, 'error': 'Ticket not found'}), 404

    ticket.expert_recommendation = recommendation
    ticket.status = 'Resolved'
    db.session.commit()

    return jsonify({'success': True})
