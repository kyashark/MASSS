from pydantic import BaseModel
from typing import List, Dict, Any

# Represents a single task inside a time slot
class ScheduledTask(BaseModel):
    task_id: int
    task_name: str
    module: str
    assigned_sessions: int
    priority: str
    status: str

# Represents the full day structure
class ScheduleResponse(BaseModel):
    Morning: List[ScheduledTask] = []
    Afternoon: List[ScheduledTask] = []
    Evening: List[ScheduledTask] = []

    class Config:
        from_attributes = True