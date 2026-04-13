# rl_engine/reward.py
from datetime import datetime
from app.engine.config import RLConfig
from app.engine.analytics import get_effective_deadline


class RewardEngine:
    def __init__(self):
        self.cfg = RLConfig()

    def _safe_get(self, obj, key, default=None):
        if obj is None:
            return default
        if isinstance(obj, dict):
            return obj.get(key, default)
        return getattr(obj, key, default)

    def _get_days_until(self, task) -> int:
        if not isinstance(task, dict):
            deadline = get_effective_deadline(task)
            if deadline is not None:
                return (deadline - datetime.now()).days
            return 30
        days = task.get("days_until", 10)
        # Explicitly null means no deadline — treat as 30 days
        if days is None:
            return 30
        return days

    def calculate_reward(
        self,
        task,
        action_result,
        user_focus_rating,
        work_intensity=0.0,
        slot_energy=3.0,
    ):
        """
        Reward components:
          + slot_energy bonus (0.0-1.5)        NEW: teaches slot preference
          + W_FOCUS(2.0) x focus_rating
          + W_COMPLETION(10.0) x urgency_mult   if task finished
          + 5.0 x urgency_mult                  if deadline <= 1 day
          - W_DELAY(1.0) x days_overdue         if overdue
          + 5.0                                 if IN_PROGRESS
          - 2.0 PENALTY_FATIGUE_IGNORE          if Hard + tired + not crunch

        slot_energy (1.0-5.0 from analytics energy_map):
          Normalised to 0.0-1.5 bonus reward.
          Morning=4.0 -> +1.125, Afternoon=3.0 -> +0.75, Evening=2.0 -> +0.375
          Agent learns: same task in a better energy slot = better reward.
          Without this all 3 slots give identical reward -> agent always
          picks slot_idx=0 (Morning) and never explores Afternoon/Evening.
        """
        reward = 0.0

        # 1. Hard constraint penalties
        if action_result == "INVALID":
            return self.cfg.PENALTY_INVALID_ACTION  # -5.0
        if action_result == "FULL":
            return self.cfg.PENALTY_OVERLOAD  # -10.0
        if action_result == "NO_OP":
            return -1.0  # raised from -0.1 so agent avoids NO-OP

        # 2. Crunch mode
        is_crunch = work_intensity > 0.8
        urgency_multiplier = self.cfg.REWARD_CRUNCH_MULTIPLIER if is_crunch else 1.0
        fatigue_penalty_reduction = self.cfg.FATIGUE_PENALTY_GRACE if is_crunch else 1.0

        # 3. Slot energy bonus (the key fix)
        slot_bonus = ((slot_energy - 1.0) / 4.0) * 1.5
        reward += slot_bonus

        # 4. Focus / fatigue reward
        rating = user_focus_rating if user_focus_rating else 3.0
        focus_reward = self.cfg.W_FOCUS * rating
        if rating < 3.0:
            reward += focus_reward * fatigue_penalty_reduction
        else:
            reward += focus_reward

        # 5. Fatigue-ignore penalty
        # fatigue_penalty_reduction (0.5 in crunch, 1.0 otherwise) also applied here
        # so crunch mode consistently softens ALL fatigue-related penalties.
        difficulty = self._safe_get(task, "difficulty", 3)
        if difficulty >= 4 and rating < 3.0 and not is_crunch:
            reward += (
                self.cfg.PENALTY_FATIGUE_IGNORE * fatigue_penalty_reduction
            )  # -2.0 or -1.0

        # 6. Task completion bonus
        sessions = self._safe_get(task, "sessions_count", 0)
        estimated = self._safe_get(task, "estimated_pomodoros", 1)
        if sessions + 1 >= estimated:
            reward += self.cfg.W_COMPLETION * urgency_multiplier

        # 7. Deadline urgency
        days_due = self._get_days_until(task)
        if days_due < 0:
            reward -= self.cfg.W_DELAY * abs(days_due) * urgency_multiplier
        elif days_due <= 1:
            reward += 5.0 * urgency_multiplier

        # 8. Momentum
        status = self._safe_get(task, "status", "pending")
        if hasattr(status, "value"):
            status = status.value
        elif hasattr(status, "name"):
            status = status.name
        # Normalize to lowercase for comparison
        if str(status).lower() == "in_progress":
            reward += 5.0

        return reward
