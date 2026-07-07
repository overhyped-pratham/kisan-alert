"""
ArogyaKrishi — Automatic Alert Scheduler
=========================================
Uses APScheduler to run background jobs that:
  1. Every 6 hours — check weather for every user's district and send SMS if risky
  2. Every day at 7:00 AM — send morning advisory to all users
  3. Manual trigger — any admin/user can fire an alert on demand via API
"""

import os
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

_scheduler = None   # singleton


# ─── Thresholds ──────────────────────────────────────────────────────────────

WEATHER_THRESHOLDS = {
    "rain_mm_danger":    20.0,   # > 20 mm → "Heavy rain" alert
    "rain_mm_warning":   8.0,    # > 8 mm  → "Moderate rain" advisory
    "temp_max_danger":   42.0,   # > 42°C  → Heat-wave alert
    "temp_min_danger":   5.0,    # < 5°C   → Cold-wave alert
    "wind_kmh_danger":   50.0,   # > 50 km/h → Strong wind alert
    "humidity_pct_high": 85.0,   # > 85%   → Disease risk advisory
}


# ─── Core alert logic ─────────────────────────────────────────────────────────

def _check_and_alert_user(app, user):
    """
    Fetch weather for the user's district and send an SMS if any threshold
    is breached.  Returns the message sent, or None if no alert was needed.
    """
    from services.weather_service import get_weather_data
    from services.sms_service import send_farmer_sms

    location = user.district or user.location or "India"
    weather = get_weather_data(location)
    if not weather:
        return None

    alerts = []
    t = WEATHER_THRESHOLDS

    rain  = weather.get("rainfall_mm",  0)
    tmax  = weather.get("temp_max",     25)
    tmin  = weather.get("temp_min",     15)
    wind  = weather.get("wind_kmh",     0)
    hum   = weather.get("humidity_pct", 50)
    desc  = weather.get("description",  "")

    if rain > t["rain_mm_danger"]:
        alerts.append(f"⛈️ भारी वर्षा ({rain:.1f} mm) — आज सिंचाई न करें, नाली साफ रखें।")
    elif rain > t["rain_mm_warning"]:
        alerts.append(f"🌧️ मध्यम वर्षा ({rain:.1f} mm) — खुली फसल को सुरक्षित करें।")

    if tmax > t["temp_max_danger"]:
        alerts.append(f"🔥 गर्मी की लहर ({tmax:.0f}°C) — सुबह जल्दी सिंचाई करें।")

    if tmin < t["temp_min_danger"]:
        alerts.append(f"❄️ शीत लहर ({tmin:.0f}°C) — फसल को रात में ढकें।")

    if wind > t["wind_kmh_danger"]:
        alerts.append(f"💨 तेज हवा ({wind:.0f} km/h) — फल-फूल वाली फसलें बांधें।")

    if hum > t["humidity_pct_high"] and rain < 5:
        alerts.append(f"💧 आर्द्रता अधिक ({hum:.0f}%) — फफूंद रोग का खतरा। फफूंदनाशक का छिड़काव करें।")

    if not alerts:
        return None   # No alert needed

    location_label = user.village or user.district or location
    message = (
        f"📍 {location_label} — मौसम चेतावनी\n"
        + "\n".join(alerts)
        + f"\n🕐 {datetime.now().strftime('%d-%b %H:%M')}"
    )

    send_farmer_sms(user, message, alert_type="auto_weather")
    return message


def run_weather_alerts(app):
    """
    Background job: check all users and send weather-based SMS alerts.
    Runs inside the Flask app context.
    """
    with app.app_context():
        from models.user import User
        users = User.query.filter(User.phone.isnot(None)).all()
        print(f"[AutoAlert] Checking weather for {len(users)} users…")
        sent = 0
        for user in users:
            try:
                msg = _check_and_alert_user(app, user)
                if msg:
                    sent += 1
            except Exception as e:
                print(f"[AutoAlert] Error for user {user.id}: {e}")
        print(f"[AutoAlert] Weather check done — {sent}/{len(users)} alerts sent.")


def run_morning_advisory(app):
    """
    Background job: send a daily morning advisory to all users at 7 AM.
    """
    with app.app_context():
        from models.user import User
        from services.sms_service import send_farmer_sms

        users = User.query.filter(User.phone.isnot(None)).all()
        print(f"[AutoAlert] Sending morning advisory to {len(users)} users…")
        today = datetime.now().strftime("%A, %d %B")
        for user in users:
            try:
                crop = getattr(user, 'crop_type', None) or "आपकी फसल"
                msg = (
                    f"🌅 सुप्रभात, {user.name}!\n"
                    f"📅 {today}\n"
                    f"🌾 {crop} की देखभाल के लिए आज ArogyaKrishi ऐप खोलें।\n"
                    f"💬 AI सहायक से कोई भी सवाल पूछें — नि:शुल्क!"
                )
                send_farmer_sms(user, msg, alert_type="auto_morning")
            except Exception as e:
                print(f"[AutoAlert] Morning advisory error for {user.id}: {e}")
        print(f"[AutoAlert] Morning advisory sent to {len(users)} users.")


# ─── Manual broadcast helper ──────────────────────────────────────────────────

def send_manual_alert(app, message, alert_type="manual", user_ids=None):
    """
    Send an SMS alert manually to all users, or to a specific list of user_ids.
    Returns (sent_count, fail_count, results_list).
    """
    with app.app_context():
        from models.user import User
        from services.sms_service import send_farmer_sms

        query = User.query.filter(User.phone.isnot(None))
        if user_ids:
            query = query.filter(User.id.in_(user_ids))
        users = query.all()

        results = []
        sent = fail = 0
        for user in users:
            try:
                ok, status = send_farmer_sms(user, message, alert_type=alert_type)
                results.append({"user": user.name, "phone": user.phone, "status": status})
                if ok:
                    sent += 1
                else:
                    fail += 1
            except Exception as e:
                results.append({"user": user.name, "phone": user.phone, "status": f"Error: {e}"})
                fail += 1

        return sent, fail, results


# ─── Scheduler lifecycle ──────────────────────────────────────────────────────

def start_scheduler(app):
    """
    Start the APScheduler background scheduler.
    Should be called once at app startup.
    """
    global _scheduler
    if _scheduler and _scheduler.running:
        return _scheduler

    _scheduler = BackgroundScheduler(timezone="Asia/Kolkata")

    # Job 1: Weather check every 6 hours
    _scheduler.add_job(
        func=run_weather_alerts,
        args=[app],
        trigger=IntervalTrigger(hours=6),
        id="weather_alerts",
        name="Auto Weather SMS Alerts",
        replace_existing=True,
        misfire_grace_time=300,
    )

    # Job 2: Morning advisory every day at 7:00 AM IST
    _scheduler.add_job(
        func=run_morning_advisory,
        args=[app],
        trigger=CronTrigger(hour=7, minute=0, timezone="Asia/Kolkata"),
        id="morning_advisory",
        name="Daily Morning Advisory SMS",
        replace_existing=True,
        misfire_grace_time=600,
    )

    _scheduler.start()
    print("[AutoAlert] Scheduler started — weather check every 6h, morning advisory at 7:00 AM IST.")
    return _scheduler


def get_scheduler():
    return _scheduler


def get_scheduled_jobs():
    """Return a summary of scheduled jobs for the API."""
    if not _scheduler:
        return []
    jobs = []
    for job in _scheduler.get_jobs():
        next_run = job.next_run_time
        jobs.append({
            "id":       job.id,
            "name":     job.name,
            "next_run": next_run.strftime("%d-%b-%Y %H:%M IST") if next_run else "—",
        })
    return jobs
