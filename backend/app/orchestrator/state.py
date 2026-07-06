import os
from typing import TypedDict, Annotated, List
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, BaseMessage
import operator

# ─────────────────────────────────────────────
# Shared State that passes between all agents
# ─────────────────────────────────────────────
class TripState(TypedDict):
    """Shared state passed between all LangGraph agents."""
    # Input
    source: str
    destination: str
    start_date: str
    end_date: str
    budget: str
    currency: str
    travelers: str
    travel_type: str
    hotel_preference: str
    transportation: str
    interests: List[str]

    # Agent Outputs
    budget_analysis: dict        # From BudgetAgent
    destination_recommendations: list  # From DestinationAgent
    flight_options: list         # From TravelAgent
    hotel_options: list          # From HotelAgent
    full_itinerary: list         # From ItineraryAgent
    notifications: list          # From NotificationAgent
    weather_forecast: dict       # From NotificationAgent

    # Control flow
    next_agent: str
    is_complete: bool
    
    # Supervisor pattern fields
    messages: Annotated[List[BaseMessage], operator.add]
    error: str
    current_agent: str
