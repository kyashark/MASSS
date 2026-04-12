import enum
from sqlalchemy import (
    Column,
    Integer,
    Float,
    DateTime,
    Boolean,
    ForeignKey,
    Enum as SAEnum,
    String,
)
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from app.core.database import Base


def get_sl_time():
    return datetime.utcnow() + timedelta(hours=5, minutes=30)


class SessionEndType(str, enum.Enum):
    COMPLETED = "completed"
    STOPPED = "stopped"
    ABORTED = "aborted"
    SKIPPED = "skipped"


class PomodoroSession(Base):
    __tablename__ = "pomodoro_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    start_time = Column(DateTime, default=get_sl_time)
    end_time = Column(DateTime, nullable=True)
    duration_minutes = Column(Float, default=0.0)
    is_completed = Column(Boolean, default=False)
    focus_rating = Column(Integer, nullable=True)
    end_type = Column(SAEnum(SessionEndType), default=SessionEndType.COMPLETED)
    slot_type = Column(String, nullable=False)
    task = relationship("Task", back_populates="sessions")
