from pydantic import BaseModel
from datetime import date
from typing import Optional

class ExamBase(BaseModel):
    name: str
    exam_type: str
    due_date: date


class ExamCreate(ExamBase):
    pass


class ExamUpdate(BaseModel):
    name: Optional[str] = None
    exam_type: Optional[str] = None
    due_date: Optional[date] = None


class ExamResponse(ExamBase):
    id: int
    module_id: int

    class Config:
        from_attributes = True
