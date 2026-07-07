import os
import re
import requests
from models.sms_log import SmsLog
from extensions import db


def normalize_phone(phone):
    """Return (digits_only, e164) for an Indian mobile number, or (None, None) if invalid."""
    if not phone:
        return None, None

    phone_clean = re.sub(r'\D', '', str(phone))
    if len(phone_clean) == 10:
        return phone_clean, "+91" + phone_clean
    if len(phone_clean) == 12 and phone_clean.startswith("91"):
        return phone_clean[2:], "+" + phone_clean
    if len(phone_clean) == 11 and phone_clean.startswith("0"):
        local = phone_clean[1:]
        return local, "+91" + local
    if phone_clean:
        return phone_clean, "+" + phone_clean
    return None, None


def _status_for_db(status):
    """Store a concise status label (sms_log.status is VARCHAR(50))."""
    if status.startswith("Sent"):
        return status[:50]
    if status == "Simulated":
        return status
    if status.startswith("Failed"):
        return "Failed (Twilio)" if os.environ.get("TWILIO_ACCOUNT_SID") else "Failed"
    return status[:50]


def send_farmer_sms(user, message, alert_type="custom", phone=None):
    """
    Sends an SMS alert via Twilio to `phone` or the user's saved number.
    Falls back to simulation mode if Twilio credentials are not configured.
    """
    phone_raw = (phone or user.phone or "").strip()
    phone_clean, phone_e164 = normalize_phone(phone_raw)
    if not phone_clean:
        print(f"[SMS WARNING] User {user.name} has no valid phone number. Cannot send SMS.")
        return False, "No phone number"

    account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    auth_token  = os.environ.get("TWILIO_AUTH_TOKEN")
    from_number = os.environ.get("TWILIO_FROM_NUMBER")

    status = "Simulated"

    if account_sid and auth_token and from_number:
        try:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
            resp = requests.post(
                url,
                auth=(account_sid, auth_token),
                data={
                    "From": from_number,
                    "To":   phone_e164,
                    "Body": f"ArogyaKrishi Alert 🌾\n{message}\n- KrishiSaar AI"
                },
                timeout=10
            )
            res_json = resp.json()

            if resp.status_code in (200, 201) and res_json.get("sid"):
                status = "Sent (Twilio)"
                print(f"[SMS SUCCESS] Twilio sent to {phone_e164} ({user.name}) | SID: {res_json['sid']}")
            else:
                error = res_json.get("message", resp.text)
                status = f"Failed ({error})"
                print(f"[SMS ERROR] Twilio: {error}")

        except Exception as e:
            status = "Failed (Network Error)"
            print(f"[SMS EXCEPTION] {e}")
    else:
        # Simulation mode
        print(f"\n==================================================")
        print(f"[SMS SIMULATION] To: {phone_e164} ({user.name})")
        print(f"Message: {message}")
        print(f"==================================================\n")

    # Always log to database (status column is VARCHAR(50))
    log = SmsLog(
        user_id=user.id,
        phone_number=phone_clean,
        message=message,
        alert_type=alert_type,
        status=_status_for_db(status)
    )
    db.session.add(log)
    db.session.commit()

    return status.startswith("Sent"), status
