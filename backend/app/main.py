from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.config import engine
from app.database import models
from contextlib import asynccontextmanager
from app.services.scheduler import start_scheduler
from app.vectorstore.seed_data import seed_database

# Auto-create all database tables on startup
models.Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    scheduler = None
    try:
        scheduler = start_scheduler()
    except Exception as e:
        print(f"Warning: Scheduler failed to start: {e}")
    
    # Seed vector store if it's empty (in a background thread to not block)
    import threading
    def safe_seed():
        try:
            seed_database()
        except Exception as e:
            print(f"Warning: Vector store seeding skipped: {e}")
    threading.Thread(target=safe_seed, daemon=True).start()
    
    yield
    # Shutdown
    if scheduler:
        scheduler.shutdown()

app = FastAPI(
    title="AtlasAI - Multi-Agent Travel Planner API",
    version="2.0.0",
    description="Powered by LangGraph: 7 specialized AI agents orchestrated by a Supervisor",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.endpoints import router as api_router
from app.api.auth import router as auth_router

app.include_router(auth_router, prefix="/api")
app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {
        "message": "Welcome to AtlasAI Multi-Agent Travel Planner",
        "version": "2.0.0",
        "agents": ["BudgetAgent", "DestinationAgent", "TravelAgent", "HotelAgent", "ItineraryAgent", "NotificationAgent"],
        "docs": "/docs"
    }

@app.get("/health")
def health():
    return {"status": "healthy", "agents_ready": True}
