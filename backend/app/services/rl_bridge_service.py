"""
app/services/rl_bridge_service.py
-----------------------------------
Card B: AI-Action Bridge — RECOMMENDATION ONLY

Session start/end is handled by the EXISTING /sessions router.
This service only fetches the RL top recommendation.

Flow:
  GET /api/rl/bridge/recommend/{user_id}?active_slot=Morning
    → Card B shows the task + RL signals
    → "Launch Session" opens existing <PomoSession task={...} />
    → PomoSession calls POST /sessions/start  (existing router)
    → PomoSession calls POST /sessions/{id}/end  (existing router)
    → Card 3 reads the new session row → reward breakdown
"""

from sqlalchemy.orm import Session, joinedload
from app.rl_engine.analytics import get_effective_days_until, get_effective_deadline
from app.models.task import Task


class RLBridgeService:
    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id

    def get_top_recommendation(self, active_slot: str = "Morning") -> dict:
        """
        Returns the top RL-recommended task for the given slot.
        Delegates entirely to RLActionService — same source as Card 2.
        Includes all fields PomoSession needs to launch immediately.
        """
        from app.services.rl_action_service import RLActionService

        dist = RLActionService(self.db, self.user_id).get_action_distribution(
            active_slot
        )
        selected = dist.get("selected_action")

        if not selected:
            return {"error": "No recommended task available"}

        task = self._fetch_task(selected["task_id"])
        if not task:
            return {"error": "Recommended task not found"}

        return {
            # ── PomoSession launch fields ────────────────────────────────
            "task_id": task.id,
            "task_name": task.name,
            "status": task.status.value
            if hasattr(task.status, "value")
            else str(task.status),
            "sessions_count": task.sessions_count or 0,
            "estimated_pomodoros": task.estimated_pomodoros or 1,
            # ── Card B display fields ────────────────────────────────────
            "module": task.module.name if task.module else "General",
            "category": self._get_category(task),
            "priority": self._priority_str(task),
            "difficulty": task.difficulty or 1,
            "probability": selected.get("probability", 0),
            "signals": selected.get("signals", {}),
            "days_until": get_effective_days_until(task),
            "deadline_source": self._deadline_source(task),
            "slot": active_slot,
            # ── Context strip ────────────────────────────────────────────
            "is_crunch": dist.get("is_crunch", False),
            "work_intensity": dist.get("work_intensity", 0.0),
            "cognitive_fatigue": dist.get("cognitive_fatigue", 0.0),
        }

    # ── private helpers ──────────────────────────────────────────────────────

    def _fetch_task(self, task_id: int):
        return (
            self.db.query(Task)
            .options(joinedload(Task.module), joinedload(Task.exam))
            .filter(Task.id == task_id, Task.user_id == self.user_id)
            .first()
        )

    def _deadline_source(self, task) -> str | None:
        if getattr(task, "deadline", None):
            return "task"
        return "exam" if get_effective_deadline(task) is not None else None

    def _get_category(self, task) -> str:
        if task.module:
            cat = getattr(task.module, "category", "Other")
            return cat.value if hasattr(cat, "value") else str(cat)
        return "Other"

    def _priority_str(self, task) -> str:
        p = getattr(task, "priority", None)
        if p is None:
            return "LOW"
        return (p.value if hasattr(p, "value") else str(p)).upper()
