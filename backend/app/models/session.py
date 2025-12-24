from sqlalchemy import Column, Integer, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class PomodoroSession(Base):
    __tablename__ = "pomodoro_sessions"

    id = Column(Integer, primary_key=True, index=True)
    
    # 1. LINK TO CONTEXT (The Task & Module info comes from here)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    task = relationship("Task", back_populates="sessions")
    
    # 2. THE STATE (When did it happen?)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True) 
    
    # 3. THE REWARD (How did it go?)
    # duration = partial success check
    # is_completed + focus_rating = full success check
    duration_minutes = Column(Float, nullable=True) 
    is_completed = Column(Boolean, default=False) 
    focus_rating = Column(Integer, nullable=True) # 1 (Distracted) to 5 (Deep Focus)