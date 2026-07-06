from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .config import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True) # Firebase UID
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    preferences = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)

    trips = relationship("Trip", back_populates="owner")
    favorites = relationship("Favorite", back_populates="user")
    saved_places = relationship("SavedPlace", back_populates="user")
    notifications = relationship("Notification", back_populates="user")


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    title = Column(String)
    source = Column(String)
    destination = Column(String)
    start_date = Column(String)
    end_date = Column(String)
    budget = Column(Float)
    currency = Column(String)
    travelers = Column(Integer)
    travel_type = Column(String)
    status = Column(String, default="draft") # draft, generated, confirmed
    
    # LangGraph Output Data
    itinerary_data = Column(JSON, default={})
    flight_data = Column(JSON, default={})
    hotel_data = Column(JSON, default={})
    budget_analysis = Column(JSON, default={})
    
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="trips")
    destinations = relationship("TripDestination", back_populates="trip", cascade="all, delete-orphan")
    itinerary = relationship("TripItinerary", back_populates="trip", cascade="all, delete-orphan")


class Favorite(Base):
    __tablename__ = "favorites"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    place_name = Column(String)
    country = Column(String)
    img_url = Column(String)
    
    user = relationship("User", back_populates="favorites")


class TripDestination(Base):
    __tablename__ = "trip_destinations"
    
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"))
    name = Column(String)
    country = Column(String)
    estimated_cost = Column(Float)
    match_score = Column(Integer)
    
    trip = relationship("Trip", back_populates="destinations")


class TripItinerary(Base):
    __tablename__ = "trip_itinerary"
    
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"))
    day = Column(Integer)
    date = Column(String)
    title = Column(String)
    activities = Column(JSON, default=[])
    daily_budget = Column(Float)
    
    trip = relationship("Trip", back_populates="itinerary")


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    type = Column(String)
    message = Column(String)
    priority = Column(String, default="low")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="notifications")


class SavedPlace(Base):
    __tablename__ = "saved_places"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    place_id = Column(String) # Google Place ID
    name = Column(String)
    category = Column(String) # hotel, restaurant, attraction
    address = Column(String)
    rating = Column(Float, default=0.0)
    image_url = Column(String)
    
    user = relationship("User", back_populates="saved_places")
