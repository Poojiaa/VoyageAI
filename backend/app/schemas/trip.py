from pydantic import BaseModel, Field
from typing import List, Optional

class DestinationRequest(BaseModel):
    source: str
    destination: Optional[str] = None
    destination_type: str = "Domestic"
    country: Optional[str] = None
    start_date: str
    end_date: str
    trip_duration: int = 7
    budget: str
    currency: str
    travelers: str
    travel_type: str
    hotel_preference: str
    transportation: str
    climate: str = "Any"
    interests: List[str]

class DestinationOption(BaseModel):
    name: str = Field(description="Name of the destination city or region")
    country: str = Field(description="Country of the destination")
    description: str = Field(description="A short AI explanation describing why the destination was recommended")
    reasons: List[str] = Field(description="List of 3-5 specific reasons why this matches the user's preferences")
    estimated_cost: float = Field(description="Estimated total trip cost numerically")
    budget_compatibility_pct: float = Field(description="Budget compatibility percentage (e.g. 95)")
    match_score: float = Field(description="AI Match Score out of 100")
    weather: str = Field(default="28°C • Partly Cloudy", description="Expected weather forecast summary (e.g. 28°C • Tropical)")
    temp_range: str = Field(default="24-31°C", description="Expected temperature range (e.g. 24-31°C)")
    weather_condition: str = Field(default="Clouds", description="Primary weather condition (e.g. Sunny, Rain)")
    weather_icon: str = Field(default="02d", description="OpenWeather icon code or descriptive emoji")
    flight_cost: float = Field(description="Estimated flight or transport cost")
    hotel_cost: float = Field(description="Estimated hotel cost for the duration")
    food_cost: float = Field(description="Estimated food cost for the duration")
    local_transport_cost: float = Field(description="Estimated local transport cost for the duration")
    safety_rating: float = Field(description="Safety rating out of 10")
    best_time: str = Field(description="Best time of year to visit")
    img: str = Field(default="", description="Image URL for the destination")
    attractions: List[str] = Field(description="List of top 3-4 attractions")

class DestinationResponse(BaseModel):
    recommendations: List[DestinationOption]

class TripGenerationRequest(BaseModel):
    user_id: str
    selected_destination: str
    budget: float
    travel_dates: str
    travel_style: str
    number_of_travelers: int
    interests: List[str]
    is_international: bool
