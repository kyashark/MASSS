from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from app.models.task import TaskStatus, PriorityLevel 

# Base Schema (Shared properties)
class TaskBase(BaseModel):
    name: str = Field(..., example="Complete Calculus Worksheet")
    description: Optional[str] = Field(None, example="Questions 1 through 10")
    module_id: int = Field(..., example=1)
    estimated_pomodoros: int = Field(1, ge=1, example=2)
    deadline: Optional[datetime] = None
    priority: PriorityLevel = PriorityLevel.MEDIUM
    is_fixed: bool = False

# 1. CREATE (Input)
class TaskCreate(TaskBase):
    pass 

# 2. UPDATE (Input - All fields optional)
class TaskUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    module_id: Optional[int] = None
    estimated_pomodoros: Optional[int] = None
    deadline: Optional[datetime] = None
    priority: Optional[PriorityLevel] = None
    is_fixed: Optional[bool] = None
    status: Optional[TaskStatus] = None 

# 3. RESPONSE (Output)
class TaskResponse(TaskBase):
    id: int
    status: TaskStatus
    created_at: datetime

    class Config:
        from_attributes = True # Validates SQLAlchemy models