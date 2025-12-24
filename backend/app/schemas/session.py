from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

# Base Schema
class SessionBase(BaseModel):
    task_id: int

# 1. CREATE (Start Timer)
class SessionCreate(SessionBase):
    pass # We only need task_id to start. Start_time is automatic.

# 2. END (Stop Timer)
class SessionEnd(BaseModel):
    is_completed: bool
    # User validates rating: Must be 1-5
    focus_rating: Optional[int] = Field(None, ge=1, le=5, description="1=Distracted, 5=Deep Focus")

# 3. RESPONSE (Read)
class SessionResponse(SessionBase):
    id: int
    start_time: datetime
    end_time: Optional[datetime]
    duration_minutes: Optional[float]
    is_completed: bool
    focus_rating: Optional[int]

    class Config:
        from_attributes = True