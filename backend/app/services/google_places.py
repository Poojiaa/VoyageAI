import os
import httpx
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")

async def search_places(query: str, location: str = None, type: str = None, limit: int = 3):
    """
    Search for places using Google Places API (New).
    """
    if not GOOGLE_PLACES_API_KEY or GOOGLE_PLACES_API_KEY == "your_google_places_api_key":
        logger.warning("Google Places API key is missing. Using simulated data.")
        return _get_simulated_places(query, type)

    url = "https://places.googleapis.com/v1/places:searchText"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.photos"
    }
    
    text_query = query
    if location:
        text_query = f"{query} in {location}"
        
    payload = {
        "textQuery": text_query,
        "languageCode": "en",
        "maxResultCount": limit
    }
    
    # We can add includedType if it's a specific type, but textQuery is usually good enough for broader searches.

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            
            places = []
            for p in data.get("places", []):
                name = p.get("displayName", {}).get("text", "Unknown")
                
                # Try to construct a photo URL
                photo_url = None
                photos = p.get("photos", [])
                if photos:
                    photo_name = photos[0].get("name")
                    if photo_name:
                        photo_url = f"https://places.googleapis.com/v1/{photo_name}/media?maxHeightPx=400&maxWidthPx=400&key={GOOGLE_PLACES_API_KEY}"
                
                if not photo_url:
                    # fallback image
                    photo_url = f"https://source.unsplash.com/400x400/?{name.replace(' ', ',')},building"

                places.append({
                    "place_id": p.get("id"),
                    "name": name,
                    "address": p.get("formattedAddress", ""),
                    "rating": p.get("rating", 0.0),
                    "img": photo_url
                })
            return places
    except Exception as e:
        logger.error(f"Error fetching from Google Places API: {e}")
        return _get_simulated_places(query, type)


def _get_simulated_places(query: str, type: str):
    return [
        {
            "place_id": "mock_1",
            "name": f"Grand {query} Hotel",
            "address": "123 Main St, City Center",
            "rating": 4.5,
            "img": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80"
        },
        {
            "place_id": "mock_2",
            "name": f"Boutique {query} Resort",
            "address": "456 Beach Rd",
            "rating": 4.2,
            "img": "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=400&q=80"
        },
        {
            "place_id": "mock_3",
            "name": f"Budget {query} Inn",
            "address": "789 Station Ave",
            "rating": 3.8,
            "img": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80"
        }
    ]

async def search_hotels(location: str, budget_tier: str = "Mid-range", limit: int = 3):
    query = f"{budget_tier} hotels"
    return await search_places(query, location, "lodging", limit)

async def search_restaurants(location: str, limit: int = 3):
    return await search_places("restaurants", location, "restaurant", limit)

async def search_attractions(location: str, limit: int = 3):
    return await search_places("top tourist attractions", location, "tourist_attraction", limit)
