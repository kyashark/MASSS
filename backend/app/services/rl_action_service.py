"""
app/services/rl_action_service.py
----------------------------------
Computes the PPO policy's action probability distribution
for the dashboard's Action Probability card (Card 2).

This is NOT the real PPO forward pass (that lives in agent.py).
This is a HUMAN-READABLE decomposition of why the agent scored
each candidate task the way it did — for panel visualization.

Data flow:
  rl_action_service.py
      → calls UserAnalyticsService  (slot energy, category bias)
      → queries pending Tasks        (candidates)
      → scores each task             (slot_bias x category_bias x urgency x difficulty_fit)
      → softmax → probabilities
      → returns ranked list with per-signal breakdown
"""

from math import exp
from sqlalchemy.orm import Session
from datetime import datetime

from app.rl_engine.analytics import UserAnalyticsService
from app.models.task import Task
from app.models.module import Module


class RLActionService:
    """
    Produces the action probability distribution the dashboard card shows.

    Response shape per action:
    {
        "task_id":      7,
        "task_name":    "Integration Calculus",
        "category":     "Math",
        "difficulty":   4,
        "priority":     "HIGH",
        "probability":  41,          <- % after softmax (all sum to 100)
        "raw_score":    0.847,       <- before softmax
        "is_selected":  true,        <- highest prob = agent's chosen action
        "signals": {
            "slot_bias":      0.82,  <- how well this slot fits the student
            "category_bias":  0.74,  <- historical completion rate for category
            "urgency":        0.60,  <- deadline proximity score
            "difficulty_fit": 0.70,  <- difficulty vs current energy level
        }
    }
    """

    SOFTMAX_TEMPERATURE = 1.2  # higher = flatter dist (more exploration feel)
    MAX_CANDIDATES = 6  # max tasks shown on card

    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id
        self.today = datetime.now()
        self.analytics = UserAnalyticsService(db, user_id)

    def get_action_distribution(self, active_slot: str = "Morning") -> dict:
        """Main method — returns everything the Action Probability card needs."""

        SLOT_HOURS = {
            "Morning": (6, 12),
            "Afternoon": (12, 18),
            "Evening": (18, 24),
        }
        start, end = SLOT_HOURS[active_slot]

        # 1. context signals from analytics
        work_intensity = self.analytics._calculate_work_intensity()
        category_bias = self.analytics._calculate_category_bias()
        fatigue = self.analytics._calculate_slot_cognitive_fatigue(
            active_slot, start, end
        )
        slot_energy_raw = self.analytics._calculate_slot_energy(
            active_slot, start, end, work_intensity
        )
        slot_bias = round((slot_energy_raw - 1.0) / 4.0, 3)  # normalize 1-5 to 0-1

        # 2. fetch pending candidate tasks
        tasks = (
            self.db.query(Task)
            .outerjoin(Module, Task.module_id == Module.id)
            .filter(
                Task.user_id == self.user_id,
                Task.status != "COMPLETED",
            )
            .order_by(Task.deadline.asc().nullslast())
            .limit(20)
            .all()
        )

        if not tasks:
            return self._empty_response(active_slot)

        # 3. score each task using 4 signals
        scored = []
        for task in tasks:
            signals = self._compute_signals(task, slot_bias, category_bias, fatigue)
            raw = self._aggregate_score(signals)
            scored.append({"task": task, "signals": signals, "raw": raw})

        # 4. softmax over raw scores → probability distribution
        probs = self._softmax([s["raw"] for s in scored])

        # 5. sort by probability, take top N, re-normalise
        combined = sorted(zip(scored, probs), key=lambda x: x[1], reverse=True)
        combined = combined[: self.MAX_CANDIDATES]
        top_probs = [p for _, p in combined]
        total = sum(top_probs) or 1
        top_probs = [p / total for p in top_probs]

        # 6. build action list
        actions = []
        for i, ((item, _), norm_prob) in enumerate(zip(combined, top_probs)):
            task = item["task"]
            signals = item["signals"]
            actions.append(
                {
                    "task_id": task.id,
                    "task_name": task.name,
                    "category": self._get_category(task),
                    "difficulty": task.difficulty or 1,
                    "priority": self._priority_str(task),
                    "probability": round(norm_prob * 100),
                    "raw_score": round(item["raw"], 3),
                    "is_selected": i == 0,
                    "signals": {
                        "slot_bias": round(signals["slot_bias"], 2),
                        "category_bias": round(signals["category_bias"], 2),
                        "urgency": round(signals["urgency"], 2),
                        "difficulty_fit": round(signals["difficulty_fit"], 2),
                    },
                }
            )

        return {
            "active_slot": active_slot,
            "slot_bias": round(slot_bias, 2),
            "cognitive_fatigue": round(fatigue, 2),
            "actions": actions,
            "selected_action": actions[0] if actions else None,
            "temperature": self.SOFTMAX_TEMPERATURE,
            "total_candidates": len(tasks),
        }

    # ── signal calculators ─────────────────────────────────────────────────

    def _compute_signals(self, task, slot_bias, category_bias, fatigue) -> dict:
        cat = self._get_category(task)
        return {
            "slot_bias": slot_bias,
            "category_bias": category_bias.get(cat, 0.5),
            "urgency": self._urgency_score(task),
            "difficulty_fit": self._difficulty_fit(task, fatigue),
        }

    def _aggregate_score(self, signals: dict) -> float:
        """Weighted sum → raw action score fed into softmax."""
        return (
            0.30 * signals["slot_bias"]
            + 0.25 * signals["category_bias"]
            + 0.25 * signals["urgency"]
            + 0.20 * signals["difficulty_fit"]
        )

    def _urgency_score(self, task) -> float:
        if not task.deadline:
            return 0.20
        days = (task.deadline - self.today).days
        if days <= 0:
            return 1.00
        if days <= 1:
            return 0.85
        if days <= 3:
            return 0.65
        if days <= 7:
            return 0.40
        if days <= 14:
            return 0.20
        return 0.10

    def _difficulty_fit(self, task, fatigue: float) -> float:
        """
        Matches task difficulty to current energy level.
        High fatigue  → easy tasks fit better (low difficulty scores higher).
        Low fatigue   → hard tasks fit better (high difficulty scores higher).
        fit = 1 - |difficulty - energy|  (peaks when they match)
        """
        difficulty = (task.difficulty or 3) / 5.0  # normalize 1-5 to 0-1
        energy = 1.0 - fatigue  # invert fatigue to energy
        return round(1.0 - abs(difficulty - energy), 3)

    def _softmax(self, scores: list) -> list:
        T = self.SOFTMAX_TEMPERATURE
        exps = [exp(s / T) for s in scores]
        total = sum(exps) or 1
        return [e / total for e in exps]

    def _get_category(self, task) -> str:
        if hasattr(task, "module") and task.module:
            cat = getattr(task.module, "category", "Other")
            # Category enum uses values like "Math/Logic", "Coding" etc.
            return cat.value if hasattr(cat, "value") else str(cat)
        return "Other"

    def _priority_str(self, task) -> str:
        p = getattr(task, "priority", None)
        if p is None:
            return "LOW"
        # PriorityLevel uses "Low"/"Medium"/"High" — normalise to uppercase for display
        raw = p.value if hasattr(p, "value") else str(p)
        return raw.upper()

    def _empty_response(self, active_slot: str) -> dict:
        """Enhanced empty state for a better User Experience (UX)."""
        return {
            "active_slot": active_slot,
            "slot_bias": 0.0,
            "cognitive_fatigue": 0.0,
            "actions": [],
            "selected_action": None,
            "temperature": self.SOFTMAX_TEMPERATURE,
            "total_candidates": 0,
            "message": "Add more tasks to your modules to see AI-optimized recommendations.",  # The Tip
        }
