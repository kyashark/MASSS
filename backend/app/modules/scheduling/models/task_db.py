from sqlalchemy import Column, Integer, String, Boolean
from app.core.database import Base 

class TaskDB(Base):
    __tablename__ = "tasks" 
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    category = Column(String) # Crucial for your AI later
    description = Column(String, nullable=True)
    is_completed = Column(Boolean, default=False)