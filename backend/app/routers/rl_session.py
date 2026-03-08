# app/routers/rl_session.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.rl_session_service import RLSessionService

router = APIRouter()


@router.get("/rl/session/{user_id}")
def get_session_reward(user_id: int, db: Session = Depends(get_db)):
    """
    Card 3: Returns reward breakdown for the most recent PomodoroSession.

    Every field in reward_breakdown maps directly to a step in reward.py:
      slot_energy_bonus  → step 3
      focus_reward       → step 4
      fatigue_penalty    → step 5
      completion_bonus   → step 6
      deadline_bonus     → step 7a
      delay_penalty      → step 7b
      momentum_bonus     → step 8
    """
    service = RLSessionService(db, user_id)
    return service.get_session_reward()
