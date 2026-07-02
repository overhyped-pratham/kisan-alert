"""
SMS blueprint — feature-phone SMS advisory simulator.
"""

from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required
from services.voice_service import generate_sms_reply

sms = Blueprint('sms', __name__)


@sms.route('/sms-simulator')
@login_required
def sms_simulator():
    """SMS advisory simulator page."""
    return render_template('sms_simulator.html')


@sms.route('/sms/send', methods=['POST'])
@login_required
def receive_sms():
    """Receive an SMS message and return an advisory reply."""
    data = request.json or {}
    message = data.get('message', '').strip()

    reply = generate_sms_reply(message)
    return jsonify({'reply': reply})
