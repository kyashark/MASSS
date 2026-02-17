# rl_engine/config.py

"""
Centralized configuration for easy tweaking.
Defines state space constraints, reward weights, and penalties.

"""


class RLConfig:
    # --- State Space Constraints ---
    MAX_TASKS = 50  # AI looks at top 50 pending tasks
    MAX_DURATION = 10  # Max estimated pomodoros per task (for normalization)
    MAX_DAYS_DUE = 30  # Max days until deadline (for normalization)
    HISTORY_LEN = 5  # How many past focus ratings to remember

    # One-Hot Encoding for Categories: [Math, Coding, Creative, Memorization, Other]
    CATEGORY_MAP = {
        "Math": 0,
        "Coding": 1,
        "Creative": 2,
        "Memorization": 3,
        "Other": 4,
    }
    NUM_CATEGORIES = 5

    # --- Reward Weights (The "W" values from your doc) ---
    # R = (w1 * Focus) + (w2 * Completion) - (w3 * Delay) - (w4 * Abort)
    W_FOCUS = 2.0  # Reward for high focus rating (1-5 scale)
    W_COMPLETION = 10.0  # Bonus for finishing a task
    W_DELAY = 1.0  # Penalty per day overdue
    W_ABORT = 5.0  # Penalty for aborted session

    # --- NEW: Contextual Reward Modifiers ---
    # These constants power the "Coach Logic" in your Reward Engine
    W_INTENSITY_WEIGHT = 0.7  # Balance factor between energy and deadlines
    REWARD_CRUNCH_MULTIPLIER = 1.5  # 50% bonus for urgent tasks during exams
    FATIGUE_PENALTY_GRACE = 0.5  # Reduce fatigue penalty by 50% during crunch

    # --- Penalties ---
    PENALTY_INVALID_ACTION = -5.0  # AI picked a task ID that doesn't exist
    PENALTY_OVERLOAD = -10.0  # AI tried to put task in full slot
    PENALTY_FATIGUE_IGNORE = -2.0  # AI scheduled Hard task when Fatigue was High
