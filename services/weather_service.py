"""
Weather service — wraps OpenWeatherMap API calls with a smart seasonal
fallback estimator based on India's climate patterns.
"""

import os
import time
from urllib.parse import quote
import requests
from config import Config


# ---------------------------------------------------------------------------
# Offline seasonal weather estimator (used when API key is missing/fails)
# ---------------------------------------------------------------------------
# Approximate average temperature (°C) and humidity (%) per month for
# major Indian agricultural regions. Values derived from IMD climatology.
_REGIONAL_CLIMATE = {
    # region_key: (base_temp_c, base_humidity_pct)
    'maharashtra': (27.5, 65),
    'punjab': (24.0, 55),
    'karnataka': (26.0, 60),
    'tamil_nadu': (28.5, 70),
    'andhra': (28.0, 68),
    'telangana': (27.0, 55),
    'gujarat': (27.0, 55),
    'madhya_pradesh': (25.0, 55),
    'uttar_pradesh': (25.0, 60),
    'west_bengal': (27.0, 75),
    'default': (28.0, 65),
}

# Monthly temperature offset from annual mean (monsoon & winter dips)
# Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct  Nov  Dec
_MONTH_TEMP_OFFSET = [-4, -2, 1, 4, 5, 3, 1, 1, 2, 1, -2, -4]
_MONTH_HUMIDITY_OFFSET = [-5, -5, -3, 0, 5, 15, 25, 25, 18, 5, -3, -5]


def _estimate_weather(city_name):
    """
    Estimate temperature & humidity for an Indian city using seasonal
    climate data. Returns (temp_c, humidity_pct).

    Used as a zero-dependency fallback when OpenWeatherMap is unavailable.
    """
    city_lower = (city_name or '').lower().strip()

    # Map known cities to climate regions
    city_region = {
        'pune': 'maharashtra', 'mumbai': 'maharashtra', 'nashik': 'maharashtra',
        'nagpur': 'maharashtra', 'ahmednagar': 'maharashtra', 'aurangabad': 'maharashtra',
        'amritsar': 'punjab', 'ludhiana': 'punjab', 'jalandhar': 'punjab',
        'bangalore': 'karnataka', 'bengaluru': 'karnataka', 'mysore': 'karnataka',
        'chennai': 'tamil_nadu', 'coimbatore': 'tamil_nadu', 'madurai': 'tamil_nadu',
        'hyderabad': 'telangana', 'warangal': 'telangana',
        'vijayawada': 'andhra', 'visakhapatnam': 'andhra', 'guntur': 'andhra',
        'ahmedabad': 'gujarat', 'surat': 'gujarat', 'vadodara': 'gujarat',
        'bhopal': 'madhya_pradesh', 'indore': 'madhya_pradesh', 'jabalpur': 'madhya_pradesh',
        'lucknow': 'uttar_pradesh', 'kanpur': 'uttar_pradesh', 'varanasi': 'uttar_pradesh',
        'kolkata': 'west_bengal', 'howrah': 'west_bengal',
    }
    region = city_region.get(city_lower, 'default')
    base_temp, base_humidity = _REGIONAL_CLIMATE.get(region, _REGIONAL_CLIMATE['default'])

    month = time.localtime().tm_mon  # 1-12
    temp = base_temp + _MONTH_TEMP_OFFSET[month - 1]
    humidity = base_humidity + _MONTH_HUMIDITY_OFFSET[month - 1]

    # Clamp humidity to realistic bounds
    humidity = max(20, min(95, humidity))
    return round(temp, 1), round(humidity, 1)


def get_weather_data(latitude, longitude):
    """Fetch weather by lat/lon. Returns dict or None on failure."""
    api_key = Config.OPEN_WEATHER_APIKEY
    
    # 1. Try OpenWeatherMap if key is present
    if api_key and api_key != "YOUR_WEATHER_API_KEY":
        url = (
            f"https://api.openweathermap.org/data/2.5/weather"
            f"?lat={latitude}&lon={longitude}&appid={api_key}&units=metric"
        )
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                return {
                    'temperature': data['main']['temp'],
                    'humidity': data['main']['humidity'],
                    'pressure': data['main']['pressure'],
                    'wind_speed': data['wind']['speed'],
                    'rain': data.get('rain', {}).get('1h', 0.0),
                }
        except Exception as e:
            print(f"OpenWeatherMap fetch failed, trying Open-Meteo fallback: {e}")

    # 2. Keyless Open-Meteo fallback
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            current = data.get('current', {})
            return {
                'temperature': current.get('temperature_2m', 28.0),
                'humidity': current.get('relative_humidity_2m', 65.0),
                'pressure': current.get('surface_pressure', 1010.0),
                'wind_speed': current.get('wind_speed_10m', 8.5),
                'rain': 0.0,
            }
    except Exception as e:
        print(f"Open-Meteo fetch failed: {e}")

    # 3. Final offline seasonal estimator fallback
    temp, humidity = _estimate_weather('default')
    return {
        'temperature': temp,
        'humidity': humidity,
        'pressure': 1010,
        'wind_speed': 8.5,
        'rain': 0.0,
    }


def weather_fetch(city_name):
    """
    Fetch temperature and humidity for a city.

    Returns (temp, humidity) or None on failure. Falls back to keyless Open-Meteo
    and finally to the offline seasonal estimator when the API is unavailable.
    """
    api_key = Config.OPEN_WEATHER_APIKEY
    
    # 1. Try OpenWeatherMap if key is present
    if api_key and api_key != "YOUR_WEATHER_API_KEY":
        safe_city = quote(str(city_name).strip()[:100], safe='')
        url = f"https://api.openweathermap.org/data/2.5/weather?appid={api_key}&q={safe_city}&units=metric"
        try:
            response = requests.get(url, timeout=5)
            x = response.json()
            if x.get("cod") != "404" and "main" in x:
                y = x["main"]
                temperature = round(y.get("temp", 0), 2)
                humidity = y.get("humidity", 65)
                return temperature, humidity
        except Exception as e:
            print(f"OpenWeatherMap city fetch failed, trying Open-Meteo fallback: {e}")

    # 2. Keyless Open-Meteo fallback (Geocoding + Forecast)
    try:
        safe_city = quote(str(city_name).strip()[:100], safe='')
        geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={safe_city}&count=1"
        geo_resp = requests.get(geo_url, timeout=5)
        if geo_resp.status_code == 200:
            geo_data = geo_resp.json()
            results = geo_data.get('results', [])
            if results:
                lat = results[0].get('latitude')
                lon = results[0].get('longitude')
                
                weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m"
                w_resp = requests.get(weather_url, timeout=5)
                if w_resp.status_code == 200:
                    w_data = w_resp.json()
                    current = w_data.get('current', {})
                    temp = round(current.get('temperature_2m', 28.0), 2)
                    humid = current.get('relative_humidity_2m', 65)
                    return temp, humid
    except Exception as e:
        print(f"Open-Meteo city fetch failed: {e}")

    # 3. Final offline seasonal estimator fallback
    return _estimate_weather(city_name)



