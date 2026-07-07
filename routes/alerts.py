"""
Alert management routes — manual broadcast + scheduler status.
"""

from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from extensions import db

alerts_bp = Blueprint('alerts_bp', __name__)


@alerts_bp.route('/api/alerts/send', methods=['POST'])
@login_required
def send_manual_alert():
    """
    Manually send an SMS alert.

    Body JSON:
      {
        "message":      "Your custom alert message",
        "alert_type":   "manual",           // optional
        "phone":        "9876543210",       // optional — send to this number
        "phoneNumber":  "9876543210",       // alias for phone
        "user_ids":     [1, 2, 3]           // optional — omit to send to ALL users
      }
    """
    from flask import current_app
    from services.alert_scheduler import send_manual_alert as _send
    from services.sms_service import send_farmer_sms, normalize_phone

    data = request.get_json(silent=True) or {}
    message    = (data.get('message') or '').strip()
    alert_type = data.get('alert_type', 'manual')
    user_ids   = data.get('user_ids')   # None → all users
    phone      = (data.get('phoneNumber') or data.get('phone') or '').strip()

    if not message:
        return jsonify({'success': False, 'error': 'Message is required.'}), 400

    # Send to a single entered mobile number
    if phone:
        phone_clean, _ = normalize_phone(phone)
        if not phone_clean or len(phone_clean) != 10:
            return jsonify({'success': False, 'error': 'Please enter a valid 10-digit mobile number.'}), 400

        if not current_user.phone:
            current_user.phone = phone_clean
            db.session.commit()

        ok, status = send_farmer_sms(current_user, message, alert_type=alert_type, phone=phone_clean)
        return jsonify({
            'success': ok,
            'sent':    1 if ok else 0,
            'failed':  0 if ok else 1,
            'results': [{'user': current_user.name, 'phone': phone_clean, 'status': status}],
        })

    sent, fail, results = _send(
        current_app._get_current_object(),
        message,
        alert_type=alert_type,
        user_ids=user_ids,
    )

    return jsonify({
        'success': True,
        'sent':    sent,
        'failed':  fail,
        'results': results,
    })


@alerts_bp.route('/api/alerts/scheduler/status', methods=['GET'])
@login_required
def scheduler_status():
    """Return the list of scheduled alert jobs and their next run times."""
    from services.alert_scheduler import get_scheduled_jobs, get_scheduler
    scheduler = get_scheduler()
    return jsonify({
        'running': bool(scheduler and scheduler.running),
        'jobs':    get_scheduled_jobs(),
    })


@alerts_bp.route('/api/alerts/scheduler/trigger/<job_id>', methods=['POST'])
@login_required
def trigger_job(job_id):
    """Manually trigger a scheduled job immediately (for testing)."""
    from services.alert_scheduler import get_scheduler
    scheduler = get_scheduler()
    if not scheduler:
        return jsonify({'success': False, 'error': 'Scheduler not running.'}), 503

    valid_jobs = {'weather_alerts', 'morning_advisory'}
    if job_id not in valid_jobs:
        return jsonify({'success': False, 'error': 'Unknown job.'}), 400

    try:
        scheduler.get_job(job_id).modify(next_run_time=__import__('datetime').datetime.now())
        return jsonify({'success': True, 'message': f'Job "{job_id}" triggered.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@alerts_bp.route('/api/alerts/history', methods=['GET'])
@login_required
def alert_history():
    """Return the SMS alert history for the current user."""
    from models.sms_log import SmsLog
    logs = (
        SmsLog.query
        .filter_by(user_id=current_user.id)
        .order_by(SmsLog.created_at.desc())
        .limit(50)
        .all()
    )
    return jsonify([
        {
            'id':         l.id,
            'message':    l.message,
            'alert_type': l.alert_type,
            'phoneNumber': l.phone_number,
            'status':     l.status,
            'sent_at':    l.created_at.strftime('%d-%b-%Y %H:%M') if l.created_at else '—',
        }
        for l in logs
    ])
