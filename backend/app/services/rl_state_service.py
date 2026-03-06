"""
rl_dashboard_service.py
------------------------
Translates raw RL engine signals into a human-readable state vector
for the dashboard's State Vector card.

This is NOT the RL agent's input (that is state_builder.py → 555-dim numpy array).
This is the DASHBOARD's input (human-readable dict for the panel demo).

Location: app/services/rl_dashboard_service.py
"""

from app.rl_engine.analytics import UserAnalyticsService
from sqlalchemy.orm import Session


class RLStateService:
    SLOT_HOURS = {
        "Morning": (6, 12),
        "Afternoon": (12, 18),
        "Evening": (18, 24),
    }

    def __init__(self, db: Session, user_id: int):
        self.analytics = UserAnalyticsService(db, user_id)

    def get_state_vector(self, active_slot: str = "Morning") -> dict:
        """
        Translates RL signals into human-readable dashboard state.
        Includes 'is_live_slot' to prove temporal awareness to the panel.
        """
        # 1. Determine the actual live slot based on current time
        current_hour = self.analytics.today.hour
        live_slot = (
            "Morning"
            if 6 <= current_hour < 12
            else "Afternoon"
            if 12 <= current_hour < 18
            else "Evening"
        )

        # 2. dim_555: workload intensity
        work_intensity = self.analytics._calculate_work_intensity()

        # 3. dim_554: per-slot cognitive fatigue
        slot_fatigue = {
            slot: self.analytics._calculate_slot_cognitive_fatigue(slot, start, end)
            for slot, (start, end) in self.SLOT_HOURS.items()
        }
        active_fatigue = slot_fatigue[active_slot]

        # 4. Energy battery (Slot-specific inferred scores)
        raw_energy = {
            slot: self.analytics._calculate_slot_energy(
                slot, start, end, work_intensity
            )
            for slot, (start, end) in self.SLOT_HOURS.items()
        }

        def _energy_label(score_01: float) -> str:
            return (
                "HIGH" if score_01 >= 0.65 else "MEDIUM" if score_01 >= 0.40 else "LOW"
            )

        energy_battery = {
            slot: {
                "score": round((raw - 1.0) / 4.0, 2),
                "label": _energy_label((raw - 1.0) / 4.0),
            }
            for slot, raw in raw_energy.items()
        }

        # 5. Sliding window focus history
        history = self.analytics._get_recent_performance_history()
        focus_history = [round(f, 1) for f in list(reversed(history))]

        # 6. Trend and Cognitive Label
        trend = (
            "Positive"
            if (len(history) >= 2 and history[0] >= history[1])
            else "Declining"
            if len(history) >= 2
            else "Neutral"
        )

        cognitive_label = (
            "FRESH"
            if active_fatigue < 0.40
            else "FATIGUING"
            if active_fatigue < 0.70
            else "BURNOUT RISK"
        )

        return {
            "cognitive_fatigue": active_fatigue,
            "cognitive_label": cognitive_label,
            "is_live_slot": active_slot == live_slot,  # PROOF OF TEMPORAL CONTEXT
            "live_slot_name": live_slot,
            "slot_fatigue": {s: round(v, 2) for s, v in slot_fatigue.items()},
            "workload_intensity": round(work_intensity, 2),
            "focus_history": focus_history,
            "energy_battery": energy_battery,
            "category_strengths": {
                k: round(v, 2)
                for k, v in self.analytics._calculate_category_bias().items()
            },
            "trend": trend,
            "active_slot": active_slot,
        }
