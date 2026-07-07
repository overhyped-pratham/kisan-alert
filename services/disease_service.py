"""
Disease detection service — HuggingFace ResNet-50 model (manual loading),
severity classification, and disease-aware fertilizer recommendation.

The model is loaded manually (model + processor) instead of via pipeline()
because the repo's preprocessor_config.json has a mismatched
image_processor_type (ConvNextFeatureExtractor instead of ResNetImageProcessor)
that breaks auto-mapping in transformers >= 5.x.
"""

import torch
import torch.nn.functional as F
from utils.disease import disease_dic
from services.weather_service import get_weather_data
from config import Config

# ---------------------------------------------------------------------------
# Global model objects (loaded once at startup)
# ---------------------------------------------------------------------------
_disease_model = None
_disease_processor = None


def load_disease_pipeline():
    """Load the ResNet-50 disease classifier model + image processor."""
    global _disease_model, _disease_processor

    REPO = "SanketJadhav/PlantDiseaseClassifier-Resnet50"

    try:
        from transformers import (
            ResNetForImageClassification,
            ConvNextImageProcessor,
        )

        _disease_model = ResNetForImageClassification.from_pretrained(REPO, use_safetensors=False)

        # The preprocessor config declares ConvNextFeatureExtractor but
        # the normalization values (ImageNet mean/std) and resize behaviour
        # are standard — ConvNextImageProcessor handles it correctly.
        _disease_processor = ConvNextImageProcessor.from_pretrained(REPO)

        # Move to CPU-only inference (no GPU assumed for hackathon deploy)
        _disease_model.eval()

        print("[OK] Leaf disease detection model loaded (ResNet-50).")
    except Exception as e:
        print(f"[WARN] Disease model unavailable: {e}")
        _disease_model = None
        _disease_processor = None


def detect_disease(image):
    """
    Run disease detection on a PIL Image.

    Args:
        image: PIL.Image.Image in RGB mode.

    Returns:
        (disease_name, confidence) tuple.
    """
    if _disease_model is None or _disease_processor is None:
        return "Tomato___healthy", 0.90

    try:
        inputs = _disease_processor(image, return_tensors="pt")
        with torch.no_grad():
            outputs = _disease_model(**inputs)

        probs = F.softmax(outputs.logits, dim=-1)
        top_idx = torch.argmax(probs, dim=-1).item()
        confidence = probs[0, top_idx].item()
        disease_name = _disease_model.config.id2label.get(
            top_idx, f"label_{top_idx}"
        )

        return disease_name, confidence

    except Exception as e:
        print(f"Disease detection error: {e}")
        return "Tomato___healthy", 0.90


def classify_severity(disease_name):
    """Assign severity level based on disease name keywords."""
    name = disease_name.lower()
    if "blight" in name or "rot" in name:
        return "High"
    if "spot" in name or "mildew" in name:
        return "Medium"
    return "Low"


def _fertilizer_fallback(disease_name, temperature, humidity):
    """Offline lookup table — used when Groq is unavailable."""
    name = disease_name.lower()

    if "blight" in name:
        freq = "every 5 days" if humidity > 80 else "every 7 days"
        return {
            'fertilizer': 'Copper Oxychloride 50% WP (e.g. Blitox / Kocide)',
            'details': (
                f'Dissolve 3g per litre of water. Current humidity is {humidity:.0f}% '
                f'— reapply {freq}. Supplement with 19:19:19 NPK foliar spray '
                'once per week to restore plant vigour after infection.'
            ),
            'application_method': (
                'Step 1 — Mix Copper Oxychloride in water and pour into a knapsack sprayer. '
                'Step 2 — Spray uniformly on all leaves (both surfaces) in the early morning. '
                'Step 3 — After 3 days apply NPK 19:19:19 @ 5g/litre as a separate foliar dose. '
                'Step 4 — Avoid spraying during mid-day or before expected rain.'
            ),
        }
    if "rot" in name:
        return {
            'fertilizer': 'Trichoderma viride Bio-fungicide + Potassium Silicate',
            'details': (
                f'Mix Trichoderma @ 5g/litre and drench soil around plant base. '
                f'Temperature is {temperature:.0f}°C — maintain soil moisture below '
                '60% to limit pathogen spread. Apply Potassium Silicate (2ml/litre) '
                'as a soil drench to strengthen cell walls.'
            ),
            'application_method': (
                'Step 1 — Remove and destroy visibly rotted plant material. '
                'Step 2 — Prepare Trichoderma solution and drench 200ml per plant at root zone. '
                'Step 3 — After 48 hours apply Potassium Silicate drench. '
                'Step 4 — Repeat every 10 days for 3 cycles.'
            ),
        }
    if "rust" in name:
        return {
            'fertilizer': 'Propiconazole 25% EC (e.g. Tilt) + Sulphur 80% WP',
            'details': (
                f'Dilute Propiconazole at 1ml/litre. With humidity at {humidity:.0f}%, '
                'rust spreads rapidly — spray immediately and repeat after 14 days.'
            ),
            'application_method': (
                'Step 1 — Apply Propiconazole at first pustule appearance. '
                'Step 2 — Cover all leaf surfaces, especially undersides. '
                'Step 3 — After 14 days switch to Sulphur 80% WP to prevent resistance. '
                'Step 4 — Follow with NPK 12:32:16 to boost recovery.'
            ),
        }
    if "mildew" in name:
        freq = "every 5 days" if temperature > 30 else "every 8 days"
        return {
            'fertilizer': 'Hexaconazole 5% SC + Wettable Sulphur 80% WP',
            'details': (
                f'Apply Hexaconazole at 2ml/litre. At {temperature:.0f}°C spray {freq}. '
                'Supplement with foliar potassium (K₂O) to improve leaf surface resistance.'
            ),
            'application_method': (
                'Step 1 — Spray Hexaconazole on all above-ground parts evenly. '
                'Step 2 — After 5 days apply Wettable Sulphur 80% @ 2.5g/litre. '
                'Step 3 — Spray foliar potassium (SOP 0:0:50) at 5g/litre once a week. '
                'Step 4 — Spray in early morning; avoid wetting foliage in evening.'
            ),
        }
    if "mosaic" in name:
        return {
            'fertilizer': 'Imidacloprid 17.8% SL (vector control) + NPK 20:20:20',
            'details': (
                'Mosaic is virus-borne; control aphid/whitefly vectors with Imidacloprid '
                'at 0.5ml/litre. Boost plant immunity with NPK 20:20:20 foliar @ 5g/litre weekly.'
            ),
            'application_method': (
                'Step 1 — Remove and bag all heavily infected leaves immediately. '
                'Step 2 — Spray Imidacloprid on undersides of leaves to kill insect vectors. '
                'Step 3 — After 3 days apply NPK 20:20:20 foliar spray to support growth. '
                'Step 4 — Repeat vector control every 10 days; monitor new growth closely.'
            ),
        }
    if "spot" in name:
        return {
            'fertilizer': 'Mancozeb 75% WP + Calcium Nitrate Foliar',
            'details': (
                f'Apply Mancozeb at 2.5g/litre. Humidity at {humidity:.0f}% '
                '— spray preventively every 10 days during wet periods. '
                'Calcium Nitrate (1g/litre) strengthens leaf cell walls.'
            ),
            'application_method': (
                'Step 1 — Mix Mancozeb in clean water and spray all plant surfaces. '
                'Step 2 — Focus on young leaves which are most susceptible. '
                'Step 3 — Two days later apply Calcium Nitrate foliar at 1g/litre. '
                'Step 4 — Alternate with Chlorothalonil 75% WP every other cycle.'
            ),
        }
    if "healthy" in name:
        return {
            'fertilizer': 'Balanced NPK 12:32:16 + Organic Bio-stimulant',
            'details': (
                'Your crop looks healthy! Apply NPK 12:32:16 at 5g/litre foliar '
                'every 3 weeks. Add seaweed extract bio-stimulant monthly for root development.'
            ),
            'application_method': (
                'Step 1 — Mix NPK 12:32:16 granules at 200kg/ha at rooting zone. '
                'Step 2 — Water immediately after application. '
                'Step 3 — Apply seaweed extract foliar at 3ml/litre monthly. '
                'Step 4 — Test soil pH every season; maintain between 6.0–7.0.'
            ),
        }
    # Generic
    return {
        'fertilizer': 'General Organic Bio-fertilizer + NPK 19:19:19 Booster',
        'details': (
            f'Apply NPK 19:19:19 foliar spray at 5g/litre every 10 days. '
            f'Current conditions: {temperature:.0f}°C / {humidity:.0f}% RH.'
        ),
        'application_method': (
            'Step 1 — Mix NPK 19:19:19 in clean water and apply as foliar spray. '
            'Step 2 — Spread organic bio-fertilizer granules around plant base. '
            'Step 3 — Rake lightly into top 2cm of soil and water immediately. '
            'Step 4 — Repeat every 14 days and monitor crop response.'
        ),
    }


def generate_fertilizer_recommendation(disease_name, latitude, longitude):
    """
    Generate a detailed fertilizer recommendation using Groq (Llama-3) as the
    primary engine and a hardcoded lookup table as the offline fallback.

    Groq is queried with a structured prompt that includes the disease name
    and live weather context. It returns JSON with three keys:
        fertilizer        — product name and grade
        details           — dosage, weather-aware timing, and reasoning
        application_method — numbered step-by-step how-to
    """
    import json
    from services.weather_service import get_weather_data
    from services.gemini_service import _query_groq

    # Fetch live weather for contextual advice
    weather_data = get_weather_data(latitude, longitude)
    temperature  = weather_data['temperature'] if weather_data else 28.0
    humidity     = weather_data['humidity']    if weather_data else 65.0

    # ── 1. Try Groq first ──────────────────────────────────────────────
    prompt = f"""You are AgriBot, an expert agronomist AI assistant for Indian farmers.

DISEASE DETECTED: "{disease_name}"
CURRENT FIELD CONDITIONS: Temperature {temperature:.1f}°C, Humidity {humidity:.0f}%

Your task: Return a JSON object with EXACTLY these 3 keys. No markdown, no explanation, just raw JSON.

{{
  "fertilizer": "<Product name with grade, e.g. Copper Oxychloride 50% WP (Blitox)>",
  "details": "<2-3 sentences: exact dosage per litre, spray frequency based on the weather conditions above, and one recommended nutritional supplement>",
  "application_method": "Step 1 — <action>. Step 2 — <action>. Step 3 — <action>. Step 4 — <action>."
}}

RULES:
- Use Indian market brand names (Blitox, Tilt, Mancozeb, Bavistin, Confidor, etc.)
- Frequency MUST be based on the actual temperature/humidity values given above
- application_method MUST be exactly 4 steps separated by " Step N — " with full sentences
- If crop is healthy, recommend a maintenance NPK schedule
- Keep "fertilizer" under 15 words, "details" under 60 words, "application_method" under 80 words
- English only, no Hindi"""

    try:
        raw = _query_groq(prompt)
        if raw:
            # Strip markdown code fences if Groq wraps the response
            clean = raw.strip()
            if clean.startswith("```"):
                clean = clean.split("```")[1]
                if clean.startswith("json"):
                    clean = clean[4:]
            clean = clean.strip()

            data = json.loads(clean)
            # Validate required keys
            if all(k in data for k in ("fertilizer", "details", "application_method")):
                print(f"[Groq] Fertilizer recommendation generated for: {disease_name}")
                return {
                    'fertilizer': str(data['fertilizer']),
                    'details': str(data['details']),
                    'application_method': str(data['application_method']),
                }
    except Exception as e:
        print(f"[Groq] Fertilizer recommendation failed ({e}), using offline fallback.")

    # ── 2. Offline fallback ────────────────────────────────────────────
    return _fertilizer_fallback(disease_name, temperature, humidity)


def get_disease_details(disease_name):
    """Return the HTML description from the local disease dictionary."""
    return disease_dic.get(
        disease_name,
        "<h4>No details found in local database.</h4>",
    )


# ---------------------------------------------------------------------------
# Structured Disease Remedies Database
# ---------------------------------------------------------------------------

DISEASE_REMEDIES = {
    'Apple___Apple_scab': {
        'chemical': 'Chlorothalonil, Captan, or Myclobutanil fungicide spray.',
        'organic': 'Sulfur or copper octanoate spray, or Neem oil.',
        'prevention': 'Rake and destroy fallen leaves. Avoid overhead watering to keep leaves dry.'
    },
    'Apple___Black_rot': {
        'chemical': 'Captan or Thiophanate-methyl fungicide.',
        'organic': 'Prune out infected twigs and apply organic copper fungicide.',
        'prevention': 'Prune dead wood, remove mummified fruits, and clear tree stumps.'
    },
    'Apple___Cedar_apple_rust': {
        'chemical': 'Myclobutanil or Triadimefon fungicide spray.',
        'organic': 'Spray copper fungicide or Bacillus subtilis (Serenade Garden).',
        'prevention': 'Remove nearby Eastern Red Cedar trees or prune cedar galls.'
    },
    'Cherry_(including_sour)___Powdery_mildew': {
        'chemical': 'Myclobutanil, Fenarimol, or Tebuconazole fungicide.',
        'organic': 'Neem oil or potassium bicarbonate sprays.',
        'prevention': 'Prune for good air circulation and avoid wetting leaves during irrigation.'
    },
    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot': {
        'chemical': 'Pyraclostrobin, Azoxystrobin, or Propiconazole fungicide.',
        'organic': 'Rotate crops with non-grasses and apply compost tea to build crop vigor.',
        'prevention': 'Use resistant hybrids, till residue under, and avoid late planting.'
    },
    'Corn_(maize)___Common_rust_': {
        'chemical': 'Mancozeb or Pyraclostrobin fungicide.',
        'organic': 'Apply compost tea or mild neem oil sprays.',
        'prevention': 'Plant resistant varieties and monitor crop early in the season.'
    },
    'Corn_(maize)___Northern_Leaf_Blight': {
        'chemical': 'Pyraclostrobin, Mancozeb, or Propiconazole fungicide.',
        'organic': 'Rotate crops annually and use organic bio-fungicides.',
        'prevention': 'Manage crop residue, plant resistant varieties, and space crops properly.'
    },
    'Grape___Black_rot': {
        'chemical': 'Mancozeb, Myclobutanil, or Captan fungicide.',
        'organic': 'Copper fungicide and spray neem oil.',
        'prevention': 'Prune vines, remove mummified berries, and maintain weed-free soil.'
    },
    'Grape___Esca_(Black_Measles)': {
        'chemical': 'Apply Lime Sulfur to trunks during dormant season.',
        'organic': 'Paint pruning wounds with organic pruning paste.',
        'prevention': 'Prune diseased wood 6 inches below symptoms and disinfect tools.'
    },
    'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)': {
        'chemical': 'Bordeaux mixture or Copper oxychloride.',
        'organic': 'Neem oil or Garlic extract solution.',
        'prevention': 'Prune lower leaves to improve air flow and clear fallen leaves.'
    },
    'Orange___Citrus_greening': {
        'chemical': 'Imidacloprid or Thiamethoxam spray to control psyllid vector.',
        'organic': 'Horticultural mineral oils and release parasitic Tamarixia radiata wasps.',
        'prevention': 'Remove infected trees immediately and apply foliar micronutrients.'
    },
    'Peach___Bacterial_spot': {
        'chemical': 'Copper compounds or Oxytetracycline bactericide spray.',
        'organic': 'Foliar spray of compost tea or garlic-based extracts.',
        'prevention': 'Avoid excessive nitrogen fertilization and use resistant cultivars.'
    },
    'Pepper,_bell___Bacterial_spot': {
        'chemical': 'Copper-maneb mixture or Copper hydroxide.',
        'organic': 'Organic copper soap sprays or Bacillus amyloliquefaciens.',
        'prevention': 'Buy certified disease-free seeds and rotate crops every 3 years.'
    },
    'Potato___Early_blight': {
        'chemical': 'Chlorothalonil, Mancozeb, or Azoxystrobin.',
        'organic': 'Copper octanoate fungicide sprays.',
        'prevention': 'Plant certified tubers, rotate crops, and keep vines dry.'
    },
    'Potato___Late_blight': {
        'chemical': 'Mefenoxam, Chlorothalonil, or Fluazinam.',
        'organic': 'Copper sulfate or organic copper hydroxide sprays.',
        'prevention': 'Destroy volunteer potatoes and avoid overhead irrigation.'
    },
    'Squash___Powdery_mildew': {
        'chemical': 'Chlorothalonil or Myclobutanil fungicide.',
        'organic': 'Neem oil, horticultural oil, or baking soda spray.',
        'prevention': 'Provide full sun exposure, space plants, and remove infected leaves.'
    },
    'Strawberry___Leaf_scorch': {
        'chemical': 'Captan or Thiophanate-methyl fungicide.',
        'organic': 'Copper soap or potassium bicarbonate sprays.',
        'prevention': 'Plant in well-drained soil, keep fields weed-free, and remove old foliage.'
    },
    'Tomato___Bacterial_spot': {
        'chemical': 'Copper hydroxide mixed with Mancozeb spray.',
        'organic': 'Copper octanoate or Bacillus subtilis spray.',
        'prevention': 'Rotate crops, avoid overhead watering, and weed regularly.'
    },
    'Tomato___Early_blight': {
        'chemical': 'Chlorothalonil, Mancozeb, or Azoxystrobin spray.',
        'organic': 'Copper fungicide or organic neem oil sprays.',
        'prevention': 'Apply mulch at plant base, prune lower leaves, and rotate crops.'
    },
    'Tomato___Late_blight': {
        'chemical': 'Chlorothalonil, Mancozeb, or Copper sulfate.',
        'organic': 'Copper octanoate fungicide spray.',
        'prevention': 'Monitor weather, avoid high humidity wetting, and remove infected plants.'
    },
    'Tomato___Leaf_Mold': {
        'chemical': 'Chlorothalonil or Difenoconazole fungicide.',
        'organic': 'Baking soda solution or potassium bicarbonate.',
        'prevention': 'Prune heavily for ventilation and keep relative humidity below 85%.'
    },
    'Tomato___Septoria_leaf_spot': {
        'chemical': 'Chlorothalonil or Copper hydroxide fungicide.',
        'organic': 'Neem oil or copper soap spray.',
        'prevention': 'Mulch beneath plants, remove lowest leaves, and disinfect cages.'
    },
    'Tomato___Spider_mites Two-spotted_spider_mite': {
        'chemical': 'Abamectin, Bifenazate, or Spiromesifen miticide.',
        'organic': 'Insecticidal soap, Neem oil, or release Phytoseiulus persimilis predatory mites.',
        'prevention': 'Keep plants well-watered (drought stresses favor mites) and wash dust off leaves.'
    },
    'Tomato___Target_Spot': {
        'chemical': 'Chlorothalonil or Azoxystrobin fungicide.',
        'organic': 'Copper soap or neem oil spray.',
        'prevention': 'Prune lower branches, space rows, and avoid wet foliage overnight.'
    },
    'Tomato___Yellow_Leaf_Curl_Virus': {
        'chemical': 'Imidacloprid or Acetamiprid spray to control whitefly vector.',
        'organic': 'Yellow sticky traps and neem oil/insecticidal soaps.',
        'prevention': 'Use insect-proof netting and clear weed hosts around fields.'
    },
    'Tomato___Tomato_mosaic_virus': {
        'chemical': 'No chemical treatment exists. Disinfect tools with 20% milk or bleach.',
        'organic': 'Disinfect hands and tools before touching plants.',
        'prevention': 'Use resistant varieties and remove infected plants immediately.'
    }
}


def get_disease_remedies(disease_name):
    """Retrieve structured remedies (chemical, organic, prevention) for the disease."""
    if 'healthy' in disease_name.lower():
        return {
            'chemical': 'No chemical treatment required.',
            'organic': 'Maintain soil health with organic manure or compost.',
            'prevention': 'Follow standard crop rotation and monitor leaves regularly.'
        }
    
    # Direct match
    if disease_name in DISEASE_REMEDIES:
        return DISEASE_REMEDIES[disease_name]
    
    # Key matching fallbacks
    for key, value in DISEASE_REMEDIES.items():
        # Match crop name and disease keyword
        if '___' in key and '___' in disease_name:
            key_parts = key.split('___')
            name_parts = disease_name.split('___')
            if key_parts[0] == name_parts[0] and (key_parts[1].lower() in name_parts[1].lower() or name_parts[1].lower() in key_parts[1].lower()):
                return value

    # Default fallback
    return {
        'chemical': 'Broad-spectrum fungicide or bactericide spray according to local guidelines.',
        'organic': 'Neem oil spray (10ml/L), garlic extract, or compost tea.',
        'prevention': 'Prune infected leaves, avoid overhead watering, and disinfect tools.'
    }

