from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Literal

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.services.rl_client import get_rl_state

router = APIRouter(prefix="/rl", tags=["RL State"])

SlotName = Literal["morning", "afternoon", "evening"]


@router.get("/state-vector")
def get_state_vector(
    active_slot: SlotName = Query(default="morning"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Returns the human-readable RL state vector for the dashboard.
    Calls the RL microservice — no RL logic in this router.
    """
    return get_rl_state(
        user_id=current_user.id,
        db=db,
        active_slot=active_slot,
    )
