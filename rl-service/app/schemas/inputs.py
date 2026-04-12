from pydantic import BaseModel, field_validator
from typing import List, Optional

VALID_PRIORITIES = {"high", "medium", "low"}
VALID_CATEGORIES = {
    "coding",
    "math_logic",
    "language",
    "creative_design",
    "memorization",
    "other",
}
VALID_SLOTS = {"morning", "afternoon", "evening"}
VALID_END_TYPES = {"completed", "stopped", "aborted", "skipped"}
VALID_ACTIVITY_TYPES = {"class", "sleep", "habit", "work"}
VALID_DAYS = {
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
}
VALID_STATUSES = {"pending", "in_progress", "completed", "archived"}


class TaskInput(BaseModel):
    id: int
    name: str
    priority: str
    difficulty: int
    category: str
    estimated_pomodoros: int
    sessions_count: int
    days_until: Optional[int] = None
    status: str = "pending"

    @field_validator("priority")
    @classmethod
    def priority_must_be_valid(cls, v):
        if v not in VALID_PRIORITIES:
            raise ValueError(f"priority must be one of {VALID_PRIORITIES}, got '{v}'")
        return v

    @field_validator("category")
    @classmethod
    def category_must_be_valid(cls, v):
        if v not in VALID_CATEGORIES:
            raise ValueError(f"category must be one of {VALID_CATEGORIES}, got '{v}'")
        return v

    @field_validator("difficulty")
    @classmethod
    def difficulty_must_be_in_range(cls, v):
        if not 1 <= v <= 5:
            raise ValueError("difficulty must be between 1 and 5")
        return v


class SessionHistoryItem(BaseModel):
    focus_rating: Optional[float] = None
    end_type: str
    slot_type: str
    duration_minutes: float
    started_at: str

    @field_validator("end_type")
    @classmethod
    def end_type_must_be_valid(cls, v):
        if v not in VALID_END_TYPES:
            raise ValueError(f"end_type must be one of {VALID_END_TYPES}")
        return v

    @field_validator("slot_type")
    @classmethod
    def slot_type_must_be_valid(cls, v):
        if v not in VALID_SLOTS:
            raise ValueError(f"slot_type must be one of {VALID_SLOTS}")
        return v


class SlotPreferenceInput(BaseModel):
    slot_name: str
    max_pomodoros: int

    @field_validator("slot_name")
    @classmethod
    def slot_name_must_be_valid(cls, v):
        if v not in VALID_SLOTS:
            raise ValueError(f"slot_name must be one of {VALID_SLOTS}")
        return v


class RoutineEventInput(BaseModel):
    name: str
    activity_type: str
    day_of_week: str
    start_time: str
    end_time: str

    @field_validator("activity_type")
    @classmethod
    def activity_type_must_be_valid(cls, v):
        if v not in VALID_ACTIVITY_TYPES:
            raise ValueError(f"activity_type must be one of {VALID_ACTIVITY_TYPES}")
        return v

    @field_validator("day_of_week")
    @classmethod
    def day_must_be_valid(cls, v):
        if v not in VALID_DAYS:
            raise ValueError(f"day_of_week must be one of {VALID_DAYS}")
        return v


class ScheduleRequest(BaseModel):
    user_id: int
    active_slot: str = "morning"
    tasks: List[TaskInput]
    session_history: List[SessionHistoryItem] = []
    slot_preferences: List[SlotPreferenceInput] = []
    weekly_routine: List[RoutineEventInput] = []

    @field_validator("active_slot")
    @classmethod
    def active_slot_must_be_valid(cls, v):
        if v not in VALID_SLOTS:
            raise ValueError(f"active_slot must be one of {VALID_SLOTS}")
        return v


class StateRequest(BaseModel):
    user_id: int
    active_slot: str = "morning"
    session_history: List[SessionHistoryItem] = []
    slot_preferences: List[SlotPreferenceInput] = []
    weekly_routine: List[RoutineEventInput] = []
