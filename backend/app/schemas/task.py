from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from app.models.task import TaskStatus, PriorityLevel


class TaskBase(BaseModel):
    name: str = Field(..., example="Complete Calculus Worksheet")
    description: Optional[str] = Field(None, example="Questions 1-10")
    module_id: int = Field(..., example=1)
    exam_id: Optional[int] = Field(None, example=2)

    estimated_pomodoros: int = Field(1, ge=1, example=4)
    deadline: Optional[datetime] = None

    # --- UPDATED SECTION ---
    priority: PriorityLevel = PriorityLevel.MEDIUM
    difficulty: int = Field(default=3, ge=1, le=5, example=3)
    # -----------------------

    is_fixed: bool = False

    class Config:
        use_enum_values = True


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    module_id: Optional[int] = None
    exam_id: Optional[int] = None
    estimated_pomodoros: Optional[int] = None
    deadline: Optional[datetime] = None
    priority: Optional[PriorityLevel] = None
    difficulty: Optional[int] = None  # Added difficulty
    is_fixed: Optional[bool] = None
    status: Optional[TaskStatus] = None


class TaskResponse(TaskBase):
    id: int
    user_id: int
    status: TaskStatus
    sessions_count: int
    created_at: datetime

    class Config:
        from_attributes = True
        use_enum_values = True
