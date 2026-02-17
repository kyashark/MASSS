# rl_engine/reward.py
from app.rl_engine.config import RLConfig


class RewardEngine:
    def __init__(self):
        self.cfg = RLConfig()

    def _safe_get(self, obj, key, default=None):
        if obj is None:
            return default
        if isinstance(obj, dict):
            return obj.get(key, default)
        return getattr(obj, key, default)

    def calculate_reward(
        self, task, action_result, user_focus_rating, work_intensity=0.0
    ):
        """
        Calculates reward based on performance and academic necessity.

        Args:
            task: The task object.
            action_result: 'SUCCESS', 'FULL', 'INVALID', 'NO_OP'
            user_focus_rating: The focus level (1-5).
            work_intensity: The 'Crunch' score (0.0 - 1.0) from analytics.
        """
        reward = 0.0

        # --- 1. System Penalties (Hard Constraints) ---
        if action_result == "INVALID":
            return self.cfg.PENALTY_INVALID_ACTION
        if action_result == "FULL":
            return self.cfg.PENALTY_OVERLOAD
        if action_result == "NO_OP":
            return -0.1

        # --- 2. Contextual Weights (The "Coach" Logic) ---
        # During Crunch Mode (High Intensity), we care more about completion than fatigue.
        is_crunch = work_intensity > 0.8
        urgency_multiplier = 1.5 if is_crunch else 1.0
        fatigue_penalty_reduction = 0.5 if is_crunch else 1.0

        # A. Focus Rating (Fatigue)
        # If in crunch mode, we reduce the negative impact of low focus.
        rating = user_focus_rating if user_focus_rating else 3.0
        focus_reward = self.cfg.W_FOCUS * rating

        if rating < 3.0:  # Student is tired
            reward += focus_reward * fatigue_penalty_reduction
        else:
            reward += focus_reward

        # B. Task Completion (The "Big Win")
        sessions = self._safe_get(task, "sessions_count", 0)
        estimated = self._safe_get(task, "estimated_pomodoros", 1)

        if sessions + 1 >= estimated:
            # Completing a task during exams is worth much more!
            reward += self.cfg.W_COMPLETION * urgency_multiplier

        # C. Delay/Urgency Penalty
        days_due = self._safe_get(task, "days_until", 10)
        if days_due < 0:
            reward -= self.cfg.W_DELAY * abs(days_due) * urgency_multiplier
        elif days_due <= 1:
            # Bonus for hitting a deadline just in time during crunch
            reward += 5.0 * urgency_multiplier

        # --- 3. Momentum & Continuity ---
        status = self._safe_get(task, "status", "PENDING")
        if hasattr(status, "name"):
            status = status.name

        if status == "IN_PROGRESS":
            reward += 5.0  # Encourages finishing what you started

        return reward
