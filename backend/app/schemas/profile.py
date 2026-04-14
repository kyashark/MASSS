from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import time


class SlotConfig(BaseModel):
    """
    Represents one of the user's 3 custom study slots.
    Used in onboarding and profile update.
    """

    slot_name: str  # internal key: "morning", "afternoon", "evening"
    slot_label: str  # display name: "Deep Work", "Night Grind", etc.
    start_time: str  # "HH:MM"
    end_time: str  # "HH:MM"
    max_pomodoros: int

    @field_validator("slot_name")
    @classmethod
    def slot_name_must_be_valid(cls, v):
        if v not in {"morning", "afternoon", "evening"}:
            raise ValueError("slot_name must be morning, afternoon, or evening")
        return v

    @field_validator("max_pomodoros")
    @classmethod
    def capacity_must_be_positive(cls, v):
        if not 1 <= v <= 12:
            raise ValueError("max_pomodoros must be between 1 and 12")
        return v

    @field_validator("start_time", "end_time")
    @classmethod
    def time_must_be_valid(cls, v):
        try:
            h, m = map(int, v.split(":"))
            if not (0 <= h <= 24 and 0 <= m <= 59):
                raise ValueError
        except (ValueError, AttributeError):
            raise ValueError("time must be in HH:MM format")
        return v


class RoutineCreate(BaseModel):
    name: str
    activity_type: str
    days: List[str]
    start_time: time
    end_time: time


class RoutineUpdate(BaseModel):
    name: Optional[str] = None
    activity_type: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None


class RoutineResponse(BaseModel):
    id: int
    user_id: int
    name: str
    activity_type: str
    day_of_week: str
    start_time: time
    end_time: time

    class Config:
        from_attributes = True


class PreferenceUpdate(BaseModel):
    slot_name: str
    slot_label: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    max_pomodoros: int
    is_preferred: bool = False


class PreferenceResponse(BaseModel):
    id: int
    user_id: int
    slot_name: str
    slot_label: Optional[str]
    start_time: Optional[time]
    end_time: Optional[time]
    max_pomodoros: int
    inferred_energy_score: float
    is_preferred: bool

    class Config:
        from_attributes = True
