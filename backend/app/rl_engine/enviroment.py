# rl_engine/environment.py

"""
RL environment simulation.

Manages episode state, history buffer, and no-op actions.
"""

import gymnasium as gym
from gymnasium import spaces
import numpy as np
from collections import deque

from app.rl_engine.config import RLConfig
from app.rl_engine.state_builder import StateBuilder
from app.rl_engine.reward import RewardEngine


class StudentSchedulingEnv(gym.Env):
    def __init__(self, user_profile, task_data):
        super(StudentSchedulingEnv, self).__init__()

        self.cfg = RLConfig()
        self.state_builder = StateBuilder()
        self.reward_engine = RewardEngine()

        self.pending_tasks = task_data
        self.user_profile = user_profile

        # Action Space: [Task_ID, Slot_ID]
        self.action_space = spaces.MultiDiscrete([self.cfg.MAX_TASKS + 1, 3])

        # Observation Space
        self.observation_space = spaces.Box(
            low=0,
            high=1,
            shape=self.state_builder.get_observation_space_shape(),
            dtype=np.float32,
        )

        self.recent_ratings = deque(maxlen=self.cfg.HISTORY_LEN)
        self.todays_capacity = {}
        self.current_step = 0
        self.max_steps = 20

    def _safe_get(self, obj, key, default=None):
        if isinstance(obj, dict):
            return obj.get(key, default)
        return getattr(obj, key, default)

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        self.current_step = 0

        # 1. Track Task Usage (New!)
        # Stores how many times we've scheduled each task ID in this episode
        self.task_usage = {}

        # Capture intensity from the fresh analytics context
        self.work_intensity = self.user_profile.get("work_intensity", 0.0)

        # ... (Rest of your capacity/profile loading logic stays the same) ...
        user_stats = self.user_profile.get("energy_map", {})
        morn = user_stats.get("Morning", 3.0)
        aft = user_stats.get("Afternoon", 3.0)
        eve = user_stats.get("Evening", 3.0)

        def calc_cap(focus):
            return int(max(2, min(6, focus + 1)))

        self.todays_capacity = {0: calc_cap(morn), 1: calc_cap(aft), 2: calc_cap(eve)}

        hist = self.user_profile.get("recent_ratings", [])
        clean_hist = [float(x) for x in hist if x is not None]
        self.recent_ratings = deque(clean_hist, maxlen=self.cfg.HISTORY_LEN)

        return self._get_obs(), {}

    def step(self, action):
        self.current_step += 1
        task_idx, slot_idx = action[0], action[1]

        # === TERMINATION CHECK ===
        terminated = (
            self.current_step >= self.max_steps
            or sum(self.todays_capacity.values()) <= 0
        )

        # === CASE 1: NO-OP ACTION ===
        if task_idx == 0:
            reward = self.reward_engine.calculate_reward(None, "NO_OP", None)
            return self._get_obs(), reward, terminated, False, {"valid": True}

        # === CASE 2: REAL TASK VALIDATION ===
        real_task_idx = task_idx - 1
        if real_task_idx >= len(self.pending_tasks):
            return (
                self._get_obs(),
                self.cfg.PENALTY_INVALID_ACTION,
                terminated,
                False,
                {"valid": False},
            )

        task = self.pending_tasks[real_task_idx]

        # Check if task is already done/over-scheduled
        needed = self._safe_get(task, "estimated_pomodoros", 1) - self._safe_get(
            task, "sessions_count", 0
        )
        if self.task_usage.get(real_task_idx, 0) >= needed:
            return self._get_obs(), -5.0, terminated, False, {"valid": False}

        # Check if time slot is full
        if self.todays_capacity[slot_idx] <= 0:
            return (
                self._get_obs(),
                self.cfg.PENALTY_OVERLOAD,
                terminated,
                False,
                {"valid": False},
            )

        # === APPLY ACTION ===
        self.todays_capacity[slot_idx] -= 1
        self.task_usage[real_task_idx] = self.task_usage.get(real_task_idx, 0) + 1

        # === SIMULATE PERFORMANCE ===
        difficulty = self._safe_get(task, "difficulty", 1)
        avg_focus = np.mean(self.recent_ratings) if self.recent_ratings else 5.0
        intensity = self.user_profile.get("work_intensity", 0.0)

        # Logic for "Crunch Mode" vs "Normal Fatigue"
        if difficulty > 3 and avg_focus < 3.0:
            if intensity > 0.8:
                simulated_rating = 3.5  # Crunch Mode: Pushing through for exams
            else:
                simulated_rating = 2.0  # Normal Mode: Fatigue causes poor quality
        else:
            simulated_rating = 5.0  # High focus or manageable task

        self.recent_ratings.append(simulated_rating)
        reward = self.reward_engine.calculate_reward(task, "SUCCESS", simulated_rating)

        if sum(self.todays_capacity.values()) <= 0:
            terminated = True

        return self._get_obs(), reward, terminated, False, {"valid": True}

    def _get_obs(self):
        # Pull work_intensity from the user_profile (provided by analytics.py)
        intensity = self.user_profile.get("work_intensity", 0.5)

        return self.state_builder.build_state(
            self.pending_tasks,
            self.todays_capacity,
            list(self.recent_ratings),
            intensity,  # <--- New 4th argument
        )
