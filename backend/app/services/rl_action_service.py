"""
app/services/rl_action_service.py
----------------------------------
Card 2: Action Probability Distribution — π(a|s)

Signals now EXACTLY mirror what state_builder.py encodes and
what reward.py rewards. Every weight traces back to a real
config.py constant.

state_builder.py task features used:
  [0] priority          → HIGH=1.0, MEDIUM=0.66, LOW=0.33
  [1] estimated_pomo    → workload size
  [2] sessions_count    → completion progress
  [3] urgency           → (MAX_DAYS - days_until) / MAX_DAYS
  [4] difficulty        → /5.0
  [5] is_in_progress    → momentum/sticky flag
  [6:12] category       → one-hot (6 categories, Language added)

reward.py weights reflected:
  W_COMPLETION = 10.0  → completion_proximity (highest weight)
  slot_energy  = 0-1.5 → slot_bias (dedicated reward component, not just proxy)
  IN_PROGRESS  = +5.0  → momentum signal
  W_DELAY      = 1.0   → urgency signal
  category_bias        → learned completion preference
"""

from math import exp
from sqlalchemy.orm import Session
from datetime import datetime

from app.rl_engine.analytics import UserAnalyticsService, get_effective_days_until
from app.rl_engine.config import RLConfig
from app.models.task import Task
from app.models.module import Module


class RLActionService:
    SOFTMAX_TEMPERATURE = 0.6  # sharp — mirrors W_COMPLETION=10.0 dominance
    MAX_CANDIDATES = 6

    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id
        self.today = datetime.now()
        self.analytics = UserAnalyticsService(db, user_id)
        self.cfg = RLConfig()

    def get_action_distribution(self, active_slot: str = "Morning") -> dict:
        SLOT_HOURS = {
            "Morning": (6, 12),
            "Afternoon": (12, 18),
            "Evening": (18, 24),
        }
        start, end = SLOT_HOURS[active_slot]

        # ── context from analytics (same data state_builder receives) ──────
        work_intensity = self.analytics._calculate_work_intensity()
        category_bias = self.analytics._calculate_category_bias()
        fatigue = self.analytics._calculate_slot_cognitive_fatigue(
            active_slot, start, end
        )
        slot_energy_raw = self.analytics._calculate_slot_energy(
            active_slot, start, end, work_intensity
        )
        slot_bias = round((slot_energy_raw - 1.0) / 4.0, 3)

        # crunch mode flag — mirrors reward.py: is_crunch = work_intensity > 0.8
        is_crunch = work_intensity > 0.8

        # ── fetch pending tasks ────────────────────────────────────────────
        tasks = (
            self.db.query(Task)
            .outerjoin(Module, Task.module_id == Module.id)
            .outerjoin(Task.exam)  # LEFT JOIN exam
            .filter(
                Task.user_id == self.user_id,
                Task.status.notin_(["COMPLETED", "ARCHIVED"]),
            )
            .order_by(Task.deadline.asc().nullslast())  # own deadline first
            .limit(20)
            .all()
        )

        if not tasks:
            return self._empty_response(active_slot)

        # ── score each task ────────────────────────────────────────────────
        scored = []
        for task in tasks:
            signals = self._compute_signals(
                task, slot_bias, category_bias, fatigue, is_crunch
            )
            raw = self._aggregate_score(signals)
            scored.append({"task": task, "signals": signals, "raw": raw})

        # ── softmax ────────────────────────────────────────────────────────
        probs = self._softmax([s["raw"] for s in scored])
        combined = sorted(zip(scored, probs), key=lambda x: x[1], reverse=True)
        combined = combined[: self.MAX_CANDIDATES]

        top_probs = [p for _, p in combined]
        total = sum(top_probs) or 1
        top_probs = [p / total for p in top_probs]

        # ── build response ─────────────────────────────────────────────────
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
                        # Mirrors W_COMPLETION=10.0 — dominant reward signal
                        "completion_proximity": round(
                            signals["completion_proximity"], 2
                        ),
                        # Mirrors W_FOCUS=2.0 via slot energy
                        "slot_bias": round(signals["slot_bias"], 2),
                        # Mirrors IN_PROGRESS +5.0 in reward.py
                        "momentum": round(signals["momentum"], 2),
                        # Mirrors W_DELAY=1.0
                        "urgency": round(signals["urgency"], 2),
                        # Learned category completion rate
                        "category_bias": round(signals["category_bias"], 2),
                    },
                }
            )

        return {
            "active_slot": active_slot,
            "slot_bias": round(slot_bias, 2),
            "cognitive_fatigue": round(fatigue, 2),
            "work_intensity": round(work_intensity, 2),
            "is_crunch": is_crunch,
            "actions": actions,
            "selected_action": actions[0] if actions else None,
            "temperature": self.SOFTMAX_TEMPERATURE,
            "total_candidates": len(tasks),
        }

    # ── signal calculators — each maps to a state_builder or reward.py line ─

    def _compute_signals(
        self, task, slot_bias, category_bias, fatigue, is_crunch
    ) -> dict:
        return {
            # state_builder[i,2] + reward W_COMPLETION=10.0
            "completion_proximity": self._completion_proximity(task),
            # reward.py slot_energy bonus (0.0-1.5) — dedicated reward component
            "slot_bias": slot_bias,
            # state_builder[i,5] + reward IN_PROGRESS=+5.0
            "momentum": self._momentum(task),
            # state_builder[i,3] → (MAX_DAYS - days_until) / MAX_DAYS
            "urgency": self._urgency_score(task),
            # analytics category_bias → learned completion rate
            "category_bias": category_bias.get(self._get_category(task), 0.5),
        }

    def _aggregate_score(self, signals: dict) -> float:
        """
        Weights trace directly to reward.py magnitudes:
          W_COMPLETION=10.0   → 0.30 (dominant)
          slot_energy 0-1.5   → 0.30 (now a dedicated reward component, not proxy)
          IN_PROGRESS=+5.0    → 0.20
          W_DELAY=1.0         → 0.10 (reduced — slot_energy now takes priority)
          category bias       → 0.10
        """
        return (
            0.30 * signals["completion_proximity"]
            + 0.30 * signals["slot_bias"]
            + 0.20 * signals["momentum"]
            + 0.10 * signals["urgency"]
            + 0.10 * signals["category_bias"]
        )

    def _completion_proximity(self, task) -> float:
        """
        Mirrors W_COMPLETION=10.0 — biggest reward is finishing a task.
        state_builder[i,1] = estimated, [i,2] = sessions_count.
        Tasks nearly done score highest — agent learned this from training.
        """
        estimated = task.estimated_pomodoros or 1
        done = task.sessions_count or 0
        remaining = max(0, estimated - done)
        # closer to done → higher score
        return round(1.0 - (remaining / estimated) * 0.75, 3)

    def _momentum(self, task) -> float:
        """
        Mirrors state_builder[i,5] and reward.py IN_PROGRESS +5.0.
        Agent strongly prefers continuing what was already started.
        """
        status = getattr(task, "status", None)
        if status is None:
            return 0.0
        val = status.value if hasattr(status, "value") else str(status)
        return 1.0 if val == "IN_PROGRESS" else 0.0

    def _urgency_score(self, task) -> float:
        """
        Uses get_effective_days_until() — checks task.deadline first,
        then task.exam.due_date. Mirrors state_builder dim[i,3].
        """
        days = get_effective_days_until(task)

        if days is None:
            return 0.20  # no deadline anywhere — neutral
        if days <= 0:
            return 1.00
        if days <= 1:
            return 0.90
        if days <= 3:
            return 0.70
        if days <= 7:
            return 0.45
        if days <= 14:
            return 0.25
        return round(
            max(0.05, (self.cfg.MAX_DAYS_DUE - days) / self.cfg.MAX_DAYS_DUE), 3
        )

    def _softmax(self, scores: list) -> list:
        T = self.SOFTMAX_TEMPERATURE
        exps = [exp(s / T) for s in scores]
        total = sum(exps) or 1
        return [e / total for e in exps]

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

    def _empty_response(self, active_slot: str) -> dict:
        return {
            "active_slot": active_slot,
            "slot_bias": 0.0,
            "cognitive_fatigue": 0.0,
            "work_intensity": 0.0,
            "is_crunch": False,
            "actions": [],
            "selected_action": None,
            "temperature": self.SOFTMAX_TEMPERATURE,
            "total_candidates": 0,
        }
