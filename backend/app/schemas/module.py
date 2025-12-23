from pydantic import BaseModel
from typing import List
from app.schemas.exam import ExamCreate, ExamResponse

class ModuleBase(BaseModel):
    name: str
    category: str
    color: str
    priority: str
    difficulty: int
    energy_time: str


class ModuleCreate(ModuleBase):
    exams: List[ExamCreate] = []


class ModuleResponse(ModuleBase):
    id: int
    exams: List[ExamResponse] = []

    class Config:
        from_attributes = True