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
        # Feature Size Calculation:
        # Priority(1) + Est(1) + Done(1) + Urgency(1) + Diff(1) + Sticky(1) + Category(5)
        self.TASK_FEATURE_SIZE = 11 

    def get_observation_space_shape(self):
        # Shape = (Tasks * Features) + SlotCaps(3) + FatigueHistory(1)
        # 50 * 11 = 550
        # + 3 (Morn/Aft/Eve) + 1 (Avg Fatigue) = 554
        return (self.cfg.MAX_TASKS * self.TASK_FEATURE_SIZE) + 4,
    
    def _safe_get(self, task, field, default=None):
        """Helper to get data from either Dict or SQLAlchemy Object"""
        if isinstance(task, dict):
            return task.get(field, default)
        else:
            val = getattr(task, field, default)
            # Handle Enums (if the DB returns an Enum object, get its name)
            if hasattr(val, 'name'): return val.name
            return val
    
    def build_state(self, tasks, capacity_map, recent_focus_ratings):
        task_matrix = np.zeros((self.cfg.MAX_TASKS, self.TASK_FEATURE_SIZE), dtype=np.float32)

        for i, task in enumerate(tasks):
            if i >= self.cfg.MAX_TASKS: break

            # --- A. Scalar Features ---
            # Priority
            prio_raw = self._safe_get(task, 'priority', 'LOW')
            prio_map = {'HIGH': 1.0, 'MEDIUM': 0.66, 'LOW': 0.33}
            task_matrix[i, 0] = prio_map.get(str(prio_raw), 0.33)

            # Est & Done
            est = self._safe_get(task, 'estimated_pomodoros', 1)
            done = self._safe_get(task, 'sessions_count', 0)
            task_matrix[i, 1] = min(est, self.cfg.MAX_DURATION) / self.cfg.MAX_DURATION
            task_matrix[i, 2] = min(done, self.cfg.MAX_DURATION) / self.cfg.MAX_DURATION

            # Urgency
            # Note: You need to calculate 'days_until' before passing tasks here usually, 
            # or calculate it on the fly if task has a deadline.
            # For now, we assume the inputs have it.
            days = self._safe_get(task, 'days_until', 30)
            task_matrix[i, 3] = max(0, (self.cfg.MAX_DAYS_DUE - days) / self.cfg.MAX_DAYS_DUE)

            # Difficulty
            diff = self._safe_get(task, 'difficulty', 1)
            task_matrix[i, 4] = diff / 5.0

            # Sticky Status
            status = self._safe_get(task, 'status', 'PENDING')
            task_matrix[i, 5] = 1.0 if status == 'IN_PROGRESS' else 0.0

            # --- B. Categorical Features ---
            cat_raw = self._safe_get(task, 'category', 'Other')
            cat_idx = self.cfg.CATEGORY_MAP.get(str(cat_raw), 4)
            task_matrix[i, 6 + cat_idx] = 1.0 

        # ... (Rest of logic is perfect)
        
        flat_tasks = task_matrix.flatten()
        
        slots = np.array([
            capacity_map.get(0, 0) / 8.0, 
            capacity_map.get(1, 0) / 8.0, 
            capacity_map.get(2, 0) / 8.0  
        ], dtype=np.float32)

        avg_focus = np.mean(recent_focus_ratings) if recent_focus_ratings else 5.0
        fatigue_signal = np.array([avg_focus / 5.0], dtype=np.float32)

        return np.concatenate([flat_tasks, slots, fatigue_signal])