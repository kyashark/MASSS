from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Literal

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.services.rl_client import get_rl_schedule
from app.services.scheduling import SchedulingService

router = APIRouter(prefix="/schedule", tags=["AI Scheduler"])

SlotName = Literal["morning", "afternoon", "evening"]


@router.get("/heuristic")
def get_heuristic_schedule(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Runs the rule-based heuristic scheduler.
    Always available — no RL model needed.
    Used as a baseline and fallback.
    """
    service = SchedulingService(db)
    plan = service.get_today_schedule(user_id=current_user.id)
    plan["strategy_used"] = "Heuristic (Baseline)"
    return plan


@router.get("/rl")
def get_rl_schedule_endpoint(
    active_slot: SlotName = "morning",
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Calls the RL microservice to generate a schedule.
    Falls back to empty schedule if RL service is unavailable.
    The RL service handles all model logic — this router
    only fetches data and passes it through.
    """
    return get_rl_schedule(
        user_id=current_user.id,
        db=db,
        active_slot=active_slot,
    )
