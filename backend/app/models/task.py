import enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class PriorityLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    module = relationship("Module", back_populates="tasks")
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=True)
    exam = relationship("Exam", back_populates="tasks")
    estimated_pomodoros = Column(Integer, default=1)
    sessions_count = Column(Integer, default=0)
    deadline = Column(DateTime, nullable=True)
    priority = Column(SAEnum(TaskStatus), default=PriorityLevel.MEDIUM)
    difficulty = Column(Integer, default=3)
    is_fixed = Column(Boolean, default=False)
    status = Column(SAEnum(TaskStatus), default=TaskStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    sessions = relationship("PomodoroSession", back_populates="task")
