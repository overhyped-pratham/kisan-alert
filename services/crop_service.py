"""
Crop recommendation service — ML model loading, prediction, and crop details.
"""

import os
import pickle
import numpy as np

from config import Config

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
base_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))

crop_recommendation_model_path = os.path.join(base_dir, 'model', 'DecisionTree.pkl')
rf_crop_recommendation_model_path = os.path.join(
    base_dir, 'model', 'crop_disease_prediction_model_using_numeric_values.pkl'
)

# ---------------------------------------------------------------------------
# Crop class label mapping (int / string -> crop name)
# ---------------------------------------------------------------------------
crop_class_label = {
    0: 'apple', 1: 'banana', 2: 'blackgram', 3: 'chickpea',
    4: 'coconut', 5: 'coffee', 6: 'cotton', 7: 'grapes',
    8: 'jute', 9: 'kidneybeans', 10: 'lentil', 11: 'maize',
    12: 'mango', 13: 'mothbeans', 14: 'mungbean', 15: 'muskmelon',
    16: 'orange', 17: 'papaya', 18: 'pigeonpeas', 19: 'pomegranate',
    20: 'rice', 21: 'watermelon',
    "0": 'apple', "1": 'banana', "2": 'blackgram', "3": 'chickpea',
    "4": 'coconut', "5": 'coffee', "6": 'cotton', "7": 'grapes',
    "8": 'jute', "9": 'kidneybeans', "10": 'lentil', "11": 'maize',
    "12": 'mango', "13": 'mothbeans', "14": 'mungbean', "15": 'muskmelon',
    "16": 'orange', "17": 'papaya', "18": 'pigeonpeas', "19": 'pomegranate',
    "20": 'rice', "21": 'watermelon',
}

# ---------------------------------------------------------------------------
# Predefined crop details (yield, profitability, water, fertilizer)
# ---------------------------------------------------------------------------
crop_details_db = {
    'rice': {
        'yield': '2.2 - 3.2 tons/acre',
        'profitability': 8.2,
        'water': 'High (1200-1500 mm)',
        'fertilizer': 'NPK in ratio 100:50:50 kg/ha. Apply Nitrogen in 3 splits: basal, tillering and panicle initiation.'
    },
    'maize': {
        'yield': '1.8 - 2.5 tons/acre',
        'profitability': 7.5,
        'water': 'Medium (500-800 mm)',
        'fertilizer': 'NPK 120:60:40 kg/ha. Zinc sulfate 25 kg/ha should be applied as basal.'
    },
    'cotton': {
        'yield': '0.8 - 1.2 tons/acre',
        'profitability': 8.5,
        'water': 'Medium (600-900 mm)',
        'fertilizer': 'NPK 80:40:40 kg/ha. Boron spray (0.1%) during flowering increases boll retention.'
    },
    'wheat': {
        'yield': '1.5 - 2.2 tons/acre',
        'profitability': 7.8,
        'water': 'Medium (450-650 mm)',
        'fertilizer': 'NPK 120:60:40 kg/ha. Apply irrigation at crown root initiation and flowering stages.'
    },
    'grapes': {
        'yield': '8.0 - 12.0 tons/acre',
        'profitability': 9.2,
        'water': 'Low-Medium (Drip)',
        'fertilizer': 'Apply Organic compost 20 tons/ha. Potassium sulfate improves berry quality and sugar index.'
    },
    'orange': {
        'yield': '6.0 - 8.0 tons/acre',
        'profitability': 8.9,
        'water': 'Medium',
        'fertilizer': 'Apply micronutrients (Zinc, Iron, Boron) annually along with NPK 600:300:600 g/tree.'
    },
    'mango': {
        'yield': '4.0 - 6.0 tons/acre',
        'profitability': 9.0,
        'water': 'Low',
        'fertilizer': 'Apply Nitrogen 1kg, P2O5 0.5kg, K2O 1kg per tree during post-harvest cleaning.'
    },
    'banana': {
        'yield': '15.0 - 20.0 tons/acre',
        'profitability': 8.8,
        'water': 'High',
        'fertilizer': 'NPK 300:100:300 g/plant. High Potassium is crucial for finger development.'
    },
    'pomegranate': {
        'yield': '4.0 - 5.5 tons/acre',
        'profitability': 9.4,
        'water': 'Low (Drip)',
        'fertilizer': 'Soluble fertilizers through fertigation: NPK 100:50:50 kg/acre per crop season.'
    },
    'jute': {
        'yield': '1.0 - 1.5 tons/acre',
        'profitability': 6.8,
        'water': 'High',
        'fertilizer': 'NPK 40:20:20 kg/ha. Top dress Nitrogen 3-4 weeks after sowing.'
    },
}


def get_crop_details_fallback(crop_name):
    """Return crop details dict, with a generic fallback for unknown crops."""
    return crop_details_db.get(
        crop_name.lower(),
        {
            'yield': '1.5 - 2.5 tons/acre',
            'profitability': 7.0,
            'water': 'Medium (500-800 mm)',
            'fertilizer': 'Apply generic organic NPK fertilizer (ratio 12:12:12) according to local soil health guidelines.'
        },
    )


# ---------------------------------------------------------------------------
# Model loading (called once at app startup)
# ---------------------------------------------------------------------------
crop_recommendation_model = None
rf_crop_recommendation_model = None


def load_crop_models():
    """Load pickle-based crop recommendation models. Call once at startup."""
    global crop_recommendation_model, rf_crop_recommendation_model

    # Logistic Regression / Decision Tree model
    try:
        with open(crop_recommendation_model_path, 'rb') as f:
            crop_recommendation_model = pickle.load(f)
        print("[OK] Logistic Regression crop model loaded.")
    except Exception as e:
        print(f"[WARN] Failed to load LR crop model: {e}")

    # Random Forest model (patched for scikit-learn compatibility)
    try:
        with open(rf_crop_recommendation_model_path, 'rb') as f:
            rf_crop_recommendation_model = pickle.load(f)
        rf_crop_recommendation_model.monotonic_cst = None
        if hasattr(rf_crop_recommendation_model, "estimators_"):
            for est in rf_crop_recommendation_model.estimators_:
                est.monotonic_cst = None
        print("[OK] Random Forest crop model loaded and patched.")
    except Exception as e:
        print(f"[WARN] Failed to load RF crop model: {e}")


def predict_crop(features, model_type='random_forest'):
    """
    Predict a crop from numeric features [N, P, K, temp, humidity, pH, rainfall].

    Returns (crop_name, confidence, model_name).
    """
    predicted_crop = 'rice'
    confidence = 0.85
    used_model_name = 'Random Forest Classifier'

    arr = np.array([features])

    if model_type == 'random_forest' and rf_crop_recommendation_model is not None:
        try:
            prediction = rf_crop_recommendation_model.predict(arr)
            predicted_crop_id = prediction[0]
            predicted_crop = crop_class_label.get(predicted_crop_id, 'rice')
            used_model_name = 'Random Forest Classifier'
            if hasattr(rf_crop_recommendation_model, "predict_proba"):
                probs = rf_crop_recommendation_model.predict_proba(arr)
                confidence = float(np.max(probs))
        except Exception as e:
            print(f"RF prediction error: {e}")
            model_type = 'logistic_regression'

    if model_type == 'logistic_regression' or rf_crop_recommendation_model is None:
        if crop_recommendation_model is not None:
            try:
                prediction = crop_recommendation_model.predict(arr)
                predicted_crop = str(prediction[0])
                used_model_name = 'Logistic Regression Classifier'
                if hasattr(crop_recommendation_model, "predict_proba"):
                    probs = crop_recommendation_model.predict_proba(arr)
                    confidence = float(np.max(probs))
            except Exception as e:
                print(f"LR prediction error: {e}")

    return predicted_crop, confidence, used_model_name
