"""
Fertilizer recommendation service — CSV-based NPK analysis.
"""

import os
import pandas as pd
from markupsafe import Markup
from utils.fertilizer import fertilizer_dic

base_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
fertilizer_csv_path = os.path.join(base_dir, 'data', 'fertilizer.csv')


def recommend_fertilizer(crop_name, nitrogen, phosphorous, potassium):
    """
    Compare current NPK values with ideal values from the CSV.

    Returns a Markup HTML recommendation string, or None on error.
    """
    try:
        df = pd.read_csv(fertilizer_csv_path)
        row = df[df['Crop'] == crop_name]
        if row.empty:
            return None

        nr = row['N'].iloc[0]
        pr = row['P'].iloc[0]
        kr = row['K'].iloc[0]

        n_diff = nr - nitrogen
        p_diff = pr - phosphorous
        k_diff = kr - potassium

        # Find the most deficient nutrient
        temp = {abs(n_diff): "N", abs(p_diff): "P", abs(k_diff): "K"}
        max_value = temp[max(temp.keys())]

        if max_value == "N":
            key = 'NHigh' if n_diff < 0 else "Nlow"
        elif max_value == "P":
            key = 'PHigh' if p_diff < 0 else "Plow"
        else:
            key = 'KHigh' if k_diff < 0 else "Klow"

        return Markup(str(fertilizer_dic[key]))

    except Exception as e:
        print(f"Fertilizer CSV processing error: {e}")
        return None
