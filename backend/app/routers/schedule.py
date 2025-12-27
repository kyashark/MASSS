from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, List

from app.core.database import SessionLocal
from app.services.scheduling import SchedulingService
from app.schemas.schedule import ScheduleResponse
from app.dependencies.auth import get_current_user 

router = APIRouter(prefix="/schedule", tags=["AI Scheduler"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/today", response_model=ScheduleResponse)
def get_today_schedule(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Generates a Daily Plan for the current user.
    """
    service = SchedulingService(db)
    plan = service.get_today_schedule(user_id=current_user.id)
    
    # Safety: Ensure keys exist even if empty
    return ScheduleResponse(
        Morning=plan.get("Morning", []),
        Afternoon=plan.get("Afternoon", []),
        Evening=plan.get("Evening", [])
    )