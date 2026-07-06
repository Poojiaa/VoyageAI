import os
import httpx
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

FOURSQUARE_API_KEY = os.getenv("FOURSQUARE_API_KEY")
OPENTRIPMAP_API_KEY = os.getenv("OPENTRIPMAP_API_KEY")
PIXABAY_API_KEY = os.getenv("PIXABAY_API_KEY")

async def get_pixabay_image(query: str, fallback_type: str = "travel") -> str:
    """Fetch an image URL from Pixabay API based on a search query."""
    # Read key dynamically every call so .env changes are picked up
    pixabay_key = os.getenv("PIXABAY_API_KEY", "")
    if not pixabay_key or pixabay_key == "your_pixabay_key_here":
        logger.warning("PIXABAY_API_KEY not set, using placeholder image")
        return f"https://placehold.co/800x600?text={query.replace(' ', '+')}"
        
    url = "https://pixabay.com/api/"
    params = {
        "key": pixabay_key,
        "q": query,
        "image_type": "photo",
        "orientation": "horizontal",
        "per_page": 3,
        "safesearch": "true"
    }
    
    try:
        async with httpx.AsyncClient(verify=False, timeout=8.0) as client:
            res = await client.get(url, params=params)
            logger.info(f"Pixabay [{query}]: HTTP {res.status_code}")
            if res.status_code == 200:
                data = res.json()
                hits = data.get("hits", [])
                if hits:
                    return hits[0]["webformatURL"]
                else:
                    logger.warning(f"Pixabay: no hits for query '{query}'")
            else:
                logger.error(f"Pixabay error: HTTP {res.status_code} - {res.text[:200]}")
    except Exception as e:
        logger.error(f"Pixabay exception for '{query}': {type(e).__name__}: {e}")
        
    # Reliable fallback placeholder if API fails
    return f"https://placehold.co/800x600?text={query.replace(' ', '+')}"

async def get_city_coordinates(city: str) -> dict:
    """Helper to geocode a city name using OpenTripMap's geoname endpoint."""
    if not OPENTRIPMAP_API_KEY:
        return {"lat": 28.08, "lon": 78.08} # Fallback
        
    url = f"https://api.opentripmap.com/0.1/en/places/geoname"
    params = {
        "name": city,
        "apikey": OPENTRIPMAP_API_KEY
    }
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(url, params=params, timeout=10.0)
            if res.status_code == 200:
                data = res.json()
                if "lat" in data and "lon" in data:
                    return {"lat": data["lat"], "lon": data["lon"]}
    except Exception as e:
        logger.error(f"Geocoding error for {city}: {e}")
        
    return {"lat": 28.08, "lon": 78.08}

async def search_attractions(city: str, limit: int = 6):
    """Search attractions using OpenTripMap radius search."""
    if not OPENTRIPMAP_API_KEY or OPENTRIPMAP_API_KEY == "your_opentripmap_key":
        return _get_simulated_places("Attractions", city, limit)
        
    coords = await get_city_coordinates(city)
    
    url = f"https://api.opentripmap.com/0.1/en/places/radius"
    params = {
        "radius": 15000, # 15km
        "lon": coords["lon"],
        "lat": coords["lat"],
        "kinds": "cultural,historic,natural,tourist_facilities",
        "rate": "3",
        "limit": limit,
        "apikey": OPENTRIPMAP_API_KEY
    }
    
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(url, params=params, timeout=10.0)
            res.raise_for_status()
            data = res.json()
            
            places = []
            for item in data.get("features", []):
                props = item.get("properties", {})
                name = props.get("name")
                if not name:
                    continue
                    
                places.append({
                    "place_id": props.get("xid"),
                    "name": name,
                    "address": f"{city}, {name}",
                    "rating": props.get("rate", 0) + 2.0, # Adjusting score
                    "img": await get_pixabay_image(f"{city} {name} landmark", "landmark")
                })
            
            if len(places) > 0:
                return places
            return _get_simulated_places("Attractions", city, limit)
    except Exception as e:
        logger.error(f"OpenTripMap error: {e}")
        return _get_simulated_places("Attractions", city, limit)

async def _opentripmap_search(city: str, kinds: str, limit: int = 6):
    """Generic OpenTripMap search for hotels and restaurants."""
    if not OPENTRIPMAP_API_KEY or OPENTRIPMAP_API_KEY == "your_opentripmap_key":
        return _get_simulated_places(kinds, city, limit)
        
    coords = await get_city_coordinates(city)
    
    url = f"https://api.opentripmap.com/0.1/en/places/radius"
    params = {
        "radius": 15000,
        "lon": coords["lon"],
        "lat": coords["lat"],
        "kinds": kinds,
        "rate": "1",  # Rate 1 to get more results
        "limit": limit,
        "apikey": OPENTRIPMAP_API_KEY
    }
    
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(url, params=params, timeout=10.0)
            res.raise_for_status()
            data = res.json()
            
            places = []
            for item in data.get("features", []):
                props = item.get("properties", {})
                name = props.get("name")
                if not name:
                    continue
                    
                query = "hotel" if "accomodations" in kinds else ("restaurant" if "foods" in kinds else "activity")
                
                places.append({
                    "place_id": props.get("xid"),
                    "name": name,
                    "address": f"{city}, {name}",
                    "rating": props.get("rate", 0) + 3.0, 
                    "img": await get_pixabay_image(f"{city} {name} {query}", query)
                })
            
            if len(places) > 0:
                return places
            return _get_simulated_places(query, city, limit)
    except Exception as e:
        logger.error(f"OpenTripMap error: {e}")
        return _get_simulated_places("places", city, limit)

async def search_hotels(city: str, budget_tier: str = "Mid-range", limit: int = 6):
    """Search hotels via OpenTripMap."""
    # Kinds: accomodations
    return await _opentripmap_search(city, "accomodations", limit)

async def search_restaurants(city: str, limit: int = 6):
    """Search restaurants via OpenTripMap."""
    # Kinds: foods
    return await _opentripmap_search(city, "foods", limit)

async def search_experiences(city: str, limit: int = 6):
    """Search experiences via OpenTripMap (using amusements and tourist facilities)."""
    # Kinds: amusements,tourist_facilities
    return await _opentripmap_search(city, "amusements,tourist_facilities", limit)

def _get_simulated_places(query: str, city: str, limit: int = 3):
    """Fallback simulated data if API keys are missing."""
    places = []
    for i in range(1, limit + 1):
        places.append({
            "place_id": f"mock_{i}",
            "name": f"Top {query} {i} in {city}",
            "address": f"Central District, {city}",
            "rating": 4.5 - (i * 0.1),
            "img": f"https://placehold.co/400x300?text=Top+{query}+{i}"
        })
    return places
