from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from enum import Enum

# --- Import Enums to ensure Frontend sends correct strings ---
# We redefine them here or import from models if they are simple strings.
# For simplicity in Pydantic, we often use str or the exact Enum.

class EnergyTime(str, Enum):
    MORNING = "Morning"
    AFTERNOON = "Afternoon"
    NIGHT = "Night"

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
    # exams: List[ExamResponse] = [] # Uncomment if you want exams nested in module
    
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

class TaskUpdate(BaseModel):
    # All fields optional because user might only change one thing
    name: Optional[str] = None
    estimated_pomodoros: Optional[int] = None
    deadline: Optional[datetime] = None
    status: Optional[TaskStatus] = None



# --- SESSION SCHEMAS (For the Timer) ---

class SessionCreate(BaseModel):
    task_id: int
    start_time: datetime
    end_time: datetime
    completed: bool
    focus_rating: Optional[int] = None # 1-5





# --- EXAM SCHEMAS (New) ---
class ExamBase(BaseModel):
    name: str
    module_id: int
    date: datetime
    importance: int = 3 # 1-5

class ExamCreate(ExamBase):
    pass

class ExamResponse(ExamBase):
    id: int
    class Config:
        from_attributes = True