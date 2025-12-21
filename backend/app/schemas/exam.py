from pydantic import BaseModel
from datetime import date

class ExamBase(BaseModel):
    name: str
    exam_type: str
    due_date: date


class ExamCreate(ExamBase):
    pass


class ExamResponse(ExamBase):
    id: int
    module_id: int

    class Config:
        from_attributes = True
