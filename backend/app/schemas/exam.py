from pydantic import BaseModel, Field
from datetime import date
from typing import Optional
from app.models.exam import ExamType

class ExamBase(BaseModel):
    name: str = Field(..., min_length=1)
    exam_type: ExamType # Uses Enum dropdown
    due_date: date
    weight: int = Field(default=10, ge=0, le=100, description="Importance % (0-100)")

    class Config:
        use_enum_values = True

class ExamCreate(ExamBase):
    pass

class ExamUpdate(BaseModel):
    name: Optional[str] = None
    exam_type: Optional[ExamType] = None
    due_date: Optional[date] = None
    weight: Optional[int] = None

class ExamResponse(ExamBase):
    id: int
    module_id: int
    user_id: int

    class Config:
        from_attributes = True
        use_enum_values = True