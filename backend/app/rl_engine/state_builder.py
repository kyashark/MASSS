"""

State builder / translator.

Builds RL-ready state representations.
Includes task categories and fatigue history.

"""

import numpy as np
from rl_engine.config import RLConfig

class StateBuilder:
    def __init__(self):
        self.cfg = RLConfig()
        # Feature Size Calculation:
        # Priority(1) + Est(1) + Done(1) + Urgency(1) + Diff(1) + Sticky(1) + Category(5)
        self.TASK_FEATURE_SIZE = 11 

    def get_observation_space_shape(self):
        # Shape = (Tasks * Features) + SlotCaps(3) + FatigueHistory(1)
        # 50 * 11 = 550
        # + 3 (Morn/Aft/Eve) + 1 (Avg Fatigue) = 554
        return (self.cfg.MAX_TASKS * self.TASK_FEATURE_SIZE) + 4,

    def build_state(self, tasks, capacity_map, recent_focus_ratings):
        """
        Converts world state into Vector.
        """
        # 1. Task Matrix (50 tasks x 11 features)
        task_matrix = np.zeros((self.cfg.MAX_TASKS, self.TASK_FEATURE_SIZE), dtype=np.float32)

        for i, task in enumerate(tasks):
            if i >= self.cfg.MAX_TASKS: break

            # --- A. Scalar Features ---
            # Priority (High=1.0)
            prio_map = {'HIGH': 1.0, 'MEDIUM': 0.66, 'LOW': 0.33}
            prio = task.get('priority', 'LOW')
            if hasattr(prio, 'name'): prio = prio.name # Handle Enum
            task_matrix[i, 0] = prio_map.get(str(prio), 0.33)

            # Estimated Effort
            est = task.get('estimated_pomodoros', 1)
            task_matrix[i, 1] = min(est, self.cfg.MAX_DURATION) / self.cfg.MAX_DURATION

            # Progress (The "Prediction Error" Signal)
            done = task.get('sessions_count', 0)
            task_matrix[i, 2] = min(done, self.cfg.MAX_DURATION) / self.cfg.MAX_DURATION

            # Urgency
            days = task.get('days_until', 30)
            task_matrix[i, 3] = max(0, (self.cfg.MAX_DAYS_DUE - days) / self.cfg.MAX_DAYS_DUE)

            # Difficulty
            diff = task.get('difficulty', 1)
            task_matrix[i, 4] = diff / 5.0

            # Sticky Status (Momentum Rule)
            status = task.get('status', 'PENDING')
            if hasattr(status, 'name'): status = status.name
            task_matrix[i, 5] = 1.0 if status == 'IN_PROGRESS' else 0.0

            # --- B. Categorical Features (One-Hot) ---
            cat_idx = self.cfg.CATEGORY_MAP.get(task.get('category', 'Other'), 4)
            # Fill indices 6, 7, 8, 9, 10
            task_matrix[i, 6 + cat_idx] = 1.0 

        # 2. Flatten Tasks
        flat_tasks = task_matrix.flatten()

        # 3. Context Features
        # Slot Capacities
        slots = np.array([
            capacity_map.get(0, 0) / 8.0, # Morning
            capacity_map.get(1, 0) / 8.0, # Afternoon
            capacity_map.get(2, 0) / 8.0  # Evening
        ], dtype=np.float32)

        # Fatigue Level (Avg of last 5 ratings)
        # If history is empty (start of day), assume fresh (5.0 stars)
        avg_focus = np.mean(recent_focus_ratings) if recent_focus_ratings else 5.0
        # Normalize (1-5 stars -> 0.0-1.0). Low score = High Fatigue.
        fatigue_signal = np.array([avg_focus / 5.0], dtype=np.float32)

        # 4. Concatenate
        return np.concatenate([flat_tasks, slots, fatigue_signal])