"""
Fertilizer blueprint — fertilizer recommendation routes.
"""

from flask import Blueprint, render_template, request
from services.fertilizer_service import recommend_fertilizer

fertilizer = Blueprint('fertilizer', __name__)


@fertilizer.route('/fertilizer')
def fertilizer_page():
    """Fertilizer recommendation form page."""
    return render_template('fertilizer.html', title='Arogya Krishi - Fertilizer Suggestion')


@fertilizer.route('/fertilizer-predict', methods=['POST'])
def fertilizer_predict():
    """Process fertilizer recommendation from NPK values + crop."""
    title = 'Arogya Krishi - Fertilizer Suggestion'

    try:
        crop_name = str(request.form.get('cropname', ''))
        nitrogen = int(request.form.get('nitrogen', 50))
        phosphorous = int(request.form.get('phosphorous', 50))
        potassium = int(request.form.get('potassium', 50))
    except (ValueError, TypeError):
        return render_template(
            'try_again.html', title=title,
            error_message="Invalid input values. Please enter valid numbers for NPK levels."
        )

    recommendation = recommend_fertilizer(crop_name, nitrogen, phosphorous, potassium)
    if recommendation is None:
        return render_template(
            'try_again.html', title=title,
            error_message="Could not analyze fertilizer recommendation."
        )

    return render_template('fertilizer-result.html', recommendation=recommendation, title=title)
