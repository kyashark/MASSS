# app/routers/rl_bridge.py
#
# ONE endpoint only. Session writes go through the existing /sessions router.

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.rl_bridge_service import RLBridgeService

router = APIRouter()


@router.get("/rl/bridge/recommend/{user_id}")
def get_recommendation(
    user_id: int,
    active_slot: str = "Morning",
    db: Session = Depends(get_db),
):
    """
    Returns the top RL-recommended task for the active slot.
    Card B displays this and passes it to PomoSession on launch.
    """
    return RLBridgeService(db, user_id).get_top_recommendation(active_slot)
