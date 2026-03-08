"""
app/services/rl_session_service.py
------------------------------------
Card 3: AI Selected Session (The Execution)

Fetches the most recent PomodoroSession for a user, then computes
the exact reward breakdown using RewardEngine — the same calculation
the RL agent uses during training and inference.

Every component mirrors reward.py exactly so the card is a live
window into the actual reward signal the model receives.
"""

from sqlalchemy.orm import Session, joinedload
from datetime import datetime

from app.rl_engine.analytics import (
    UserAnalyticsService,
    get_effective_days_until,
    get_effective_deadline,
)
from app.rl_engine.config import RLConfig
from app.models.session import PomodoroSession, SessionEndType
from app.models.task import Task


SLOT_HOURS = {
    "Morning": (6, 12),
    "Afternoon": (12, 18),
    "Evening": (18, 24),
}


class RLSessionService:
    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id
        self.cfg = RLConfig()
        self.analytics = UserAnalyticsService(db, user_id)

    def get_session_reward(self) -> dict:
        """
        Returns reward breakdown for the most recent PomodoroSession.
        Computes every reward.py component with real session values.
        """
        session = self._fetch_latest_session()
        if not session:
            return self._empty_response()

        task = session.task
        if not task:
            return self._empty_response()

        # ── context ────────────────────────────────────────────────────────
        work_intensity = self.analytics._calculate_work_intensity()
        slot_name = self._resolve_slot(session)
        start, end = SLOT_HOURS.get(slot_name, (6, 12))
        slot_energy = self.analytics._calculate_slot_energy(
            slot_name, start, end, work_intensity
        )

        # ── real values from actual session ────────────────────────────────
        focus_rating = float(session.focus_rating) if session.focus_rating else 3.0
        is_crunch = work_intensity > 0.8

        urgency_multiplier = self.cfg.REWARD_CRUNCH_MULTIPLIER if is_crunch else 1.0
        fatigue_penalty_reduction = self.cfg.FATIGUE_PENALTY_GRACE if is_crunch else 1.0

        days_until = get_effective_days_until(task)
        deadline_source = self._deadline_source(task)
        days_due = days_until if days_until is not None else 30

        # ── reward components — mirrors reward.py exactly ──────────────────

        # Component 1: Slot energy bonus (reward.py step 3)
        slot_energy_bonus = round(((slot_energy - 1.0) / 4.0) * 1.5, 3)

        # Component 2: Focus reward (reward.py step 4)
        focus_reward = round(self.cfg.W_FOCUS * focus_rating, 3)
        if focus_rating < 3.0:
            focus_reward = round(focus_reward * fatigue_penalty_reduction, 3)

        # Component 3: Fatigue-ignore penalty (reward.py step 5)
        difficulty = task.difficulty or 3
        fatigue_penalty = 0.0
        if difficulty >= 4 and focus_rating < 3.0 and not is_crunch:
            fatigue_penalty = round(
                self.cfg.PENALTY_FATIGUE_IGNORE * fatigue_penalty_reduction, 3
            )

        # Component 4: Completion bonus (reward.py step 6)
        sessions_done = task.sessions_count or 0
        estimated = task.estimated_pomodoros or 1
        completion_bonus = 0.0
        if sessions_done + 1 >= estimated:
            completion_bonus = round(self.cfg.W_COMPLETION * urgency_multiplier, 3)

        # Component 5: Deadline bonus / delay penalty (reward.py step 7)
        deadline_bonus = 0.0
        delay_penalty = 0.0
        if days_due < 0:
            delay_penalty = round(
                -self.cfg.W_DELAY * abs(days_due) * urgency_multiplier, 3
            )
        elif days_due <= 1:
            deadline_bonus = round(5.0 * urgency_multiplier, 3)

        # Component 6: Momentum bonus (reward.py step 8)
        status = task.status
        status_val = status.value if hasattr(status, "value") else str(status)
        momentum_bonus = 5.0 if status_val == "IN_PROGRESS" else 0.0

        total = round(
            slot_energy_bonus
            + focus_reward
            + fatigue_penalty
            + completion_bonus
            + deadline_bonus
            + delay_penalty
            + momentum_bonus,
            3,
        )

        # ── session outcome ────────────────────────────────────────────────
        end_type_val = (
            session.end_type.value
            if hasattr(session.end_type, "value")
            else str(session.end_type)
        )

        return {
            "session_id": session.id,
            "task_id": task.id,
            "task_name": task.name,
            "module": task.module.name if task.module else "General",
            "category": self._get_category(task),
            "slot": slot_name,
            "focus_rating": focus_rating,
            "end_type": end_type_val,
            "duration_minutes": session.duration_minutes or 0,
            "session_started_at": session.start_time.isoformat()
            if session.start_time
            else None,
            # Full breakdown — every line maps to a reward.py step
            "reward_breakdown": {
                "slot_energy_bonus": slot_energy_bonus,  # step 3
                "focus_reward": focus_reward,  # step 4
                "fatigue_penalty": fatigue_penalty,  # step 5  (0 if not triggered)
                "completion_bonus": completion_bonus,  # step 6  (0 if not finished)
                "deadline_bonus": deadline_bonus,  # step 7a (0 if not urgent)
                "delay_penalty": delay_penalty,  # step 7b (0 if not overdue)
                "momentum_bonus": momentum_bonus,  # step 8
                "total": total,
            },
            # Context used in the calculation
            "is_crunch": is_crunch,
            "urgency_multiplier": urgency_multiplier,
            "work_intensity": round(work_intensity, 3),
            "slot_energy": round(slot_energy, 3),
            "days_until": days_until,
            "deadline_source": deadline_source,
            # Task meta
            "difficulty": difficulty,
            "priority": self._priority_str(task),
            "sessions_done": sessions_done,
            "sessions_estimated": estimated,
            "task_completed": sessions_done + 1 >= estimated,
        }

    # ── helpers ─────────────────────────────────────────────────────────────

    def _fetch_latest_session(self):
        return (
            self.db.query(PomodoroSession)
            .options(
                joinedload(PomodoroSession.task).joinedload(Task.module),
                joinedload(PomodoroSession.task).joinedload(Task.exam),
            )
            .filter(PomodoroSession.user_id == self.user_id)
            .order_by(PomodoroSession.start_time.desc())
            .first()
        )

    def _resolve_slot(self, session) -> str:
        """Determine slot from session.slot_type or fall back to start_time hour."""
        slot_type = getattr(session, "slot_type", None)
        if slot_type:
            val = slot_type.value if hasattr(slot_type, "value") else str(slot_type)
            # Normalise to title case: "MORNING" → "Morning"
            for key in SLOT_HOURS:
                if val.upper() == key.upper():
                    return key
        # Fallback: infer from start_time
        if session.start_time:
            hour = session.start_time.hour
            if 6 <= hour < 12:
                return "Morning"
            if 12 <= hour < 18:
                return "Afternoon"
            return "Evening"
        return "Morning"

    def _deadline_source(self, task) -> str | None:
        if getattr(task, "deadline", None):
            return "task"
        if get_effective_deadline(task) is not None:
            return "exam"
        return None

    def _get_category(self, task) -> str:
        if hasattr(task, "module") and task.module:
            cat = getattr(task.module, "category", "Other")
            return cat.value if hasattr(cat, "value") else str(cat)
        return "Other"

    def _priority_str(self, task) -> str:
        p = getattr(task, "priority", None)
        if p is None:
            return "LOW"
        raw = p.value if hasattr(p, "value") else str(p)
        return raw.upper()

    def _empty_response(self) -> dict:
        return {
            "session_id": None,
            "task_id": None,
            "task_name": None,
            "module": None,
            "category": None,
            "slot": None,
            "focus_rating": None,
            "end_type": None,
            "duration_minutes": 0,
            "session_started_at": None,
            "reward_breakdown": {
                "slot_energy_bonus": 0.0,
                "focus_reward": 0.0,
                "fatigue_penalty": 0.0,
                "completion_bonus": 0.0,
                "deadline_bonus": 0.0,
                "delay_penalty": 0.0,
                "momentum_bonus": 0.0,
                "total": 0.0,
            },
            "is_crunch": False,
            "urgency_multiplier": 1.0,
            "work_intensity": 0.0,
            "slot_energy": 0.0,
            "days_until": None,
            "deadline_source": None,
            "difficulty": 1,
            "priority": "LOW",
            "sessions_done": 0,
            "sessions_estimated": 1,
            "task_completed": False,
        }
