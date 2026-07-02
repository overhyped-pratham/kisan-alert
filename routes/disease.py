"""
Disease blueprint — crop disease detection from leaf images.
"""

import io
import base64
from PIL import Image
from flask import Blueprint, render_template, request, redirect
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from extensions import db
from models.disease_log import DiseaseLog
from models.support_ticket import SupportTicket
from services.disease_service import (
    detect_disease,
    classify_severity,
    generate_fertilizer_recommendation,
    get_disease_details,
)

disease = Blueprint('disease', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Approximate lat/lon for major Indian agricultural districts
DISTRICT_COORDS = {
    'pune': (18.52, 73.85),
    'mumbai': (19.08, 72.88),
    'nashik': (19.99, 73.79),
    'nagpur': (21.15, 79.08),
    'ahmednagar': (19.08, 74.74),
    'aurangabad': (19.88, 75.32),
    'hyderabad': (17.39, 78.49),
    'jaipur': (26.91, 75.79),
    'delhi': (28.61, 77.21),
    'bangalore': (12.97, 77.59),
    'chennai': (13.08, 80.27),
    'kolkata': (22.57, 88.36),
    'lucknow': (26.85, 80.91),
    'bhopal': (23.26, 77.41),
    'indore': (22.72, 75.86),
    'patna': (25.60, 85.14),
    'bhubaneswar': (20.30, 85.82),
    'guwahati': (26.14, 91.74),
    'chandigarh': (30.73, 76.78),
    'dehradun': (30.32, 78.03),
    'raipur': (21.25, 81.62),
    'ranchi': (23.34, 85.31),
    'thiruvananthapuram': (8.52, 76.94),
    'coimbatore': (11.02, 76.96),
    'madurai': (9.93, 78.12),
    'visakhapatnam': (17.69, 83.29),
    'vijayawada': (16.51, 80.65),
    'guntur': (16.31, 80.44),
}


def _get_user_coords():
    """Return approximate (lat, lon) based on user's district."""
    district = (current_user.district or 'pune').lower().strip()
    return DISTRICT_COORDS.get(district, (19.07, 72.87))


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@disease.route('/disease-predict', methods=['GET', 'POST'])
@login_required
def disease_prediction():
    """Detect crop disease from uploaded leaf image."""
    title = 'Arogya Krishi - Disease Detection'

    if request.method == 'POST':
        if 'file' not in request.files:
            return render_template('disease.html', title=title, error='No file part in the request')

        file = request.files.get('file')
        voice_desc = request.form.get('voice_desc', '')
        expert_escalate = request.form.get('expert_escalate', 'false') == 'true'

        if not file or not allowed_file(file.filename):
            return render_template(
                'disease.html', title=title,
                error='Allowed file types are png, jpg, jpeg'
            )

        try:
            # Read and convert image to base64
            img_data = file.read()
            img = Image.open(io.BytesIO(img_data)).convert('RGB')
            buffered = io.BytesIO()
            img.save(buffered, format="PNG")
            img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

            # Detect disease
            disease_name, confidence = detect_disease(img)
            severity = classify_severity(disease_name)

            # Fertilizer recommendation — use user's district coordinates
            lat, lon = _get_user_coords()
            fertilizer_info = generate_fertilizer_recommendation(disease_name, lat, lon)

            # Local disease details
            disease_details = get_disease_details(disease_name)

            # Store in database
            log = DiseaseLog(
                user_id=current_user.id,
                image_base64=img_base64,
                disease=disease_name,
                severity=severity,
                confidence=confidence,
                treatment=fertilizer_info['fertilizer'],
                prevention="Wash gardening tools; apply mulching; avoid overhead watering.",
                organic_alternatives="Neem oil spray, compost tea, baking soda solution.",
                fertilizer=fertilizer_info['fertilizer'],
                voice_description=voice_desc,
            )
            db.session.add(log)
            db.session.commit()

            # Auto-escalate to support ticket if low confidence or manual request
            ticket_created = False
            ticket_id = None
            assigned_center = f"RSK-{current_user.district or 'Pune'}"

            if confidence < 0.65 or expert_escalate:
                ticket = SupportTicket(
                    user_id=current_user.id,
                    disease=disease_name,
                    image_base64=img_base64,
                    severity=severity,
                    priority="High" if severity == "High" else "Medium",
                    assigned_center=assigned_center,
                    status="Open",
                )
                db.session.add(ticket)
                db.session.commit()
                ticket_created = True
                ticket_id = ticket.id

            return render_template(
                'disease-result.html',
                prediction={'label': disease_name, 'score': confidence},
                fertilizer=fertilizer_info,
                image_base64=img_base64,
                severity=severity,
                details=disease_details,
                organic_alternatives="Neem oil spray (10ml/L) or Garlic extract solution.",
                ticket_created=ticket_created,
                ticket_id=ticket_id,
                assigned_center=assigned_center,
                title=title,
            )

        except Exception as e:
            # Log full error server-side; show generic message to user (no stack trace leakage)
            print(f"Error predicting disease: {e}")
            return render_template('disease.html', title=title, error='Could not analyze the image. Please try again with a clear, well-lit photo of the affected leaf.')

    return render_template('disease.html', title=title)
