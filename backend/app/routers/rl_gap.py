# app/routers/rl_gap.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.rl_gap_service import RLGapService

router = APIRouter()


@router.get("/rl/gap/{user_id}")
def get_gap_analysis(
    user_id: int,
    active_slot: str = "Morning",
    db: Session = Depends(get_db),
):
    """
    Card 6: Say vs Do Gap
    Compares agent recommendations vs student behaviour.
    Returns alignment history, gap stats, and reward comparison.
    """
    return RLGapService(db, user_id).get_gap_analysis(active_slot)
