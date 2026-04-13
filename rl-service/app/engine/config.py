class RLConfig:
    MAX_TASKS = 50
    MAX_DURATION = 10
    MAX_DAYS_DUE = 30
    HISTORY_LEN = 5

    # Keys now match lowercase enum values from the database
    CATEGORY_MAP = {
        "math_logic": 0,
        "coding": 1,
        "creative_design": 2,
        "language": 3,
        "memorization": 4,
        "other": 5,
    }
    NUM_CATEGORIES = 6

    W_FOCUS = 2.0
    W_COMPLETION = 10.0
    W_DELAY = 1.0
    W_ABORT = 5.0

    W_INTENSITY_WEIGHT = 0.7
    REWARD_CRUNCH_MULTIPLIER = 1.5
    FATIGUE_PENALTY_GRACE = 0.5

    PENALTY_INVALID_ACTION = -5.0
    PENALTY_OVERLOAD = -10.0
    PENALTY_FATIGUE_IGNORE = -2.0

    POST_CLASS_FATIGUE_WEIGHT = 0.40
    CLASS_FATIGUE_DECAY_RATE = 0.80
    CLASS_FATIGUE_WINDOW_HRS = 3.0
