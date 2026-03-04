from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from app.models.session import SessionEndType


# Base Schema
class SessionBase(BaseModel):
    task_id: int


# 1. START (Input)
class SessionCreate(SessionBase):
    pass


# 3. RESPONSE (Output)
class SessionResponse(SessionBase):
    id: int
    user_id: int
    start_time: datetime
    end_time: Optional[datetime]
    duration_minutes: float
    # end_type: SessionEndType
    end_type: Optional[SessionEndType]
    focus_rating: Optional[int]
    # slot_type: str
    slot_type: Optional[str]

    class Config:
        from_attributes = True
        use_enum_values = True


class SessionEnd(BaseModel):
    end_type: SessionEndType  # COMPLETED, STOPPED, ABORTED
    focus_rating: Optional[int] = Field(None, ge=1, le=5)

    class Config:
        use_enum_values = True
