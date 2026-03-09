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

    # One-Hot Encoding for Categories
    # FIXED: keys now match Category enum .value strings exactly
    # Category.MATH      = "Math/Logic"
    # Category.CODING    = "Coding"
    # Category.CREATIVE  = "Creative Design"
    # Category.LANGUAGE  = "Language"        ← was missing
    # Category.MEMORIZATION = "Memorization"
    # Category.OTHER     = "Other"
    CATEGORY_MAP = {
        "Math/Logic": 0,  # was "Math"
        "Coding": 1,  # correct
        "Creative Design": 2,  # was "Creative"
        "Language": 3,  # was missing entirely — mapped to Other before
        "Memorization": 4,  # correct
        "Other": 5,  # was index 4, shifted to 5
    }
    NUM_CATEGORIES = 6  # was 5 — Language was missing

    # --- Reward Weights ---
    # R = (w1 * Focus) + (w2 * Completion) - (w3 * Delay) - (w4 * Abort)
    W_FOCUS = 2.0  # Reward for high focus rating (1-5 scale)
    W_COMPLETION = 10.0  # Bonus for finishing a task
    W_DELAY = 1.0  # Penalty per day overdue
    W_ABORT = 5.0  # Penalty for aborted session

    # --- Contextual Reward Modifiers ---
    W_INTENSITY_WEIGHT = 0.7  # Balance factor between energy and deadlines
    REWARD_CRUNCH_MULTIPLIER = 1.5  # 50% bonus for urgent tasks during exams
    FATIGUE_PENALTY_GRACE = 0.5  # Reduce fatigue penalty by 50% during crunch

    # --- Penalties ---
    PENALTY_INVALID_ACTION = -5.0  # AI picked a task ID that doesn't exist
    PENALTY_OVERLOAD = -10.0  # AI tried to put task in full slot
    PENALTY_FATIGUE_IGNORE = -2.0  # AI scheduled Hard task when Fatigue was High

    # ── Fixed Schedule Integration ─────────────────────────────────
    POST_CLASS_FATIGUE_WEIGHT = 0.40  # how much class fatigue blends into dim_554
    CLASS_FATIGUE_DECAY_RATE = 0.80  # how fast post-class fatigue fades per hour
    CLASS_FATIGUE_WINDOW_HRS = 3.0  # how many hours after class to apply fatigue
