from pydantic import BaseModel, Field, validator
from datetime import time
from typing import List, Optional
from app.models.profile import DayOfWeek, ActivityType, SlotName, Chronotype


# --- 1. ROUTINE SCHEMAS ---
class RoutineCommon(BaseModel):
    name: str = Field(..., example="Physics Lab")
    activity_type: ActivityType
    start_time: time
    end_time: time

    @validator("end_time")
    def check_times(cls, v, values):
        start = values.get("start_time")
        if start and v == start:
            raise ValueError("Start and End time cannot be exactly the same.")
        return v

    class Config:
        use_enum_values = True


class RoutineCreate(RoutineCommon):
    days: List[DayOfWeek] = Field(..., example=["Monday", "Wednesday"])


class RoutineResponse(RoutineCommon):
    id: int
    user_id: int
    day_of_week: DayOfWeek

    class Config:
        from_attributes = True


class RoutineUpdate(BaseModel):
    name: Optional[str] = None
    activity_type: Optional[ActivityType] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None

    class Config:
        use_enum_values = True


# --- 2. PREFERENCE SCHEMAS ---
class PreferenceBase(BaseModel):
    slot_name: SlotName
    max_pomodoros: int = Field(..., ge=0, le=12, example=4)
    is_preferred: bool = False

    class Config:
        use_enum_values = True


class PreferenceUpdate(PreferenceBase):
    class Config:
        extra = "ignore"


class PreferenceResponse(PreferenceBase):
    id: int
    user_id: int
    inferred_energy_score: float

    class Config:
        from_attributes = True


class ProfileMetadata(BaseModel):
    chronotype: Chronotype = Chronotype.BALANCED
    avg_focus_target: float = Field(3.5, ge=1.0, le=5.0)
