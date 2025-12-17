from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.base import Base  # Ensure this matches your actual Base import path

# --- Enums (Strict Choices for RL Consistency) ---

class EnergyTime(str, enum.Enum):
    MORNING = "Morning"       # High Energy
    AFTERNOON = "Afternoon"   # Medium Energy
    NIGHT = "Night"           # Low/Variable Energy

class ModuleType(str, enum.Enum):
    CODING = "Coding"         # Active, Logic-heavy
    MATH = "Math"             # Active, Logic-heavy
    THEORY = "Theory"         # Passive, Reading-heavy
    CREATIVE = "Creative"     # Active, Abstract

class TaskStatus(str, enum.Enum):
    PENDING = "Pending"
    COMPLETED = "Completed"
    MISSED = "Missed"         # Crucial for RL penalties

# --- Database Tables ---

class Module(Base):
    """
    Represents a subject/course.
    Holds the 'Global Context' (Difficulty, Exams).
    """
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    
    # Context for RL
    category = Column(Enum(ModuleType), nullable=False)
    difficulty = Column(Integer, nullable=False) # Scale 1-5
    preferred_energy = Column(Enum(EnergyTime), nullable=False)
    
    # Exam Pressure (The "Stick")
    # If this date is close, RL/Heuristic will prioritize tasks from this module.
    upcoming_exam_date = Column(DateTime, nullable=True)
    exam_importance = Column(Integer, default=3) # 1-5 (Midterm vs Quiz)

    # Relationships
    tasks = relationship("Task", back_populates="module", cascade="all, delete-orphan")


class Task(Base):
    """
    Represents a specific unit of work to be scheduled.
    Inherits 'Context' from Module but has its own 'Constraints'.
    """
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    name = Column(String, nullable=False)
    
    # Scheduling Constraints
    estimated_pomodoros = Column(Integer, default=1) # How many 25-min slots? (1-4)
    deadline = Column(DateTime, nullable=True)
    is_assignment = Column(Boolean, default=False)   # True = Strict deadline penalty
    
    # Status Tracking
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    module = relationship("Module", back_populates="tasks")
    sessions = relationship("PomodoroSession", back_populates="task", cascade="all, delete-orphan")


class PomodoroSession(Base):
    """
    The 'Training Data' for RL.
    Records exactly WHAT happened WHEN and HOW focused the user was.
    """
    __tablename__ = "pomodoro_sessions"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    
    # Time Data (For Pattern Recognition)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    
    # The Reward Signal
    # 1-5 Rating provided by user after the session.
    # Null means they didn't rate it yet.
    focus_rating = Column(Integer, nullable=True) 
    
    # Did they finish the session? (False = interrupted/quit)
    completed = Column(Boolean, default=False)

    # Relationships
    task = relationship("Task", back_populates="sessions")