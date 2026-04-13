from pydantic import BaseModel, Field
from typing import List
from app.models.module import Category, EnergyTime  # Removed Priority
from app.schemas.exam import ExamCreate, ExamResponse


class ModuleBase(BaseModel):
    name: str = Field(..., min_length=1, example="Calculus I")
    category: Category = Field(..., example=Category.MATH_LOGIC)
    color: str = Field(default="#E89BAE", example="#FF5733")
    energy_time: EnergyTime = Field(
        default=EnergyTime.AFTERNOON, example=EnergyTime.MORNING
    )


class ModuleCreate(ModuleBase):
    exams: List[ExamCreate] = []


class ModuleResponse(ModuleBase):
    id: int
    user_id: int
    exams: List[ExamResponse] = []

    class Config:
        from_attributes = True
        use_enum_values = True
