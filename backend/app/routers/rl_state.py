"""
routers/rl_state.py
--------------------
HTTP layer only. No business logic here.
Calls RLDashboardService and returns the result.

Register in main.py:
    from app.routers.rl_state import router as rl_router
    app.include_router(rl_router)
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Literal

from app.core.database import get_db
from app.services.rl_state_service import RLStateService

router = APIRouter(prefix="/rl", tags=["RL State"])
SlotName = Literal["Morning", "Afternoon", "Evening"]


@router.get("/state-vector/{user_id}")
def get_state_vector(
    user_id: int,
    active_slot: SlotName = Query(default="Morning"),
    db: Session = Depends(get_db),
):
    """
    GET /rl/state-vector/{user_id}?active_slot=Morning

    Returns the human-readable RL state vector for the dashboard card.
    active_slot controls which slot's dim_554 is returned as cognitive_fatigue.
    All 3 slot values are included in slot_fatigue{} so the frontend
    can switch slots without an extra API call.
    """
    svc = RLStateService(db, user_id)
    return svc.get_state_vector(active_slot=active_slot)
