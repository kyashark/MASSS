import enum
from sqlalchemy import Column, Integer, Float, DateTime, Boolean, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from app.core.database import Base

# --- TIMEZONE HELPER ---
def get_sl_time():
    """
    Returns the current time in Sri Lanka (UTC+5:30) as a naive datetime object.
    This forces the database to store '3:30 PM' instead of '10:00 AM'.
    """
    return datetime.utcnow() + timedelta(hours=5, minutes=30)

# --- ENUM FOR LOGIC MATRIX ---
class SessionEndType(str, enum.Enum):
    COMPLETED = "COMPLETED"   # Timer finished (25m)
    STOPPED = "STOPPED"       # User paused/stopped valid work (<25m)
    ABORTED = "ABORTED"       # User discarded/reset (Trash)
    SKIPPED = "SKIPPED"       # User skipped the session

class PomodoroSession(Base):
    __tablename__ = "pomodoro_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False) # Link to User
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    
    # --- FIXED: Default to Sri Lanka time ---
    start_time = Column(DateTime, default=get_sl_time)
    end_time = Column(DateTime, nullable=True) 
    
    duration_minutes = Column(Float, default=0.0) 
    is_completed = Column(Boolean, default=False) 
    focus_rating = Column(Integer, nullable=True) # 1-5 Stars

    # The Result of the Session
    end_type = Column(SAEnum(SessionEndType), default=SessionEndType.COMPLETED)
    
    # Relationships
    task = relationship("Task", back_populates="sessions")