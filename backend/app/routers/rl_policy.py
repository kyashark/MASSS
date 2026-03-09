# app/routers/rl_policy.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.rl_policy_service import RLPolicyService

router = APIRouter()


@router.get("/rl/policy/{user_id}")
def get_policy_analytics(
    user_id: int,
    active_slot: str = "Morning",
    db: Session = Depends(get_db),
):
    """
    Card 5: Policy Analytics
    Returns slot score drift, policy confidence, and category preference drift.
    """
    return RLPolicyService(db, user_id).get_policy_analytics(active_slot)
