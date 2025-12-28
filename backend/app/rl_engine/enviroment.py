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
        self.user_profile = user_profile # {'best_slot': 1, 'energy': 'LOW'}

        # Action Space: 
        # [Task_ID, Slot_ID]
        # Task_ID: 0 to MAX_TASKS. (0 is reserved for NO_OP/Break)
        self.action_space = spaces.MultiDiscrete([self.cfg.MAX_TASKS + 1, 3]) 

        # Observation Space
        self.observation_space = spaces.Box(
            low=0, high=1, 
            shape=self.state_builder.get_observation_space_shape(), 
            dtype=np.float32
        )

        # Internal State
        self.recent_ratings = deque(maxlen=self.cfg.HISTORY_LEN) # Memory of last 5 ratings
        self.todays_capacity = {}
        self.current_step = 0
        self.max_steps = 20

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        
        # --- NEW LOGIC USING DB DATA ---
        # If user has high energy in Morning (avg > 4.0), give more capacity.
        # If user has low energy (avg < 3.0), give less capacity.
        
        user_stats = self.user_profile.get('energy_map', {})
        
        morn_focus = user_stats.get('Morning', 3.0)
        aft_focus = user_stats.get('Afternoon', 3.0)
        eve_focus = user_stats.get('Evening', 3.0)
        
        # Helper to convert Focus (1-5) into Capacity (2-6 slots)
        def calc_cap(focus):
            return int(max(2, min(6, focus + 1))) 
            
        self.todays_capacity = {
            0: calc_cap(morn_focus), # Morning Capacity
            1: calc_cap(aft_focus),  # Afternoon Capacity
            2: calc_cap(eve_focus)   # Evening Capacity
        }
        
        # Load real recent ratings
        self.recent_ratings = deque(
            self.user_profile.get('recent_ratings', []), 
            maxlen=self.cfg.HISTORY_LEN
        )
        
        return self._get_obs(), {}

    def step(self, action):
        # Unwrap Action
        task_idx = action[0] # 0 = No-Op
        slot_idx = action[1]
        
        # --- 1. Handle No-Op (Break) ---
        if task_idx == 0:
            # Agent chose to do nothing.
            reward = self.reward_engine.calculate_reward(None, 'NO_OP', None)
            return self._get_obs(), reward, False, False, {}

        # Adjust index because 0 was No-Op
        real_task_idx = task_idx - 1 

        # --- 2. Validation ---
        if real_task_idx >= len(self.pending_tasks):
            return self._get_obs(), self.cfg.PENALTY_INVALID_ACTION, False, False, {}

        if self.todays_capacity[slot_idx] <= 0:
             return self._get_obs(), self.cfg.PENALTY_OVERLOAD, False, False, {}

        # --- 3. Execute ---
        task = self.pending_tasks[real_task_idx]
        self.todays_capacity[slot_idx] -= 1
        
        # Simulate User Feedback (In training, we mock this based on difficulty)
        # E.g., If Fatigue is high (low recent ratings) and task is hard, rating drops.
        avg_focus = np.mean(self.recent_ratings) if self.recent_ratings else 5.0
        difficulty = task.get('difficulty', 1)
        
        # Simulation Logic:
        simulated_rating = 5.0
        if difficulty > 3 and avg_focus < 3.0:
            simulated_rating = 2.0 # Burnout happened
        
        # Update History
        self.recent_ratings.append(simulated_rating)

        # --- 4. Reward ---
        reward = self.reward_engine.calculate_reward(task, 'SUCCESS', simulated_rating)

        # --- 5. Termination ---
        self.current_step += 1
        terminated = (self.current_step >= self.max_steps)
        # Also terminate if day is full
        if sum(self.todays_capacity.values()) <= 0:
            terminated = True

        return self._get_obs(), reward, terminated, False, {}

    def _get_obs(self):
        return self.state_builder.build_state(
            self.pending_tasks, 
            self.todays_capacity,
            list(self.recent_ratings)
        )