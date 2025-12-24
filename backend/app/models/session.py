from sqlalchemy import Column, Integer, Float, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base

# --- NEW ENUM FOR END TYPE ---
class SessionEndType(str, enum.Enum):
    COMPLETED = "COMPLETED"   # Timer hit 00:00
    STOPPED = "STOPPED"       # User clicked Stop manually (Valid work)
    ABORTED = "ABORTED"       # Restarted or Cancelled < 5 mins (Ignore for stats)
    SKIPPED = "SKIPPED"       # User rejected the session entirely

class PomodoroSession(Base):
    __tablename__ = "pomodoro_sessions"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True) 
    
    duration_minutes = Column(Float, nullable=True) 
    is_completed = Column(Boolean, default=False) 
    focus_rating = Column(Integer, nullable=True) 

    # --- NEW FIELD ---
    end_type = Column(Enum(SessionEndType), default=SessionEndType.COMPLETED)
    
    task = relationship("Task", back_populates="sessions")