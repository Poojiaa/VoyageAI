from langgraph.graph import StateGraph, END
from app.orchestrator.state import TripState
from app.agents.destination import generate_destination_recommendations
from app.agents.agents import budget_agent, travel_agent, hotel_agent, itinerary_agent, notification_agent
from app.schemas.trip import DestinationRequest

async def destination_node(state: TripState) -> dict:
    """Wraps the async DestinationAgent into a LangGraph node."""
    request = DestinationRequest(
        source=state["source"],
        destination=state.get("destination", ""),
        start_date=state["start_date"],
        end_date=state["end_date"],
        budget=state["budget"],
        currency=state["currency"],
        travelers=state["travelers"],
        travel_type=state["travel_type"],
        hotel_preference=state["hotel_preference"],
        transportation=state["transportation"],
        interests=state.get("interests", [])
    )
    recommendations = await generate_destination_recommendations(request)
    return {
        "destination_recommendations": [r.model_dump() for r in recommendations],
        "current_agent": "destination"
    }

async def wrap_agent(agent_func, state: TripState, agent_name: str):
    try:
        result = await agent_func(state)
        result["current_agent"] = agent_name
        return result
    except Exception as e:
        return {"error": str(e), "current_agent": agent_name}

async def budget_node(state: TripState): return await wrap_agent(budget_agent, state, "budget")
async def travel_node(state: TripState): return await wrap_agent(travel_agent, state, "travel")
async def hotel_node(state: TripState): return await wrap_agent(hotel_agent, state, "hotel")
async def itinerary_node(state: TripState): return await wrap_agent(itinerary_agent, state, "itinerary")
async def notification_node(state: TripState): return await wrap_agent(notification_agent, state, "notification")

def supervisor_node(state: TripState) -> dict:
    """Supervisor determines which agent runs next based on current_agent."""
    current = state.get("current_agent", None)
    
    # State machine transition
    sequence = ["budget", "destination", "travel", "hotel", "itinerary", "notification"]
    
    if state.get("error"):
        print(f"Supervisor caught error in {current}: {state['error']}. Moving to next.")
        # Clear error to proceed or we could handle it differently
        
    if not current:
        return {"next_agent": "budget"}
        
    try:
        idx = sequence.index(current)
        if idx + 1 < len(sequence):
            return {"next_agent": sequence[idx + 1]}
        else:
            return {"next_agent": END}
    except ValueError:
        return {"next_agent": END}

def get_next(state: TripState) -> str:
    return state.get("next_agent", "budget")

def build_trip_graph() -> StateGraph:
    graph = StateGraph(TripState)

    graph.add_node("supervisor", supervisor_node)
    graph.add_node("budget", budget_node)
    graph.add_node("destination", destination_node)
    graph.add_node("travel", travel_node)
    graph.add_node("hotel", hotel_node)
    graph.add_node("itinerary", itinerary_node)
    graph.add_node("notification", notification_node)

    graph.set_entry_point("supervisor")

    graph.add_conditional_edges(
        "supervisor",
        get_next,
        {
            "budget": "budget",
            "destination": "destination",
            "travel": "travel",
            "hotel": "hotel",
            "itinerary": "itinerary",
            "notification": "notification",
            END: END
        }
    )

    graph.add_edge("budget", "supervisor")
    graph.add_edge("destination", "supervisor")
    graph.add_edge("travel", "supervisor")
    graph.add_edge("hotel", "supervisor")
    graph.add_edge("itinerary", "supervisor")
    graph.add_edge("notification", "supervisor")

    return graph.compile()

trip_graph = build_trip_graph()
