from typing import Optional
from pydantic import BaseModel

# Base schema with shared properties
class TestItemBase(BaseModel):
    title: str
    description: Optional[str] = None

# Schema for creating an item (client sends this)
class TestItemCreate(TestItemBase):
    pass

# Schema for updating an item (all fields optional)
class TestItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

# Schema for reading an item (server returns this)
class TestItemResponse(TestItemBase):
    id: int

    class Config:
        # This tells Pydantic to read data even if it's not a dict, but an ORM model
        from_attributes = True 
        # Note: Use 'orm_mode = True' if you are on Pydantic v1