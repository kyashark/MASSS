from pydantic import BaseModel, Field, validator
from datetime import time
from typing import List, Optional
from app.models.profile import DayOfWeek, ActivityType, SlotName

# --- 1. ROUTINE SCHEMAS ---

# A. Common Fields (Name, Type, Time) - NO Day logic here
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

# B. CREATE (Input) - Uses a LIST of days
class RoutineCreate(RoutineCommon):
    days: List[DayOfWeek] = Field(..., example=["Monday", "Wednesday"])

# C. RESPONSE (Output) - Uses a SINGLE day (Database Row)
class RoutineResponse(RoutineCommon):
    id: int
    user_id: int
    day_of_week: DayOfWeek 

    class Config:
        from_attributes = True

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

    class Config:
        from_attributes = True

class RoutineUpdate(BaseModel):
    name: Optional[str] = None
    activity_type: Optional[ActivityType] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    # Note: We don't usually update 'day_of_week' for a single ID, 
    # but you can add it if you want to move an event to another day.

    class Config:
        use_enum_values = True