"""

State builder / translator.

Builds RL-ready state representations.
Includes task categories and fatigue history.

"""

import numpy as np
from app.rl_engine.config import RLConfig


class StateBuilder:
    def __init__(self):
        self.cfg = RLConfig()
        # Features: Priority(1), Est(1), Done(1), Urgency(1), Diff(1), Sticky(1), Category(5)
        self.TASK_FEATURE_SIZE = 11

    def get_observation_space_shape(self):
        # UPDATED: (50 tasks * 11 features) + 3 slots + 1 fatigue + 1 work_intensity
        # 550 + 5 = 555
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
        Builds the 555-dimension state representation.
        """
        task_matrix = np.zeros(
            (self.cfg.MAX_TASKS, self.TASK_FEATURE_SIZE), dtype=np.float32
        )

        for i, task in enumerate(tasks):
            if i >= self.cfg.MAX_TASKS:
                break

            # --- A. Scalar Features (Priority, Est, Done, Urgency, Difficulty, Status) ---
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

            days = self._safe_get(task, "days_until", 30)
            task_matrix[i, 3] = max(
                0, (self.cfg.MAX_DAYS_DUE - days) / self.cfg.MAX_DAYS_DUE
            )

            task_matrix[i, 4] = self._safe_get(task, "difficulty", 1) / 5.0
            task_matrix[i, 5] = (
                1.0
                if self._safe_get(task, "status", "PENDING") == "IN_PROGRESS"
                else 0.0
            )

            # --- B. Categorical Features (One-Hot Category) ---
            cat_raw = self._safe_get(task, "category", "Other")
            cat_idx = self.cfg.CATEGORY_MAP.get(str(cat_raw), 4)
            task_matrix[i, 6 + cat_idx] = 1.0

        # --- C. Environmental Signals ---
        flat_tasks = task_matrix.flatten()

        slots = np.array(
            [
                capacity_map.get(0, 0) / 8.0,
                capacity_map.get(1, 0) / 8.0,
                capacity_map.get(2, 0) / 8.0,
            ],
            dtype=np.float32,
        )

        avg_focus = np.mean(recent_focus_ratings) if recent_focus_ratings else 5.0
        fatigue_signal = np.array([avg_focus / 5.0], dtype=np.float32)

        # --- D. NEW: Intensity Signal ---
        intensity_signal = np.array([work_intensity], dtype=np.float32)

        # FINAL CONCATENATION (Shape: 555)
        return np.concatenate([flat_tasks, slots, fatigue_signal, intensity_signal])
