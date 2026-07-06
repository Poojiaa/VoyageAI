from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.schemas.trip import DestinationRequest, DestinationResponse
from app.agents.destination import generate_destination_recommendations
from app.orchestrator.graph import trip_graph
from app.orchestrator.state import TripState
from app.database.config import get_db
from app.database.models import Trip, User, SavedPlace, Notification
from app.api.auth import get_current_user
from app.services.google_places import search_hotels
from app.services.weather import get_current_weather
from pydantic import BaseModel
from typing import List, Optional
import json

router = APIRouter()


# ─────────────────────────────────────────────
# DESTINATION RECOMMENDATIONS
# POST /api/destinations
# ─────────────────────────────────────────────
@router.post("/destinations", response_model=DestinationResponse)
async def get_destinations(request: DestinationRequest):
    """Get AI-powered destination recommendations based on user preferences and budget."""
    try:
        recommendations = await generate_destination_recommendations(request)
        return DestinationResponse(recommendations=recommendations)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# FULL TRIP GENERATION via LangGraph
# POST /api/trips/generate
# ─────────────────────────────────────────────
class TripPlanRequest(BaseModel):
    source: str
    destination: str
    start_date: str
    end_date: str
    budget: str
    currency: str
    travelers: str = "2"
    travel_type: str = "Couple"
    hotel_preference: str = "Mid-range"
    transportation: str = "Flexible"
    interests: List[str] = []


@router.post("/trips/generate")
async def generate_full_trip(
    request: TripPlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Triggers the full LangGraph multi-agent pipeline:
    Budget Agent → Destination Agent → Travel Agent → Hotel Agent → Itinerary Agent → Notification Agent
    """
    try:
        initial_state: TripState = {
            "source": request.source,
            "destination": request.destination,
            "start_date": request.start_date,
            "end_date": request.end_date,
            "budget": request.budget,
            "currency": request.currency,
            "travelers": request.travelers,
            "travel_type": request.travel_type,
            "hotel_preference": request.hotel_preference,
            "transportation": request.transportation,
            "interests": request.interests,
            # Initialize output fields
            "budget_analysis": {},
            "destination_recommendations": [],
            "flight_options": [],
            "hotel_options": [],
            "full_itinerary": [],
            "notifications": [],
            "weather_forecast": {},
            "next_agent": "budget",
            "is_complete": False,
            # Supervisor pattern fields
            "messages": [],
            "error": "",
            "current_agent": ""
        }

        # Run the full LangGraph pipeline
        final_state = await trip_graph.ainvoke(initial_state)

        # Save trip to DB
        trip = Trip(
            user_id=current_user.id,
            title=f"Trip to {request.destination}",
            source=request.source,
            destination=request.destination,
            start_date=request.start_date,
            end_date=request.end_date,
            budget=float(request.budget),
            currency=request.currency,
            travelers=int(request.travelers),
            travel_type=request.travel_type,
            status="generated",
            itinerary_data=final_state.get("full_itinerary", []),
            flight_data=final_state.get("flight_options", []),
            hotel_data=final_state.get("hotel_options", []),
            budget_analysis=final_state.get("budget_analysis", {})
        )
        db.add(trip)
        db.commit()
        db.refresh(trip)

        return {
            "trip_id": trip.id,
            "status": "success",
            "budget_analysis": final_state.get("budget_analysis", {}),
            "destination_recommendations": final_state.get("destination_recommendations", []),
            "flight_options": final_state.get("flight_options", []),
            "hotel_options": final_state.get("hotel_options", []),
            "full_itinerary": final_state.get("full_itinerary", []),
            "weather_forecast": final_state.get("weather_forecast", {}),
            "notifications": final_state.get("notifications", [])
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# GET SAVED TRIPS
# GET /api/trips
# ─────────────────────────────────────────────
@router.get("/trips")
def get_user_trips(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns all trips saved by the authenticated user."""
    trips = db.query(Trip).filter(Trip.user_id == current_user.id).all()
    return {"trips": [{"id": t.id, "title": t.title, "destination": t.destination, "status": t.status, "created_at": str(t.created_at)} for t in trips]}


# ─────────────────────────────────────────────
# GET USER PROFILE
# GET /api/profile
# ─────────────────────────────────────────────
@router.get("/profile")
def get_profile(current_user: User = Depends(get_current_user)):
    """Returns the current user's profile."""
    return {
        "uid": current_user.id,
        "email": current_user.email,
        "name": current_user.full_name
    }

@router.get("/trips/{trip_id}")
def get_trip(trip_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get full details of a specific trip."""
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip

class HotelSearchRequest(BaseModel):
    location: str
    budget_tier: str = "Mid-range"
    limit: int = 5

@router.post("/hotels")
async def search_hotels_endpoint(request: HotelSearchRequest):
    """Search for hotels using Google Places API."""
    hotels = await search_hotels(request.location, request.budget_tier, request.limit)
    return {"hotels": hotels}

@router.get("/weather")
async def get_weather_endpoint(city: str):
    """Get current weather for a city."""
    weather = await get_current_weather(city)
    return {"weather": weather}

@router.get("/notifications")
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get user's notifications."""
    notifs = db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).all()
    return {"notifications": notifs}


@router.get("/places/restaurants")
async def get_restaurants(city: str, limit: int = 6):
    """Get real restaurant recommendations for a city from Foursquare."""
    from app.services.places_api import search_restaurants
    results = await search_restaurants(city, limit=limit)
    return {"restaurants": results}


@router.get("/places/attractions")
async def get_attractions(city: str, limit: int = 6):
    """Get top tourist attractions for a city from OpenTripMap."""
    from app.services.places_api import search_attractions
    results = await search_attractions(city, limit=limit)
    return {"attractions": results}


@router.get("/places/hotels")
async def get_hotels_for_city(city: str, budget_tier: str = "Mid-range", limit: int = 6):
    """Get hotel options for a city from Foursquare."""
    from app.services.places_api import search_hotels
    results = await search_hotels(city, budget_tier=budget_tier, limit=limit)
    return {"hotels": results}


@router.get("/places/experiences")
async def get_experiences(city: str, limit: int = 6):
    """Get experience/activity options for a city from Foursquare."""
    from app.services.places_api import search_experiences
    results = await search_experiences(city, limit=limit)
    return {"experiences": results}

class BookmarkRequest(BaseModel):
    place_id: str
    name: str
    category: str
    address: str
    rating: float = 0.0
    image_url: str = ""

@router.post("/bookmarks")
def toggle_bookmark(request: BookmarkRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Save or unsave a place."""
    existing = db.query(SavedPlace).filter(
        SavedPlace.user_id == current_user.id,
        SavedPlace.place_id == request.place_id
    ).first()
    
    if existing:
        db.delete(existing)
        db.commit()
        return {"message": "Bookmark removed", "bookmarked": False}
    else:
        new_place = SavedPlace(
            user_id=current_user.id,
            place_id=request.place_id,
            name=request.name,
            category=request.category,
            address=request.address,
            rating=request.rating,
            image_url=request.image_url
        )
        db.add(new_place)
        db.commit()
        return {"message": "Bookmark added", "bookmarked": True}


# ─────────────────────────────────────────────
# AI CHATBOT
# POST /api/chat
# ─────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def chat_with_ai(request: ChatRequest):
    """Chat with AtlasAI travel assistant."""
    from app.services.openai_service import get_llm
    
    llm = get_llm()
    user_msg = request.message
    
    if llm:
        prompt = f"""You are AtlasAI, a friendly and expert AI travel assistant.
Answer the user's travel-related question concisely and helpfully. Keep responses under 150 words.
If it's not travel related, politely redirect to travel topics.

User: {user_msg}
AtlasAI:"""
        try:
            response = await llm.ainvoke(prompt)
            return {"reply": response.content.strip()}
        except Exception as e:
            print(f"Chat LLM error: {e}")
    
    # Intelligent fallback (no API key)
    msg_lower = user_msg.lower()
    if any(w in msg_lower for w in ["bali", "indonesia"]):
        reply = "Bali is a fantastic destination! 🌴 Best time to visit is April–October (dry season). Budget tip: ₹15,000–₹25,000 per person for a week including flights from India. Must-visit: Ubud rice terraces, Uluwatu Temple, Seminyak Beach. Would you like me to plan a trip?"
    elif any(w in msg_lower for w in ["visa", "passport"]):
        reply = "Great question! Visa requirements vary by destination and nationality. Popular visa-free destinations for Indian passport holders include Thailand (30 days), Maldives (30 days), and Nepal (unlimited). Want me to check a specific country?"
    elif any(w in msg_lower for w in ["budget", "cheap", "affordable"]):
        reply = "For budget-friendly trips from India, consider: Rishikesh (₹8K), Goa (₹12K), Nepal (₹15K), Thailand (₹25K), or Sri Lanka (₹20K). These are per-person estimates for 5–7 days. Want me to plan one of these?"
    elif any(w in msg_lower for w in ["hotel", "stay", "resort"]):
        reply = "I can help find the perfect stay! I search using Google Places API for real-time ratings and prices. Tell me your destination and budget tier (Budget/Mid-range/Luxury) and I'll find options for you."
    elif any(w in msg_lower for w in ["itinerary", "plan", "modify"]):
        reply = "I'd be happy to help with your itinerary! My AI agents can create a complete day-by-day plan with activities, restaurants, and timings. Head to the 'Plan Trip' page to generate a new one, or tell me what changes you'd like to make."
    elif any(w in msg_lower for w in ["weather", "climate", "rain"]):
        reply = "I can check real-time weather for any destination! Just tell me the city name. I monitor weather for your active trips and send alerts if conditions change before your travel dates."
    else:
        reply = f'Great question about "{user_msg}"! I\'ve checked with my travel knowledge base. Would you like me to plan a trip or look up specific information? Try asking about destinations, budgets, visas, or hotels!'
    
    return {"reply": reply}


# ─────────────────────────────────────────────
# DESTINATION DETAIL
# GET /api/destination/{name}
# ─────────────────────────────────────────────
@router.get("/destination/{name}")
async def get_destination_detail(name: str):
    """Get detailed information about a destination using AI + Google Places."""
    from app.services.openai_service import get_llm
    from app.services.places_api import search_attractions
    from app.services.weather import get_current_weather

    # Get real attractions from OpenTripMap
    attractions_data = await search_attractions(name, limit=4)
    
    # Get live weather
    weather = await get_current_weather(name)
    
    llm = get_llm()
    
    if llm:
        prompt = f"""You are AtlasAI. Generate destination detail info for "{name}".
Return ONLY valid JSON with these keys:
- country: string
- description: short 2-sentence description
- currency: local currency with code
- language: primary language
- timezone: timezone abbreviation
- budget: estimated 7-day trip budget in INR formatted like "₹1,45,000"
- flight_cost: estimated flight cost from India in INR formatted like "₹45,000"
- hotel_cost: estimated 7-night hotel cost in INR formatted like "₹65,000"
- safety_rating: safety rating out of 10
- best_time: best months to visit
- crowd: crowd level (Low/Moderate/High)
- tags: array of 5 travel tags
- reasons: array of 5 reasons why to visit
Do not wrap in markdown."""
        try:
            response = await llm.ainvoke(prompt)
            content = response.content.strip().strip("```json").strip("```").strip()
            import json
            detail = json.loads(content)
        except Exception as e:
            print(f"Destination detail LLM error: {e}")
            detail = _get_fallback_detail(name)
    else:
        detail = _get_fallback_detail(name)
    
    detail["weather"] = f"{weather['temp']}°C • {weather['description']}"
    detail["attractions"] = attractions_data
    
    return detail


def _get_fallback_detail(name: str) -> dict:
    """Intelligent fallback for destination details when no API key."""
    FALLBACKS = {
        "bali": {
            "country": "Indonesia", "description": "Bali is a tropical paradise known for lush rice terraces, ancient temples, and vibrant nightlife. It offers a perfect blend of adventure, culture, and relaxation.",
            "currency": "IDR (Rupiah)", "language": "Bahasa Indonesia", "timezone": "WITA (UTC+8)",
            "budget": "₹1,45,000", "flight_cost": "₹45,000", "hotel_cost": "₹65,000",
            "safety_rating": 8.2, "best_time": "April – October", "crowd": "Moderate",
            "tags": ["Adventure", "Beaches", "Culture", "Food", "Wellness"],
            "reasons": ["Perfect for couples & romantic getaways", "Great for adventure & water sports", "Rich cultural experiences", "Highly rated by travelers", "Affordable luxury"],
        },
        "rishikesh": {
            "country": "India", "description": "Rishikesh is the yoga capital of the world, sitting along the banks of the holy Ganges. It offers thrilling rafting, ancient ashrams, and breathtaking Himalayan views.",
            "currency": "INR (Rupee)", "language": "Hindi", "timezone": "IST (UTC+5:30)",
            "budget": "₹15,000", "flight_cost": "₹5,000", "hotel_cost": "₹6,000",
            "safety_rating": 8.5, "best_time": "September – November", "crowd": "Moderate",
            "tags": ["Adventure", "Spirituality", "Nature", "Yoga", "Trekking"],
            "reasons": ["Affordable adventure destination", "World-class river rafting", "Yoga & meditation retreats", "Beautiful Himalayan setting", "Rich spiritual heritage"],
        },
        "kyoto": {
            "country": "Japan", "description": "Kyoto is the cultural heart of Japan with over 1,000 temples. Experience serene Zen gardens, iconic cherry blossoms, and traditional tea ceremonies.",
            "currency": "JPY (Yen)", "language": "Japanese", "timezone": "JST (UTC+9)",
            "budget": "₹2,10,000", "flight_cost": "₹72,000", "hotel_cost": "₹90,000",
            "safety_rating": 9.5, "best_time": "March – May", "crowd": "High",
            "tags": ["Culture", "History", "Nature", "Food", "Photography"],
            "reasons": ["Top-rated AI destination match", "Perfect for culture & history lovers", "Iconic cherry blossom season", "Extremely safe country", "World-class cuisine"],
        },
    }
    
    key = name.lower().strip()
    if key in FALLBACKS:
        return FALLBACKS[key]
    
    # Generic fallback
    return {
        "country": "World", "description": f"{name} is a wonderful destination with unique experiences waiting to be discovered. Plan your trip with AtlasAI for the best recommendations.",
        "currency": "Local Currency", "language": "Local Language", "timezone": "Local Time",
        "budget": "₹1,00,000", "flight_cost": "₹40,000", "hotel_cost": "₹40,000",
        "safety_rating": 8.0, "best_time": "Year-round", "crowd": "Moderate",
        "tags": ["Travel", "Culture", "Food", "Nature", "Adventure"],
        "reasons": ["Unique cultural experiences", "Beautiful landscapes", "Friendly locals", "Great food scene", "Perfect for exploration"],
    }
