"""
State builder / translator.
Builds RL-ready state representations.

FIXED: TASK_FEATURE_SIZE 11 → 12 because NUM_CATEGORIES changed 5 → 6
  (Language category was missing from CATEGORY_MAP, now added)

Old shape: (50 × 11) + 5 = 555
New shape: (50 × 12) + 5 = 605
"""

import numpy as np
from datetime import datetime
from app.engine.config import RLConfig
from app.engine.analytics import get_effective_deadline


class StateBuilder:
    def __init__(self):
        self.cfg = RLConfig()
        # Priority(1) + Est(1) + Done(1) + Urgency(1) + Diff(1) + Sticky(1) + Category(6)
        self.TASK_FEATURE_SIZE = 12  # was 11 — Language added to category one-hot

    def get_observation_space_shape(self):
        # (50 tasks × 12 features) + 3 slots + 1 fatigue + 1 work_intensity = 605
        return ((self.cfg.MAX_TASKS * self.TASK_FEATURE_SIZE) + 5,)

    def _safe_get(self, task, field, default=None):
        if isinstance(task, dict):
            return task.get(field, default)
        val = getattr(task, field, default)
        if hasattr(val, "name"):
            return val.name
        return val

    def build_state(self, tasks, capacity_map, recent_focus_ratings, work_intensity):
        """
        Builds the 605-dimension state representation.

        Per-task features (12 per task × 50 tasks = 600):
          [i, 0]    priority          HIGH=1.0, MEDIUM=0.66, LOW=0.33
          [i, 1]    estimated_pomo    / MAX_DURATION
          [i, 2]    sessions_count    / MAX_DURATION   (completion progress)
          [i, 3]    urgency           (MAX_DAYS - days_until) / MAX_DAYS
          [i, 4]    difficulty        / 5.0
          [i, 5]    is_in_progress    1.0 or 0.0       (momentum/sticky)
          [i, 6:12] category one-hot  6 categories

        Environmental signals (5):
          [600] Morning capacity    dim_551
          [601] Afternoon capacity  dim_552
          [602] Evening capacity    dim_553
          [603] avg_focus / 5.0     dim_554  (fatigue signal)
          [604] work_intensity      dim_605  (academic pressure)
        """
        task_matrix = np.zeros(
            (self.cfg.MAX_TASKS, self.TASK_FEATURE_SIZE), dtype=np.float32
        )

        for i, task in enumerate(tasks):
            if i >= self.cfg.MAX_TASKS:
                break

            # A. Scalar Features
            prio_map = {"HIGH": 1.0, "MEDIUM": 0.66, "LOW": 0.33}
            task_matrix[i, 0] = prio_map.get(
                str(self._safe_get(task, "priority", "LOW")), 0.33
            )

            task_matrix[i, 1] = (
                min(
                    self._safe_get(task, "estimated_pomodoros", 1),
                    self.cfg.MAX_DURATION,
                )
                / self.cfg.MAX_DURATION
            )
            task_matrix[i, 2] = (
                min(self._safe_get(task, "sessions_count", 0), self.cfg.MAX_DURATION)
                / self.cfg.MAX_DURATION
            )

            # Use shared helper — checks task.deadline first, then task.exam.due_date
            deadline_val = (
                get_effective_deadline(task)
                if not isinstance(task, dict)
                else (
                    None  # training dict — fall through to days_until
                )
            )
            if deadline_val is not None:
                days = (deadline_val - datetime.now()).days
            else:
                days = self._safe_get(task, "days_until", 30)
            # No deadline anywhere → days=30 → urgency dim = 0.0 (neutral)
            task_matrix[i, 3] = max(
                0, (self.cfg.MAX_DAYS_DUE - max(0, days)) / self.cfg.MAX_DAYS_DUE
            )

            task_matrix[i, 4] = self._safe_get(task, "difficulty", 1) / 5.0
            task_matrix[i, 5] = (
                1.0
                if self._safe_get(task, "status", "PENDING") == "IN_PROGRESS"
                else 0.0
            )

            # B. Category One-Hot (6 categories)
            cat_raw = "Other"
            if isinstance(task, dict):
                cat_raw = task.get("category", "Other")
            else:
                if hasattr(task, "module") and task.module:
                    cat_raw = getattr(task.module, "category", "Other")
                    # Use .value for string enums (e.g. "Math/Logic" not "MATH")
                    if hasattr(cat_raw, "value"):
                        cat_raw = cat_raw.value
                    elif hasattr(cat_raw, "name"):
                        cat_raw = cat_raw.name

            cat_idx = self.cfg.CATEGORY_MAP.get(str(cat_raw), 5)  # 5 = Other
            task_matrix[i, 6 + cat_idx] = 1.0

        # C. Environmental Signals
        flat_tasks = task_matrix.flatten()

        slots = np.array(
            [
                capacity_map.get("Morning", 4.0) / 8.0,  # dim_551
                capacity_map.get("Afternoon", 4.0) / 8.0,  # dim_552
                capacity_map.get("Evening", 4.0) / 8.0,  # dim_553
            ],
            dtype=np.float32,
        )

        # Cognitive Fatigue — exponential time-decay weighted average
        # Ratings are ordered oldest→newest; most recent = Δt=0 → weight=1.0
        # W(Δt) = e^(-0.5 * Δt)  so yesterday=0.60, 2 days ago=0.36, etc.
        # After weighted avg: normalize (raw-1)/4, then invert → 1=max fatigue
        if recent_focus_ratings:
            n = len(recent_focus_ratings)
            decay_weights = [np.exp(-0.5 * (n - 1 - i)) for i in range(n)]
            weighted_sum = sum(
                r * w for r, w in zip(recent_focus_ratings, decay_weights)
            )
            weight_total = sum(decay_weights)
            fatigue_raw = weighted_sum / weight_total  # weighted avg (1–5)
            normalized = (fatigue_raw - 1.0) / 4.0  # scale to [0, 1]
            fatigue_val = 1.0 - normalized  # invert: low focus = high fatigue
        else:
            fatigue_val = 0.0  # no history → assume fresh
        fatigue_signal = np.array([fatigue_val], dtype=np.float32)  # dim_554
        intensity_signal = np.array([work_intensity], dtype=np.float32)  # dim_605

        # Final shape: 605
        return np.concatenate([flat_tasks, slots, fatigue_signal, intensity_signal])
