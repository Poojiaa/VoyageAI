import os
import json
from app.services.openai_service import get_llm
from langchain_core.prompts import ChatPromptTemplate
from app.orchestrator.state import TripState
from app.services.places_api import search_hotels
from app.services.weather import get_forecast
from dotenv import load_dotenv

load_dotenv()


# ─────────────────────────────────────────────
# BUDGET AGENT
# ─────────────────────────────────────────────
async def budget_agent(state: TripState) -> dict:
    """Analyzes the user's budget and produces a strict proportional breakdown."""
    budget_val = float(state.get("budget", 0))
    currency = state.get("currency", "INR")
    travelers = int(state.get("travelers", 1))

    # Convert to INR for internal calculations
    conversion = {"USD": 83, "EUR": 90, "GBP": 105, "JPY": 0.55, "INR": 1}
    inr_budget = budget_val * conversion.get(currency, 1)

    # Proportional breakdown — always sums to exactly total_budget
    transport_pct = 0.25
    hotels_pct = 0.40
    food_pct = 0.20
    activities_pct = 0.15

    transport = round(budget_val * transport_pct)
    hotels = round(budget_val * hotels_pct)
    food = round(budget_val * food_pct)
    activities = round(budget_val * activities_pct)

    # Correct for rounding drift
    drift = budget_val - (transport + hotels + food + activities)
    activities += drift

    per_person = round(budget_val / travelers) if travelers > 0 else budget_val
    is_domestic = inr_budget < 50000

    # Determine transport mode based on budget
    if inr_budget * transport_pct >= 8000 * travelers:
        transport_mode = "Flight (Economy)"
    elif inr_budget * transport_pct >= 2500 * travelers:
        transport_mode = "Train (AC/Sleeper)"
    else:
        transport_mode = "Bus / Sleeper Train"

    warnings = []
    if budget_val < 15000 and currency == "INR":
        warnings.append("Budget is below ₹15,000. Very limited options available.")
    if not is_domestic and inr_budget < 60000:
        warnings.append("Budget may be tight for international travel. Consider domestic destinations.")

    llm = get_llm()
    if llm:
        prompt = f"""You are the Budget Agent for AtlasAI.
The user has a FIXED budget of {budget_val} {currency} for ALL {travelers} travelers.
Trip: {state['source']} to {state['destination']} from {state['start_date']} to {state['end_date']}.

The budget HAS ALREADY BEEN allocated as follows (DO NOT change these numbers):
- transport: {transport} {currency}
- hotels: {hotels} {currency}
- food: {food} {currency}
- activities: {activities} {currency}
- Total: {budget_val} {currency}

Recommended transport mode given budget: {transport_mode}

Return ONLY valid JSON:
{{
  "total_budget": {budget_val},
  "per_person_budget": {per_person},
  "currency": "{currency}",
  "transport_mode": "{transport_mode}",
  "feasibility_score": 90,
  "is_domestic_recommended": true,
  "breakdown": {{
    "transport": {transport},
    "hotels": {hotels},
    "food": {food},
    "activities": {activities}
  }},
  "warnings": {json.dumps(warnings)},
  "tips": ["tip 1", "tip 2"]
}}"""
        try:
            response = llm.invoke(prompt)
            content = response.content.strip()
            # Strip markdown code blocks if present
            if "```" in content:
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            return {"budget_analysis": json.loads(content.strip())}
        except Exception as e:
            print(f"BudgetAgent LLM error: {e}")

    # Pure math fallback — no LLM needed
    return {
        "budget_analysis": {
            "total_budget": budget_val,
            "per_person_budget": per_person,
            "currency": currency,
            "transport_mode": transport_mode,
            "feasibility_score": 90 if is_domestic else 65,
            "is_domestic_recommended": is_domestic,
            "breakdown": {
                "transport": transport,
                "hotels": hotels,
                "food": food,
                "activities": activities
            },
            "warnings": warnings,
            "tips": [
                "Book transport 2–3 weeks in advance for best prices",
                "Choose hostels or homestays to save on accommodation",
                "Eat at local dhabas and street food stalls"
            ]
        }
    }


# ─────────────────────────────────────────────
# TRAVEL AGENT (Multi-modal: Flight/Train/Bus)
# ─────────────────────────────────────────────
async def travel_agent(state: TripState) -> dict:
    """Finds the best transport options based on budget — flight, train, or bus."""
    llm = get_llm()
    dest = state.get("destination", "Goa")
    source = state.get("source", "Delhi")
    budget_analysis = state.get("budget_analysis", {})
    transport_budget = budget_analysis.get("breakdown", {}).get("transport", 5000)
    transport_mode = budget_analysis.get("transport_mode", "Train (AC/Sleeper)")
    travelers = int(state.get("travelers", 2))
    budget_per_person = round(transport_budget / travelers) if travelers > 0 else transport_budget

    if llm:
        prompt = f"""You are the Travel Agent for AtlasAI. Suggest transport options from {source} to {dest}.

STRICT BUDGET CONSTRAINT:
- Total transport budget for ALL {travelers} travelers (ROUND TRIP): {transport_budget} {budget_analysis.get('currency','INR')}
- Budget per person (ROUND TRIP): {budget_per_person} {budget_analysis.get('currency','INR')}
- Budget per person (ONE WAY): {round(budget_per_person / 2)} {budget_analysis.get('currency','INR')}
- Recommended mode: {transport_mode}
- Dates: {state['start_date']} to {state['end_date']}

RULES:
1. Suggest exactly TWO tickets for the journey: one Outbound and one Return.
2. If flights exceed the one-way budget, suggest trains or buses instead.
3. The sum of total_price for both tickets MUST BE <= {transport_budget}.

Return ONLY valid JSON array with exactly TWO objects:
[
  {{
    "type": "Train (Outbound)",
    "operator": "Indian Railways",
    "train_name": "Rajdhani Express",
    "class": "3A AC",
    "departure": "07:30 AM",
    "arrival": "03:00 PM",
    "duration": "7h 30m",
    "price_per_person": 1200,
    "total_price": 2400,
    "booking_tip": "Book on IRCTC app 90 days in advance"
  }},
  {{
    "type": "Train (Return)",
    "operator": "Indian Railways",
    "train_name": "Rajdhani Express",
    "class": "3A AC",
    "departure": "05:00 PM",
    "arrival": "01:30 AM",
    "duration": "8h 30m",
    "price_per_person": 1200,
    "total_price": 2400,
    "booking_tip": "Book on IRCTC app 90 days in advance"
  }}
]"""
        try:
            response = llm.invoke(prompt)
            content = response.content.strip()
            if "```" in content:
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            options = json.loads(content.strip())
            return {"flight_options": options}
        except Exception as e:
            print(f"TravelAgent LLM error: {e}")

    # Smart fallback based on transport_mode
    options = []
    one_way_pp = round(budget_per_person / 2)

    if "Flight" in transport_mode and budget_per_person >= 5000:
        options = [
            {
                "type": "Flight (Outbound)",
                "operator": "IndiGo",
                "class": "Economy",
                "departure": "06:30 AM",
                "arrival": "09:00 AM",
                "duration": "2h 30m",
                "price_per_person": one_way_pp,
                "total_price": one_way_pp * travelers,
                "booking_tip": "Book 30+ days in advance on MakeMyTrip"
            },
            {
                "type": "Flight (Return)",
                "operator": "IndiGo",
                "class": "Economy",
                "departure": "07:00 PM",
                "arrival": "09:45 PM",
                "duration": "2h 45m",
                "price_per_person": one_way_pp,
                "total_price": one_way_pp * travelers,
                "booking_tip": "Book 30+ days in advance on MakeMyTrip"
            }
        ]
    else:
        # Train options
        train_per_person = min(one_way_pp, round(transport_budget / travelers / 2))
        options = [
            {
                "type": "Train (Outbound)",
                "operator": "Indian Railways",
                "train_name": "Superfast Express",
                "class": "Sleeper" if train_per_person < 600 else "3A AC",
                "departure": "08:00 PM",
                "arrival": "07:00 AM (+1)",
                "duration": "11h 00m",
                "price_per_person": train_per_person,
                "total_price": train_per_person * travelers,
                "booking_tip": "Book on IRCTC app 90 days in advance for best seats"
            },
            {
                "type": "Train (Return)",
                "operator": "Indian Railways",
                "train_name": "Superfast Express",
                "class": "Sleeper" if train_per_person < 600 else "3A AC",
                "departure": "09:30 PM",
                "arrival": "08:15 AM (+1)",
                "duration": "10h 45m",
                "price_per_person": train_per_person,
                "total_price": train_per_person * travelers,
                "booking_tip": "Book on IRCTC app 90 days in advance for best seats"
            }
        ]

    return {"flight_options": options}


# ─────────────────────────────────────────────
# HOTEL AGENT
# ─────────────────────────────────────────────
async def hotel_agent(state: TripState) -> dict:
    """Finds hotels matching the user's preference and STRICT hotel budget."""
    dest = state.get("destination", "Goa")
    pref = state.get("hotel_preference", "Mid-range")
    budget_analysis = state.get("budget_analysis", {})
    hotel_budget = budget_analysis.get("breakdown", {}).get("hotels", 6000)

    # Calculate trip duration
    try:
        from datetime import datetime
        start = datetime.strptime(state.get("start_date", ""), "%Y-%m-%d")
        end = datetime.strptime(state.get("end_date", ""), "%Y-%m-%d")
        nights = max(1, (end - start).days)
    except:
        nights = 5

    # Nightly rate must keep total within hotel_budget
    max_nightly = max(300, round(hotel_budget / nights))

    # Adjust preference based on budget
    if max_nightly < 1000:
        effective_pref = "Budget / Hostel"
    elif max_nightly < 2500:
        effective_pref = "Budget Hotel"
    elif max_nightly < 5000:
        effective_pref = "Mid-range Hotel"
    else:
        effective_pref = pref

    real_hotels = await search_hotels(dest, budget_tier=effective_pref, limit=3)

    hotel_options = []
    for h in real_hotels:
        nightly = min(max_nightly, max(500, max_nightly))
        hotel_options.append({
            "name": h["name"],
            "type": effective_pref,
            "stars": 3 if max_nightly < 2000 else 4,
            "price_per_night": nightly,
            "total_price": nightly * nights,
            "nights": nights,
            "rating": h.get("rating", 4.0),
            "amenities": ["WiFi", "AC"] if max_nightly < 1500 else ["Pool", "WiFi", "Breakfast", "AC"],
            "location": h.get("address") or f"Central {dest}",
            "img": h.get("img", ""),
            "budget_note": f"Within your {budget_analysis.get('currency', 'INR')} {hotel_budget} hotel budget"
        })

    return {"hotel_options": hotel_options}


# ─────────────────────────────────────────────
# ITINERARY AGENT
# ─────────────────────────────────────────────
async def itinerary_agent(state: TripState) -> dict:
    """Generates a budget-constrained day-by-day itinerary."""
    llm = get_llm()
    dest = state.get("destination", "Goa")
    interests = state.get("interests", ["Culture", "Food"])
    budget_analysis = state.get("budget_analysis", {})
    breakdown = budget_analysis.get("breakdown", {})
    food_budget = breakdown.get("food", 3000)
    activities_budget = breakdown.get("activities", 2000)
    total_daily_budget = food_budget + activities_budget
    currency = budget_analysis.get("currency", "INR")

    # Calculate trip duration
    try:
        from datetime import datetime, timedelta
        start_dt = datetime.strptime(state.get("start_date", ""), "%Y-%m-%d")
        end_dt = datetime.strptime(state.get("end_date", ""), "%Y-%m-%d")
        nights = max(1, (end_dt - start_dt).days)
    except:
        nights = 5

    daily_budget = round(total_daily_budget / nights) if nights > 0 else total_daily_budget

    if llm:
        prompt = f"""You are the Itinerary Agent for AtlasAI.
Create a {nights}-day itinerary for a trip to {dest}.
Dates: {state['start_date']} to {state['end_date']}
Interests: {', '.join(interests)}
Travel Type: {state['travel_type']}
Travelers: {state['travelers']}

STRICT BUDGET CONSTRAINT:
- Total food + activities budget for ALL days: {total_daily_budget} {currency}
- Maximum budget per day: {daily_budget} {currency}
- Prioritize FREE or LOW-COST attractions where possible (parks, temples, beaches, viewpoints)
- Choose budget-friendly local restaurants over expensive ones

Return ONLY valid JSON — a list of {nights} day objects:
[
  {{
    "day": 1,
    "date": "06 Jul",
    "title": "Arrival & Explore",
    "activities": [
      {{ "time": "10:00 AM", "activity": "Hotel Check-in", "type": "logistics", "cost": 0 }},
      {{ "time": "02:00 PM", "activity": "Visit Local Market (free entry)", "type": "sightseeing", "cost": 0 }},
      {{ "time": "07:00 PM", "activity": "Dinner at local dhaba", "type": "food", "cost": 300 }}
    ],
    "daily_budget": 300
  }}
]

CRITICAL: The sum of all "cost" fields per day MUST equal "daily_budget". 
The sum of ALL days' "daily_budget" MUST NOT exceed {total_daily_budget}."""
        try:
            response = llm.invoke(prompt)
            content = response.content.strip()
            if "```" in content:
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            return {"full_itinerary": json.loads(content.strip())}
        except Exception as e:
            print(f"ItineraryAgent LLM error: {e}")

    # Fallback: dynamically scale costs to budget
    per_day = daily_budget
    days = []
    for i in range(nights):
        from datetime import datetime, timedelta
        try:
            day_date = (datetime.strptime(state.get("start_date", ""), "%Y-%m-%d") + timedelta(days=i)).strftime("%d %b")
        except:
            day_date = f"Day {i+1}"

        food_cost = round(per_day * 0.6)
        sight_cost = round(per_day * 0.25)
        misc_cost = per_day - food_cost - sight_cost

        days.append({
            "day": i + 1,
            "date": day_date,
            "title": ["Arrival & Settle In", "Culture & Sightseeing", "Nature & Adventure", "Local Experiences", "Leisure & Departure"][i % 5],
            "activities": [
                {"time": "09:00 AM", "activity": f"Visit famous spot in {dest}", "type": "sightseeing", "cost": sight_cost},
                {"time": "01:00 PM", "activity": "Lunch at local eatery", "type": "food", "cost": round(food_cost * 0.4)},
                {"time": "07:00 PM", "activity": "Dinner at budget restaurant", "type": "food", "cost": round(food_cost * 0.6) + misc_cost},
            ],
            "daily_budget": per_day
        })

    return {"full_itinerary": days}


# ─────────────────────────────────────────────
# NOTIFICATION AGENT
# ─────────────────────────────────────────────
async def notification_agent(state: TripState) -> dict:
    """Fetches weather and generates travel advisories."""
    dest = state.get("destination", "Goa")

    weather_data = await get_forecast(dest)
    budget_analysis = state.get("budget_analysis", {})
    warnings = budget_analysis.get("warnings", [])

    notifications = [
        {"type": "weather", "message": f"Weather in {dest}: {weather_data['forecast_summary']}", "priority": "low"},
        {"type": "advisory", "message": "No active travel advisories. Safe to travel.", "priority": "low"},
        {"type": "reminder", "message": "Check ID/passport validity before departure.", "priority": "medium"}
    ]

    for w in warnings:
        notifications.insert(0, {"type": "budget_warning", "message": w, "priority": "high"})

    return {
        "weather_forecast": weather_data,
        "notifications": notifications,
        "is_complete": True
    }
