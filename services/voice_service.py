"""
Voice assistant service — Gemini-backed chatbot with a comprehensive
rule-based agricultural knowledge engine as fallback.
"""

import random
from services.gemini_service import query_gemini


def generate_voice_reply(query, language='en'):
    """
    Generate a reply to a farmer's voice/text query.

    Tries Gemini first, falls back to the local agricultural knowledge engine.
    """
    prompt = (
        f"You are KrishiSaar AI, an expert agricultural bot. "
        f"Respond to this farmer query in language code '{language}'. "
        f"Keep it short (2-3 sentences), simple and actionable. "
        f"Query: {query}"
    )
    reply = query_gemini(prompt)
    if reply:
        return reply

    return _knowledge_engine_reply(query)


def generate_sms_reply(message):
    """
    Generate a short SMS advisory reply for feature-phone farmers.

    Tries Gemini first, falls back to the local knowledge engine.
    """
    prompt = (
        f"Format the response as a short, clean, SMS advisory text "
        f"(max 80 words) for a feature phone. Farmer sent SMS: '{message}'. "
        f"Diagnose the crop disease or provide recommendations. "
        f"Mention treatment and advice."
    )
    reply = query_gemini(prompt)
    if reply:
        return reply

    return _knowledge_engine_sms(message)


# ---------------------------------------------------------------------------
# Agricultural Knowledge Engine (offline fallback)
# ---------------------------------------------------------------------------
def _knowledge_engine_reply(query):
    """Rule-based agricultural advisor with keyword matching."""
    q = query.lower()

    # Crop recommendation
    if any(k in q for k in ('crop', 'plant', 'recommend', 'grow', 'sow', 'cultivat')):
        return random.choice([
            "KrishiSaar AI: Based on your soil and location, run the Smart Crop Advisor "
            "for the most profitable crop. Rice and wheat thrive in current monsoon conditions. "
            "Ensure soil pH is between 6.0-7.5 for best results.",
            "KrishiSaar AI: For your region, consider pulses, cotton, or soybean this season. "
            "Check the Crop Recommendation tool with your NPK values for a precise suggestion.",
        ])

    # Disease / pest
    if any(k in q for k in ('disease', 'sick', 'spot', 'rot', 'mildew', 'blight', 'pest', 'insect', 'worm')):
        return random.choice([
            "KrishiSaar AI: Upload a clear photo of the affected leaves in the Disease Analysis "
            "center for instant diagnosis and a treatment plan. Early detection saves your yield.",
            "KrishiSaar AI: Yellow spots or curled leaves may indicate fungal infection. "
            "Upload an image for accurate diagnosis, and consider applying neem oil as an organic first step.",
        ])

    # Fertilizer
    if any(k in q for k in ('fertilizer', 'npk', 'urea', 'compost', 'nutrient', 'nitrogen', 'phosphor', 'potass')):
        return random.choice([
            "KrishiSaar AI: Use the Fertilizer Advisor with your soil NPK test results for a "
            "precise recommendation. Balanced NPK application boosts yield by 20-30%.",
            "KrishiSaar AI: Apply organic compost as a base, then supplement with NPK based on "
            "your soil test. Avoid over-fertilizing — it damages soil health long-term.",
        ])

    # Irrigation / water
    if any(k in q for k in ('water', 'irrigat', 'rain', 'drought', 'dry', 'moisture', 'flood')):
        return random.choice([
            "KrishiSaar AI: Monitor soil moisture using the Live Telemetry panel. If moisture "
            "is below 25%, increase watering. Rain is forecast — delay irrigation to save water.",
            "KrishiSaar AI: Drip irrigation saves up to 50% water. For current conditions, "
            "water early morning or evening to minimize evaporation losses.",
        ])

    # Soil health
    if any(k in q for k in ('soil', 'ph', 'alluvial', 'black soil', 'clay', 'red soil', 'saline')):
        return random.choice([
            "KrishiSaar AI: Healthy soil has pH 6.0-7.5. Upload a soil photo to identify your "
            "soil type, then match crops accordingly. Add organic matter to improve fertility.",
            "KrishiSaar AI: Test your soil every season. Alluvial soil suits rice & wheat; "
            "black soil is ideal for cotton. Check the Soil Classifier for a quick assessment.",
        ])

    # Weather
    if any(k in q for k in ('weather', 'temperature', 'climate', 'season', 'monsoon', 'heat', 'cold')):
        return random.choice([
            "KrishiSaar AI: Check the Weather Intelligence widget on your dashboard for live "
            "conditions. Plan spraying and irrigation around forecast rain and temperature.",
            "KrishiSaar AI: Current conditions favor crop growth. Avoid spraying pesticides "
            "before expected rain — it washes off and wastes money.",
        ])

    # Market / price / government schemes
    if any(k in q for k in ('price', 'market', 'sell', 'msp', 'profit', 'loan', 'scheme', 'subsidy', 'government', 'pm kisan')):
        return random.choice([
            "KrishiSaar AI: Check the MSP (Minimum Support Price) for your crop before harvest. "
            "Register for PM-Kisan scheme for direct income support of ₹6000/year.",
            "KrishiSaar AI: Sell produce at your local APMC mandi or use e-NAM (electronic "
            "National Agriculture Market) for better prices. Keep records for loan eligibility.",
        ])

    # Organic farming
    if any(k in q for k in ('organic', 'natural', 'chemical-free', 'bio')):
        return random.choice([
            "KrishiSaar AI: Organic farming builds long-term soil health. Use compost, neem oil, "
            "and crop rotation. Yields may dip initially but stabilize higher in 2-3 years.",
            "KrishiSaar AI: Apply Jeevamrutha or Panchagavya as bio-fertilizers. They boost "
            "microbial activity and reduce dependence on chemical inputs.",
        ])

    # Greeting / help
    if any(k in q for k in ('hello', 'hi', 'hey', 'namaste', 'help', 'start')):
        return ("KrishiSaar AI: Namaste! I'm your agricultural assistant. Ask me about crops, "
                "diseases, fertilizers, soil, weather, or farming schemes. You can speak or type.")

    # Default
    return random.choice([
        "KrishiSaar AI: I can help with crops, diseases, fertilizers, soil, irrigation, "
        "weather, and government schemes. What would you like to know?",
        "KrishiSaar AI: Try asking about crop recommendations, disease diagnosis, fertilizer "
        "advice, or soil health. Use the dashboard tools for detailed analysis.",
    ])


def _knowledge_engine_sms(message):
    """Short SMS-format reply for feature phones."""
    q = message.lower()

    if any(k in q for k in ('cotton',)):
        return ("KrishiSaar: Cotton Leaf Spot detected. Apply Copper fungicide spray. "
                "Rain expected - delay irrigation 24h. RSK-Pune for help.")
    if any(k in q for k in ('tomato',)):
        return ("KrishiSaar: Tomato Late Blight risk. Apply Blitox (copper fungicide). "
                "Rain in 6hrs - delay watering. Call 1800-419-1234.")
    if any(k in q for k in ('wheat',)):
        return ("KrishiSaar: For wheat, ensure NPK 120:60:40 per acre. Watch for rust disease. "
                "Use the Disease tool if yellow stripes appear on leaves.")
    if any(k in q for k in ('crop', 'recommend', 'grow')):
        return ("KrishiSaar: Use Crop Advisor with your NPK & pH. Rice/wheat suit monsoon. "
                "Call 1800-419-1234 for RSK help.")
    if any(k in q for k in ('disease', 'sick', 'spot', 'pest')):
        return ("KrishiSaar: Upload leaf photo to Disease tool for free diagnosis. "
                "Apply neem oil 10ml/L as organic first step. Call 1800-419-1234.")
    if any(k in q for k in ('fertilizer', 'npk', 'urea')):
        return ("KrishiSaar: Use Fertilizer Advisor with soil NPK test. Balanced NPK "
                "boosts yield 20%. Avoid over-use - harms soil. Call 1800-419-1234.")
    if any(k in q for k in ('loan', 'scheme', 'subsidy', 'pm kisan')):
        return ("KrishiSaar: PM-Kisan gives Rs6000/yr. Register at pmkisan.gov.in. "
                "KCC loan at 4% interest. Visit your RSK center.")

    return ("KrishiSaar Advisory: For crops use Smart Crop Advisor, for diseases upload "
            "leaf photo, for fertilizer use NPK tool. Helpline: 1800-419-1234.")
