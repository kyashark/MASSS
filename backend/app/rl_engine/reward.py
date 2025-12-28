"""
Reward function (scorekeeper).

Implements the exact reward formula used by the RL agent.
The Scorekeeper. Implements your exact formula.
"""

# rl_engine/reward.py
from rl_engine.config import RLConfig

class RewardEngine:
    def __init__(self):
        self.cfg = RLConfig()

    def calculate_reward(self, task, action_result, user_focus_rating):
        """
        Args:
            task: The task object.
            action_result: 'SUCCESS', 'FULL', 'INVALID', 'NO_OP'
            user_focus_rating: The actual feedback (1-5) or None if simulated.
        """
        reward = 0.0

        # --- 1. System Penalties ---
        if action_result == 'INVALID':
            return self.cfg.PENALTY_INVALID_ACTION
        if action_result == 'FULL':
            return self.cfg.PENALTY_OVERLOAD
        if action_result == 'NO_OP':
            # Small penalty to discourage laziness, but allowed if slots are full
            return -0.1 

        # --- 2. The Core Formula ---
        # R = (w1 * Focus) + (w2 * Completion) - (w3 * Delay) - (w4 * Abort)
        
        # A. Focus Rating (The "Fatigue" Feedback)
        # In simulation, we might estimate this. In real-time, we get it from DB.
        rating = user_focus_rating if user_focus_rating else 3.0
        reward += (self.cfg.W_FOCUS * rating)

        # B. Task Completion
        # If this session finishes the task (sessions_count >= estimated)
        if task.get('sessions_count', 0) + 1 >= task.get('estimated_pomodoros', 1):
            reward += self.cfg.W_COMPLETION

        # C. Delay (Urgency)
        days_due = task.get('days_until', 10)
        if days_due < 0: # Overdue
            reward -= (self.cfg.W_DELAY * abs(days_due))

        # D. Abort (Negative Feedback)
        # (Handled if the environment detects an 'ABORTED' end_type)
        
        # --- 3. Smart Rules (Bonus) ---
        # Momentum Bonus: If task was IN_PROGRESS, massive points for continuing it
        status = task.get('status', 'PENDING')
        if hasattr(status, 'name'): status = status.name
        
        if status == 'IN_PROGRESS':
            reward += 5.0 # Sticky Logic Reinforcement

        return reward