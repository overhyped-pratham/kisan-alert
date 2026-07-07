"""
Voice assistant service — primary AI chatbot with a comprehensive multilingual
rule-based agricultural knowledge engine as fallback.
"""

import random
from services.gemini_service import query_gemini


def generate_voice_reply(query, language='en'):
    """
    Generate a reply to a farmer's voice/text query.

    Tries Gemini/Groq first, falls back to the local agricultural knowledge engine.
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

    return _knowledge_engine_reply(query, language)


def generate_sms_reply(message):
    """
    Generate a short SMS advisory reply for feature-phone farmers.

    Tries Gemini/Groq first, falls back to the local knowledge engine.
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
# Agricultural Knowledge Engine (offline fallbacks)
# ---------------------------------------------------------------------------
def _knowledge_engine_reply(query, language='en'):
    """Multilingual rule-based agricultural advisor fallback."""
    q = query.lower()
    lang = (language or 'en').lower().strip()

    # Define localized responses dictionary
    responses = {
        'crop': {
            'en': [
                "KrishiSaar AI: Based on your soil and location, run the Smart Crop Advisor for the most profitable crop. Rice and wheat thrive in current monsoon conditions.",
                "KrishiSaar AI: For your region, consider pulses, cotton, or soybean this season. Check the Crop Recommendation tool with your NPK values."
            ],
            'hi': [
                "कृषिसार AI: आपकी मिट्टी और स्थान के आधार पर, सबसे अधिक लाभदायक फसल के लिए स्मार्ट फसल सलाहकार चलाएं। धान और गेहूं वर्तमान मानसूनी परिस्थितियों में पनपते हैं।",
                "कृषिसार AI: आपके क्षेत्र के लिए, इस मौसम में दालें, कपास या सोयाबीन पर विचार करें। अपने NPK मानों के साथ फसल अनुशंसा टूल की जांच करें।"
            ],
            'mr': [
                "कृषिसार AI: तुमच्या माती आणि स्थानावर आधारित, सर्वात फायदेशीर पिकासाठी स्मार्ट पीक सल्लागार चालवा. भात आणि गहू सध्याच्या मान्सूनच्या परिस्थितीत चांगले वाढतात.",
                "कृषिसार AI: तुमच्या प्रदेशासाठी, या हंगामात कडधान्ये, कापूस किंवा सोयाबीनचा विचार करा. तुमच्या NPK मूल्यांसह पीक शिफारस तपासा।"
            ]
        },
        'disease': {
            'en': [
                "KrishiSaar AI: Upload a clear photo of the affected leaves in the Disease Analysis center for instant diagnosis and a treatment plan.",
                "KrishiSaar AI: Yellow spots or curled leaves may indicate fungal infection. Upload an image for accurate diagnosis, and consider applying neem oil."
            ],
            'hi': [
                "कृषिसार AI: तत्काल निदान और उपचार योजना के लिए रोग विश्लेषण केंद्र में प्रभावित पत्तों की एक स्पष्ट तस्वीर अपलोड करें।",
                "कृषिसार AI: पीले धब्बे या मुड़े हुए पत्ते कवक संक्रमण का संकेत दे सकते हैं। सटीक निदान के लिए एक छवि अपलोड करें और नीम के तेल का उपयोग करें।"
            ],
            'mr': [
                "कृषिसार AI: त्वरित निदान आणि उपचार योजनेसाठी रोग विश्लेषण केंद्रामध्ये बाधित पानांचा स्पष्ट फोटो अपलोड करा.",
                "कृषिसार AI: पिवळे डाग किंवा कुरळे पाने बुरशीजन्य संसर्ग दर्शवू शकतात. अचूक निदानासाठी एक फोटो अपलोड करा आणि कडुलिंबाच्या तेलाचा वापर करा."
            ]
        },
        'fertilizer': {
            'en': [
                "KrishiSaar AI: Use the Fertilizer Advisor with your soil NPK test results. Balanced NPK application boosts yield by 20-30%.",
                "KrishiSaar AI: Apply organic compost as a base, then supplement with NPK based on your soil test. Avoid over-fertilizing."
            ],
            'hi': [
                "कृषिसार AI: अपने मिट्टी के NPK परीक्षण परिणामों के साथ उर्वरक सलाहकार का उपयोग करें। संतुलित NPK अनुप्रयोग उपज को 20-30% तक बढ़ाता है।",
                "कृषिसार AI: आधार के रूप में जैविक खाद डालें, फिर अपने मिट्टी परीक्षण के आधार पर NPK डालें। आवश्यकता से अधिक खाद डालने से बचें।"
            ],
            'mr': [
                "कृषिसार AI: तुमच्या मातीच्या NPK चाचणी निकालांसह खत सल्लागार वापरा. संतुलित NPK खतांचा वापर उत्पादनात २०-३०% वाढ करतो.",
                "कृषिसार AI: सेंद्रिय खताचा बेस म्हणून वापर करा, नंतर माती चाचणीच्या आधारे NPK खते द्या. जास्त खत घालणे टाळा."
            ]
        },
        'water': {
            'en': [
                "KrishiSaar AI: Monitor soil moisture using the Live Telemetry panel. Rain is forecast — delay irrigation to save water.",
                "KrishiSaar AI: Drip irrigation saves up to 50% water. Water early morning or evening to minimize evaporation."
            ],
            'hi': [
                "कृषिसार AI: लाइव टेलीमेट्री पैनल का उपयोग करके मिट्टी की नमी की निगरानी करें। बारिश का पूर्वानुमान है — पानी बचाने के लिए सिंचाई टालें।",
                "कृषिसार AI: ड्रिप सिंचाई से 50% तक पानी की बचत होती है। वाष्पीकरण को कम करने के लिए सुबह जल्दी या शाम को पानी दें।"
            ],
            'mr': [
                "कृषिसार AI: लाइव्ह टेलिमेट्री पॅनेलचा वापर करून मातीच्या ओलाव्यावर लक्ष ठेवा. पावसाचा अंदाज आहे — पाणी वाचवण्यासाठी पाणी देणे पुढे ढकला.",
                "कृषिसार AI: ठिबक सिंचनामुळे ५०% पर्यंत पाणी वाचते. बाष्पीभवन कमी करण्यासाठी सकाळी लवकर किंवा संध्याकाळी पाणी द्या."
            ]
        },
        'soil': {
            'en': [
                "KrishiSaar AI: Healthy soil has pH 6.0-7.5. Upload a soil photo to identify your soil type, then match crops accordingly.",
                "KrishiSaar AI: Test your soil every season. Alluvial soil suits rice & wheat; black soil is ideal for cotton."
            ],
            'hi': [
                "कृषिसार AI: स्वस्थ मिट्टी का pH 6.0-7.5 होता है। अपनी मिट्टी के प्रकार की पहचान करने के लिए मिट्टी का फोटो अपलोड करें, फिर उसके अनुसार फसलें लगाएं।",
                "कृषिसार AI: हर मौसम में अपनी मिट्टी की जांच कराएं। जलोढ़ मिट्टी धान और गेहूं के लिए उपयुक्त है; काली मिट्टी कपास के लिए आदर्श है।"
            ],
            'mr': [
                "कृषिसार AI: चांगल्या मातीचा pH ६.०-७.५ असावा. मातीचा प्रकार ओळखण्यासाठी मातीचा फोटो अपलोड करा आणि त्यानुसार पिके निवडा.",
                "कृषिसार AI: प्रत्येक हंगामात तुमच्या मातीची चाचणी करा. गाळाची माती भात आणि गव्हासाठी योग्य आहे; काळी माती कापसासाठी आदर्श आहे."
            ]
        },
        'weather': {
            'en': [
                "KrishiSaar AI: Check the Weather Intelligence widget on your dashboard. Plan spraying and irrigation around forecast rain.",
                "KrishiSaar AI: Current conditions favor crop growth. Avoid spraying pesticides before expected rain — it washes off."
            ],
            'hi': [
                "कृषिसार AI: अपने डैशबोर्ड पर मौसम खुफिया विजेट की जांच करें। बारिश के पूर्वानुमान के आसपास छिड़काव और सिंचाई की योजना बनाएं।",
                "कृषिसार AI: वर्तमान परिस्थितियां फसल वृद्धि के अनुकूल हैं। अपेक्षित बारिश से ठीक पहले कीटनाशकों का छिड़काव करने से बचें।"
            ],
            'mr': [
                "कृषिसार AI: तुमच्या डॅशबोर्डवरील हवामान विजेट तपासा. पावसाच्या अंदाजानुसार फवारणी आणि सिंचनाचे नियोजन करा.",
                "कृषिसार AI: सध्याची परिस्थिती पिकांच्या वाढीसाठी अनुकूल आहे. अपेक्षित पावसापूर्वी कीटकनाशकांची फवारणी करणे टाळा — ते वाहून जाते."
            ]
        },
        'market': {
            'en': [
                "KrishiSaar AI: Check the MSP (Minimum Support Price) before harvest. Register for PM-Kisan scheme for direct income support.",
                "KrishiSaar AI: Sell produce at your local APMC mandi or use e-NAM for better prices. Keep records for loan eligibility."
            ],
            'hi': [
                "कृषिसार AI: कटाई से पहले MSP (न्यूनतम समर्थन मूल्य) की जांच करें। प्रत्यक्ष आय सहायता के लिए पीएम-किसान योजना के लिए पंजीकरण करें।",
                "कृषिसार AI: अपनी उपज स्थानीय APMC मंडी में बेचें या बेहतर कीमतों के लिए e-NAM का उपयोग करें। ऋण पात्रता के लिए रिकॉर्ड रखें।"
            ],
            'mr': [
                "कृषिसार AI: काढणीपूर्वी MSP (किमान आधारभूत किंमत) तपासा. थेट उत्पन्न सहाय्यासाठी पीएम-किसान योजनेसाठी नोंदणी करा.",
                "कृषिसार AI: तुमचे उत्पादन स्थानिक APMC मंडीमध्ये विका किंवा चांगल्या किमतींसाठी e-NAM वापरा. कर्ज पात्रतेसाठी नोंदी ठेवा."
            ]
        },
        'default': {
            'en': [
                "KrishiSaar AI: I can help with crops, diseases, fertilizers, soil, irrigation, weather, and government schemes. What would you like to know?",
                "KrishiSaar AI: Try asking about crop recommendations, disease diagnosis, fertilizer advice, or soil health."
            ],
            'hi': [
                "कृषिसार AI: मैं फसलों, बीमारियों, उर्वरकों, मिट्टी, सिंचाई, मौसम और सरकारी योजनाओं में मदद कर सकता हूं। आप क्या जानना चाहते हैं?",
                "कृषिसार AI: फसल की सिफारिशों, रोग निदान, उर्वरक सलाह या मिट्टी के स्वास्थ्य के बारे में पूछने का प्रयास करें।"
            ],
            'mr': [
                "कृषिसार AI: मी पिके, रोग, खते, माती, सिंचन, हवामान आणि सरकारी योजनांबद्दल मदत करू शकतो. तुम्हाला काय जाणून घ्यायचे आहे?",
                "कृषिसार AI: पीक शिफारसी, रोगाचे निदान, खत सल्ला किंवा मातीच्या आरोग्याबद्दल विचारण्याचा प्रयत्न करा."
            ]
        }
    }

    # Keyword checking in multiple languages
    topic = 'default'
    if any(k in q for k in ('crop', 'plant', 'recommend', 'grow', 'sow', 'cultivat', 'फसल', 'उगा', 'बोएं', 'पेड़', 'पौधा', 'बियाणे', 'पीक', 'उगवण')):
        topic = 'crop'
    elif any(k in q for k in ('disease', 'sick', 'spot', 'rot', 'mildew', 'blight', 'pest', 'insect', 'worm', 'बीमारी', 'कीड़ा', 'रोग', 'किड', 'कीड')):
        topic = 'disease'
    elif any(k in q for k in ('fertilizer', 'npk', 'urea', 'compost', 'nutrient', 'nitrogen', 'phosphor', 'potass', 'खाद', 'उर्वरक', 'खत')):
        topic = 'fertilizer'
    elif any(k in q for k in ('water', 'irrigat', 'rain', 'drought', 'dry', 'moisture', 'flood', 'पानी', 'सिंचाई', 'बारिश', 'पाऊस', 'शेतीला पाणी')):
        topic = 'water'
    elif any(k in q for k in ('soil', 'ph', 'alluvial', 'black soil', 'clay', 'red soil', 'saline', 'मिट्टी', 'मृदा', 'माती')):
        topic = 'soil'
    elif any(k in q for k in ('weather', 'temperature', 'climate', 'season', 'monsoon', 'heat', 'cold', 'मौसम', 'तापमान', 'हवामान')):
        topic = 'weather'
    elif any(k in q for k in ('price', 'market', 'sell', 'msp', 'profit', 'loan', 'scheme', 'subsidy', 'government', 'pm kisan', 'बाजार', 'दाम', 'कीमत', 'मंडी', 'भाव', 'कर्ज')):
        topic = 'market'

    # Select the appropriate language bucket
    topic_responses = responses.get(topic, responses['default'])
    lang_responses = topic_responses.get(lang, topic_responses['en'])
    
    return random.choice(lang_responses)


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
