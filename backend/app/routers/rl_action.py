# app/routers/rl_action.py
# Register in main.py:
#   from app.routers.rl_action import router as rl_action_router
#   app.include_router(rl_action_router, prefix="/api")

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Literal

from app.core.database import get_db
from app.services.rl_action_service import RLActionService

router = APIRouter(prefix="/rl", tags=["RL Action"])
SlotName = Literal["Morning", "Afternoon", "Evening"]


@router.get("/action-distribution/{user_id}")
def get_action_distribution(
    user_id: int,
    active_slot: SlotName = Query(default="Morning"),
    db: Session = Depends(get_db),
):
    """
    GET /api/rl/action-distribution/{user_id}?active_slot=Morning

    Returns the PPO policy's action probability distribution.
    Each action is a candidate task scored by 4 signals:
      - slot_bias      (how well this slot fits the student's history)
      - category_bias  (historical completion rate for this category)
      - urgency        (deadline proximity)
      - difficulty_fit (task difficulty vs current cognitive energy)

    Response:
    {
        "active_slot":       "Morning",
        "slot_bias":         0.78,
        "cognitive_fatigue": 0.32,
        "temperature":       1.2,
        "total_candidates":  8,
        "selected_action":   { ...highest probability action... },
        "actions": [
            {
                "task_id":      7,
                "task_name":    "Integration Calculus",
                "category":     "Math",
                "difficulty":   4,
                "priority":     "HIGH",
                "probability":  41,
                "raw_score":    0.847,
                "is_selected":  true,
                "signals": {
                    "slot_bias":      0.78,
                    "category_bias":  0.74,
                    "urgency":        0.65,
                    "difficulty_fit": 0.70
                }
            },
            ...
        ]
    }
    """
    svc = RLActionService(db, user_id)
    return svc.get_action_distribution(active_slot=active_slot)
