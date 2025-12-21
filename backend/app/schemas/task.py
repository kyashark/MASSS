from pydantic import BaseModel
from datetime import date
from typing import Optional

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[date] = None


class TaskCreate(TaskBase):
    pass


class TaskResponse(TaskBase):
    id: int
    is_completed: bool
    module_id: int

    class Config:
        from_attributes = True
