from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.base import Base

# --- Enums remain the same ---
class EnergyTime(str, enum.Enum):
    MORNING = "Morning"
    AFTERNOON = "Afternoon"
    NIGHT = "Night"

class ModuleType(str, enum.Enum):
    CODING = "Coding"
    MATH = "Math"
    THEORY = "Theory"
    CREATIVE = "Creative"

class TaskStatus(str, enum.Enum):
    PENDING = "Pending"
    COMPLETED = "Completed"
    MISSED = "Missed"

# --- Database Tables ---

class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(Enum(ModuleType), nullable=False)
    difficulty = Column(Integer, nullable=False)
    preferred_energy = Column(Enum(EnergyTime), nullable=False)
    
    # Relationships
    tasks = relationship("Task", back_populates="module", cascade="all, delete-orphan")
    exams = relationship("Exam", back_populates="module", cascade="all, delete-orphan")

class Exam(Base): # <--- NEW TABLE
    __tablename__ = "exams"
    
    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    name = Column(String, nullable=False) # e.g., "Midterm 1"
    date = Column(DateTime, nullable=False)
    importance = Column(Integer, default=3) # 1-5
    
    module = relationship("Module", back_populates="exams")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    name = Column(String, nullable=False)
    
    estimated_pomodoros = Column(Integer, default=1)
    
    # Deadline is now Optional (Nullable)
    deadline = Column(DateTime, nullable=True) 
    is_assignment = Column(Boolean, default=False)
    
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING)
    created_at = Column(DateTime, default=func.now())

    module = relationship("Module", back_populates="tasks")
    sessions = relationship("PomodoroSession", back_populates="task", cascade="all, delete-orphan")

class PomodoroSession(Base):
    __tablename__ = "pomodoro_sessions"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    focus_rating = Column(Integer, nullable=True) 
    completed = Column(Boolean, default=False)

    task = relationship("Task", back_populates="sessions")