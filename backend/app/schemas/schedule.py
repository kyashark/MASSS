from pydantic import BaseModel
from typing import List, Dict
from datetime import date

# 1. Single Task Item (Same as before)
class ScheduledTask(BaseModel):
    task_id: int
    task_name: str
    module: str
    assigned_sessions: int
    priority: str
    status: str
    score: float # Added for debugging transparency

# 2. Daily Schedule (One Day)
class DailySchedule(BaseModel):
    date: date          # e.g., "2024-12-27"
    day_name: str       # e.g., "Friday"
    slots: Dict[str, List[ScheduledTask]] # {"Morning": [...], "Afternoon": [...]}

# 3. The API Response (A list of days)
class ForecastResponse(BaseModel):
    forecast: List[DailySchedule]

    class Config:
        from_attributes = True