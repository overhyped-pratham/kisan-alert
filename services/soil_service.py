"""
Soil type classification service — SoilNet (Keras 3 + JAX backend).

Loads the pre-trained SoilNet model from arpitsharrrma/soil-type-classifier
using Keras 3 with the JAX backend (no TensorFlow required). Falls back to
a PIL-based RGB heuristic when the model is unavailable.

Model details:
  - Input:  224x224 RGB image, normalized to [0, 1]
  - Output: 4 classes — Alluvial, Black, Clay, Red
  - Source: https://huggingface.co/arpitsharrrma/soil-type-classifier
"""

import os
import numpy as np
from PIL import Image

# Set JAX backend BEFORE importing keras (must happen at module load)
os.environ.setdefault("KERAS_BACKEND", "jax")

base_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
soilnet_path = os.path.join(base_dir, 'model', 'soilnet_hf', 'SoilNet.keras')

# ---------------------------------------------------------------------------
# Global model object (loaded once at startup)
# ---------------------------------------------------------------------------
_soil_model = None


def load_soil_models():
    """Load the SoilNet Keras model with JAX backend. Call once at startup."""
    global _soil_model

    if not os.path.exists(soilnet_path):
        print(f"[WARN] SoilNet model not found at {soilnet_path}")
        _soil_model = None
        return

    try:
        import keras
        _soil_model = keras.saving.load_model(soilnet_path)
        print("[OK] SoilNet model loaded (Keras 3 + JAX backend).")
    except Exception as e:
        print(f"[WARN] SoilNet model unavailable: {e}")
        _soil_model = None


# ---------------------------------------------------------------------------
# Soil classes mapping (index -> display name, template)
# ---------------------------------------------------------------------------
SOIL_TEMPLATES = {
    0: ("Alluvial", "Alluvial.html"),
    1: ("Black", "Black.html"),
    2: ("Clay", "Clay.html"),
    3: ("Red", "Red.html"),
}


def _predict_keras(image_path):
    """Run the SoilNet Keras model on an image file. Returns class index or None."""
    if _soil_model is None:
        return None
    try:
        img = Image.open(image_path).convert('RGB').resize((224, 224))
        arr = np.expand_dims(np.array(img) / 255.0, axis=0)
        pred = _soil_model.predict(arr, verbose=0)
        return int(np.argmax(pred, axis=-1)[0])
    except Exception as e:
        print(f"SoilNet Keras prediction error: {e}")
        return None


def _predict_heuristic(image_path):
    """
    Fallback soil classification using PIL-based RGB averaging.
    Used only when the Keras model is unavailable.
    """
    try:
        img = Image.open(image_path).convert('RGB').resize((16, 16))
        pixels = list(img.getdata())
        num = len(pixels)
        avg_r = sum(r for r, g, b in pixels) / num
        avg_g = sum(g for r, g, b in pixels) / num
        avg_b = sum(b for r, g, b in pixels) / num
        brightness = (avg_r + avg_g + avg_b) / 3.0

        # Black Soil — dark or near-neutral dark
        if brightness < 60 or (brightness < 85 and abs(avg_r - avg_g) < 6 and abs(avg_g - avg_b) < 6):
            return 1
        # Red Soil — strong red dominance
        if avg_r > avg_g + 12 and avg_r > avg_b + 12:
            return 3
        # Clay Soil — yellowish/brownish hue
        if avg_r > avg_g and avg_g > avg_b and (avg_r - avg_b) > 15:
            return 2
        # Alluvial Soil — balanced, lighter
        return 0
    except Exception as e:
        print(f"Heuristic soil classifier error: {e}")
        return 0


def predict_soil(image_path, model_type='soilnet'):
    """
    Predict soil type from an uploaded image.

    Args:
        image_path: Path to the uploaded soil image.
        model_type: Ignored for now (kept for API compatibility).

    Returns:
        (soil_name, template_name) — e.g. ("Alluvial", "Alluvial.html")
    """
    # Try SoilNet Keras model first
    result = _predict_keras(image_path)

    # Fallback to heuristic
    if result is None:
        result = _predict_heuristic(image_path)

    return SOIL_TEMPLATES.get(result, ("Alluvial", "Alluvial.html"))
