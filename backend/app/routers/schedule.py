from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import SessionLocal
from app.services.scheduling import SchedulingService
from app.schemas.schedule import ForecastResponse
from app.dependencies.auth import get_current_user 

router = APIRouter(prefix="/schedule", tags=["AI Scheduler"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Combined Route: Defaults to 3 days, can ask for 7
@router.get("/", response_model=ForecastResponse)
def get_schedule_forecast(
    days: int = Query(3, ge=1, le=7), # Limit max days to 7 for performance
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Returns a multi-day schedule forecast.
    - Default: 3 Days
    - Simulation: Tasks scheduled on Day 1 will not appear on Day 2 (unless incomplete).
    """
    service = SchedulingService(db)
    return service.generate_forecast(user_id=current_user.id, days=days)