from pydantic import BaseModel, Field
from datetime import datetime, time
from typing import List, Optional
from enum import Enum

# --- Import Enums to ensure Frontend sends correct strings ---
# We redefine them here or import from models if they are simple strings.
# For simplicity in Pydantic, we often use str or the exact Enum.

class EnergyTime(str, Enum):
    MORNING = "Morning"
    AFTERNOON = "Afternoon"
    NIGHT = "Night"

class DayOfWeek(str, Enum):
    MONDAY = "Monday"
    TUESDAY = "Tuesday"
    WEDNESDAY = "Wednesday"
    THURSDAY = "Thursday"
    FRIDAY = "Friday"
    SATURDAY = "Saturday"
    SUNDAY = "Sunday"

class ModuleType(str, Enum):
    CODING = "Coding"
    MATH = "Math"
    THEORY = "Theory"
    CREATIVE = "Creative"

class TaskStatus(str, Enum):
    PENDING = "Pending"
    COMPLETED = "Completed"
    MISSED = "Missed"

# --- MODULE SCHEMAS ---

class ModuleBase(BaseModel):
    name: str
    category: ModuleType
    difficulty: int       # 1-5
    preferred_energy: EnergyTime
    upcoming_exam_date: Optional[datetime] = None
    exam_importance: int = 3

class ModuleCreate(ModuleBase):
    pass # Frontend sends everything in Base

class ModuleResponse(ModuleBase):
    id: int
    
    class Config:
        from_attributes = True # Allows Pydantic to read SQLAlchemy objects



# --- TASK SCHEMAS ---

class TaskBase(BaseModel):
    name: str
    module_id: int
    estimated_pomodoros: int = 1
    deadline: Optional[datetime] = None
    is_assignment: bool = False

class TaskCreate(TaskBase):
    pass

class TaskResponse(TaskBase):
    id: int
    status: TaskStatus
    created_at: datetime
    
    # We can include the module details if needed for the UI
    module: Optional[ModuleResponse] = None

    class Config:
        from_attributes = True



# --- SESSION SCHEMAS (For the Timer) ---

class SessionCreate(BaseModel):
    task_id: int
    start_time: datetime
    end_time: datetime
    completed: bool
    focus_rating: Optional[int] = None # 1-5


# --- PROFILE SCHEMAS ---
class FixedEventBase(BaseModel):
    name: str
    day_of_week: DayOfWeek
    start_time: time # Format "HH:MM:SS"
    end_time: time
    slot_category: EnergyTime

class FixedEventCreate(FixedEventBase):
    pass

class StudentProfileBase(BaseModel):
    name: str
    wake_up_time: time
    bed_time: time
    morning_capacity: int = 4
    afternoon_capacity: int = 4
    night_capacity: int = 4

class StudentProfileCreate(StudentProfileBase):
    pass

class StudentProfileResponse(StudentProfileBase):
    id: int
    fixed_events: List[FixedEventBase] = [] # Nested list of events

    class Config:
        from_attributes = True