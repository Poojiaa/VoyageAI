import json
import os
import asyncio
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from app.schemas.trip import DestinationRequest, DestinationOption
from app.services.openai_service import get_llm
from app.vectorstore.chroma import query_collection
from app.services.weather import get_forecast
from app.services.places_api import get_pixabay_image
from dotenv import load_dotenv

load_dotenv()

async def generate_destination_recommendations(request: DestinationRequest) -> list[DestinationOption]:
    """
    Calls the LLM to get 5 destination recommendations based on strict budget rules,
    then enriches them with real-time weather and Pixabay images.
    """
    llm = get_llm(temperature=0.7)
    if not llm:
        print("No LLM available (GROQ_API_KEY missing). Using intelligent fallback.")
        return get_simulated_recommendations(request)

    # RAG Retrieval
    search_query = request.destination if request.destination else ", ".join(request.interests)
    context_docs = query_collection("travel_knowledge", search_query, k=3)
    context_text = "\n".join(context_docs) if context_docs else "No specific context found in knowledge base."
    
    country_rule = f"The user has requested Domestic travel within {request.country}. You MUST ONLY recommend destinations inside {request.country}." if request.destination_type.lower() == "domestic" else "The user has requested International travel. You MUST recommend destinations outside their source country."
    
    prompt = PromptTemplate(
        input_variables=["source", "country_rule", "climate", "trip_duration", "destination", "start_date", "end_date", "budget", "currency", "travelers", "travel_type", "hotel_pref", "transport", "interests", "context"],
        template="""
        You are an expert AI Travel Agent for AtlasAI.
        Generate exactly 5 highly personalized destination recommendations based on these user inputs:
        
        - Source Location: {source}
        - Trip Type Rule: {country_rule}
        - Requested Destination (if any): {destination}
        - Dates: {start_date} to {end_date} (Duration: {trip_duration} days)
        - Budget: {budget} {currency}
        - Travelers: {travelers}
        - Travel Type: {travel_type}
        - Hotel Preference: {hotel_pref}
        - Transportation: {transport}
        - Preferred Climate: {climate}
        - Interests: {interests}
        
        CRITICAL BUDGET RULES (STRICTLY ENFORCED):
        1. The user has a TOTAL budget of EXACTLY {budget} {currency} for ALL {travelers} travelers.
        2. HARD MATH RULE: flight_cost + hotel_cost + food_cost + local_transport_cost MUST BE <= {budget}.
        3. The field "estimated_cost" MUST equal flight_cost + hotel_cost + food_cost + local_transport_cost.
        4. If {budget} {currency} is too low for international travel, recommend affordable domestic or budget international options.
        5. Do NOT suggest destinations where estimated_cost exceeds {budget}. If you cannot fit a destination within the budget, skip it.
        
        Use the following retrieved knowledge base context to inform your recommendations if relevant:
        CONTEXT:
        {context}
        
        Return the result STRICTLY as a JSON array of objects. 
        Each object must have the following exact keys:
        - name: The name of the destination (e.g. "Bali")
        - country: The country (e.g. "Indonesia")
        - description: A short AI explanation describing why it was recommended.
        - reasons: Array of 3-5 specific reasons why this matches their interests and budget.
        - estimated_cost: Total estimated cost numerically (sum of all breakdown costs below).
        - budget_compatibility_pct: Percentage (0-100) of how well it fits the budget.
        - match_score: AI Match score (0-100) based on interests and climate.
        - flight_cost: Estimated flight or transport cost numerically for all {travelers}.
        - hotel_cost: Estimated hotel cost numerically for {trip_duration} days.
        - food_cost: Estimated food cost numerically for {trip_duration} days for all {travelers}.
        - local_transport_cost: Estimated local transport cost numerically.
        - safety_rating: Safety rating out of 10.
        - best_time: Best time of year to visit.
        - img: A simple string placeholder "PIXABAY_IMAGE" (this will be replaced by the backend).
        - attractions: Array of 3-5 top attractions.
        
        Do not return any markdown wrapping. Just the raw JSON array.
        """
    )
    
    formatted_prompt = prompt.format(
        source=request.source,
        country_rule=country_rule,
        climate=request.climate,
        trip_duration=request.trip_duration,
        destination=request.destination or "Open to suggestions",
        start_date=request.start_date,
        end_date=request.end_date,
        budget=request.budget,
        currency=request.currency,
        travelers=request.travelers,
        travel_type=request.travel_type,
        hotel_pref=request.hotel_preference,
        transport=request.transportation,
        interests=", ".join(request.interests),
        context=context_text
    )
    
    try:
        response = await llm.ainvoke(formatted_prompt)
        content = response.content.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
        
        data = json.loads(content.strip())
        
        # Phase 2: Budget filtering & Enrich with Live Weather Data and Pixabay Images
        recommendations = []
        user_budget = float(request.budget)
        
        for item in data:
            # HARD FILTER: Remove anything exceeding the user's budget
            if float(item.get('estimated_cost', 999999)) > user_budget:
                print(f"Destination {item.get('name')} rejected: estimated cost {item.get('estimated_cost')} > budget {user_budget}")
                continue

            # Default weather fields (will be overwritten if API succeeds)
            item['weather'] = "28°C • Partly Cloudy"
            item['weather_condition'] = "Clouds"
            item['weather_icon'] = "02d"
            item['temp_range'] = "24-31°C"
            
            recommendations.append(item)
            
        # If all were filtered out, add fallback
        if not recommendations:
            return get_simulated_recommendations(request)
            
        # Fetch weather and images concurrently for speed
        async def fetch_enrichments_for_item(idx, city_name):
            try:
                # 1. Fetch Image
                img_url = await get_pixabay_image(f"{city_name} travel destination")
                recommendations[idx]['img'] = img_url
                
                # 2. Fetch Weather
                weather_data = await get_forecast(city_name)
                recommendations[idx]['weather'] = weather_data.get('forecast_summary', "28°C • Partly Cloudy")
                recommendations[idx]['weather_condition'] = weather_data.get('condition', "Clouds")
                recommendations[idx]['weather_icon'] = weather_data.get('icon', "02d")
                temp_min = weather_data.get('temp_min', 24)
                temp_max = weather_data.get('temp_max', 31)
                recommendations[idx]['temp_range'] = f"{temp_min}-{temp_max}°C"
                
                # Adjust match score slightly based on weather logic
                if request.climate.lower() in weather_data.get('description', '').lower():
                    recommendations[idx]['match_score'] = min(100, recommendations[idx]['match_score'] + 5)
            except Exception as e:
                pass

        await asyncio.gather(*(fetch_enrichments_for_item(i, item['name']) for i, item in enumerate(recommendations)))

        return [DestinationOption(**item) for item in recommendations]

    except Exception as e:
        print(f"Error parsing LLM response: {e}")
        return get_simulated_recommendations(request)


def get_simulated_recommendations(request: DestinationRequest) -> list[DestinationOption]:
    """
    Intelligent simulated fallback for when OpenAI API key is missing.
    """
    budget_val = 0
    try:
        budget_val = float(request.budget)
    except:
        budget_val = 20000
    
    # Generic fallback returning some pre-defined options with the new schema fields
    return [
        DestinationOption(
            name="Rishikesh",
            country="India",
            description="Your budget was too low for Europe/Bali. Rishikesh offers incredible adventure, yoga, and nature well within your budget.",
            reasons=["Perfect for adventure", "Fits budget perfectly", "Great weather"],
            estimated_cost=int(budget_val * 0.8),
            budget_compatibility_pct=95,
            match_score=92,
            weather="24°C • Pleasant",
            temp_range="18-28°C",
            weather_condition="Clear",
            weather_icon="01d",
            flight_cost=int(budget_val * 0.2),
            hotel_cost=int(budget_val * 0.3),
            food_cost=int(budget_val * 0.2),
            local_transport_cost=int(budget_val * 0.1),
            safety_rating=8.5,
            best_time="Sept - Nov",
            img="https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=800&q=80",
            attractions=["Laxman Jhula", "Triveni Ghat", "River Rafting"]
        ),
        DestinationOption(
            name="Bali",
            country="Indonesia",
            description="Enjoy ultra-luxury villas and world-class spas.",
            reasons=["Tropical paradise", "Beautiful beaches", "Rich culture"],
            estimated_cost=120000,
            budget_compatibility_pct=70,
            match_score=92,
            weather="28°C • Tropical",
            temp_range="24-31°C",
            weather_condition="Rain",
            weather_icon="10d",
            flight_cost=40000,
            hotel_cost=50000,
            food_cost=20000,
            local_transport_cost=10000,
            safety_rating=8.2,
            best_time="Apr - Oct",
            img="https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
            attractions=["Ubud Palace", "Uluwatu Temple", "Tegallalang Terraces"]
        )
    ]
