import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.database.config import SessionLocal
from app.database.models import Trip, Notification
from app.services.weather import get_forecast

logger = logging.getLogger(__name__)

async def check_weather_updates():
    """Periodic job to check weather for active trips and create notifications."""
    db = SessionLocal()
    try:
        # Get active trips
        active_trips = db.query(Trip).filter(Trip.status == "generated").all()
        for trip in active_trips:
            # In a real app we'd only check if start_date is approaching
            weather = await get_forecast(trip.destination)
            if weather:
                msg = f"Latest weather update for {trip.destination}: {weather['forecast_summary']}"
                
                # Check if we already sent this recently
                last_notif = db.query(Notification).filter(
                    Notification.user_id == trip.user_id,
                    Notification.message == msg
                ).first()
                
                if not last_notif:
                    new_notif = Notification(
                        user_id=trip.user_id,
                        type="weather",
                        message=msg,
                        priority="low"
                    )
                    db.add(new_notif)
                    logger.info(f"Generated weather notification for {trip.user_id}")
        
        db.commit()
    except Exception as e:
        logger.error(f"Scheduler error: {e}")
    finally:
        db.close()

def start_scheduler():
    scheduler = AsyncIOScheduler()
    # Run every 30 minutes. Setting to 1 minute for local testing can be annoying.
    scheduler.add_job(check_weather_updates, 'interval', minutes=30)
    scheduler.start()
    logger.info("APScheduler started")
    return scheduler
