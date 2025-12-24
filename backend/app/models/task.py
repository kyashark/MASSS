from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base

class TaskStatus(str, enum.Enum):
    PENDING = "Pending"       # Waiting to be done
    IN_PROGRESS = "In Progress" # Currently in a Pomodoro session
    COMPLETED = "Completed"   # Done
    SKIPPED = "Skipped"       # User skipped (Reschedule this!)
    ARCHIVED = "Archived"     # User deleted (Ignore this)

class PriorityLevel(str, enum.Enum):
    LOW = "Low"       # Value: 1
    MEDIUM = "Medium" # Value: 2
    HIGH = "High"     # Value: 3
class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    
    # 1. LINK TO SUBJECT (Inherits Base Difficulty & Importance)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    module = relationship("Module", back_populates="tasks")
    
    # 2. SCHEDULING MATH
    estimated_pomodoros = Column(Integer, default=1) 
    deadline = Column(DateTime, nullable=True)
    
    # 3. USER OVERRIDES
    priority = Column(Enum(PriorityLevel), default=PriorityLevel.MEDIUM)
    is_fixed = Column(Boolean, default=False)
    
    # 4. LIFECYCLE (RL Data)
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)