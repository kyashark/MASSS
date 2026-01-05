
from pydantic import BaseModel, Field
from typing import List, Optional
from app.models.module import Category, Priority, EnergyTime
# Make sure you have these simple schemas created, or remove them if not ready yet
from app.schemas.exam import ExamCreate, ExamResponse 

# Base Schema
class ModuleBase(BaseModel):
    name: str = Field(..., min_length=1, example="Calculus I")
    category: Category = Field(..., example=Category.MATH) # Dropdown in UI
    color: str = Field(default="#E89BAE", example="#FF5733")
    priority: Priority = Field(default=Priority.MEDIUM, example=Priority.HIGH)
    difficulty: int = Field(default=3, ge=1, le=5, example=4) # Min 1, Max 5
    energy_time: EnergyTime = Field(default=EnergyTime.AFTERNOON, example=EnergyTime.MORNING)

# Input for Creating
class ModuleCreate(ModuleBase):
    # Optional: You can create exams instantly when creating a module
    exams: List[ExamCreate] = [] 
    pass

# Output for Responses
class ModuleResponse(ModuleBase):
    id: int
    user_id: int
    exams: List[ExamResponse] = [] # Uncomment when Exam schema is ready

    class Config:
        from_attributes = True
        # This helps Pydantic convert SQLAlchemy Enums to Strings
        use_enum_values = True