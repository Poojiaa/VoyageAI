import os
import httpx
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

async def get_current_weather(city: str) -> dict:
    if not OPENWEATHER_API_KEY or OPENWEATHER_API_KEY == "your_openweather_api_key":
        return _mock_weather(city)

    url = f"https://api.openweathermap.org/data/2.5/weather"
    params = {
        "q": city,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric"
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, params=params, timeout=5.0)
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "temp": data["main"]["temp"],
                    "temp_min": data["main"].get("temp_min", data["main"]["temp"]),
                    "temp_max": data["main"].get("temp_max", data["main"]["temp"]),
                    "description": data["weather"][0]["description"].title(),
                    "condition": data["weather"][0]["main"],
                    "icon": data["weather"][0]["icon"],
                    "humidity": data["main"]["humidity"],
                    "wind_speed": data["wind"]["speed"],
                    "forecast_summary": f"{data['main']['temp']}°C, {data['weather'][0]['description'].title()}"
                }
            else:
                logger.error(f"OpenWeather API error: {resp.status_code} - {resp.text}")
                return _mock_weather(city)
    except Exception as e:
        logger.error(f"OpenWeather Exception: {e}")
        return _mock_weather(city)


async def get_forecast(city: str) -> dict:
    if not OPENWEATHER_API_KEY or OPENWEATHER_API_KEY == "your_openweather_api_key":
        return _mock_weather(city)
        
    url = f"https://api.openweathermap.org/data/2.5/forecast"
    params = {
        "q": city,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, params=params, timeout=5.0)
            if resp.status_code == 200:
                data = resp.json()
                # Just return the first forecast item for simplicity as the summary
                return {
                    "temp": data["list"][0]["main"]["temp"],
                    "temp_min": data["list"][0]["main"].get("temp_min", data["list"][0]["main"]["temp"]),
                    "temp_max": data["list"][0]["main"].get("temp_max", data["list"][0]["main"]["temp"]),
                    "description": data["list"][0]["weather"][0]["description"].title(),
                    "condition": data["list"][0]["weather"][0]["main"],
                    "icon": data["list"][0]["weather"][0]["icon"],
                    "humidity": data["list"][0]["main"]["humidity"],
                    "wind_speed": data["list"][0]["wind"]["speed"],
                    "forecast_summary": f"{data['list'][0]['main']['temp']}°C, {data['list'][0]['weather'][0]['description'].title()}"
                }
            else:
                return _mock_weather(city)
    except Exception as e:
        return _mock_weather(city)

def _mock_weather(city: str):
    return {
        "temp": 28,
        "temp_min": 24,
        "temp_max": 31,
        "description": "Partly Cloudy",
        "condition": "Clouds",
        "icon": "02d",
        "humidity": 65,
        "wind_speed": 12,
        "forecast_summary": "28°C, Partly Cloudy"
    }
