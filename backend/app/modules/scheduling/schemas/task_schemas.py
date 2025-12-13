from pydantic import BaseModel
from typing import Optional

# 1. CREATE (What Frontend sends)
class TaskCreate(BaseModel):
    title: str
    category: str = "General"
    description: Optional[str] = None

# 2. UPDATE (What Frontend sends to edit)
class TaskUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    is_completed: Optional[bool] = None

# 3. RESPONSE (What API sends back)
class TaskResponse(BaseModel):
    id: int
    title: str
    category: str
    description: Optional[str] = None
    is_completed: bool

    class Config:
        from_attributes = True # Allows Pydantic to read SQLAlchemy models