from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Enum, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.base import Base

# --- ENUMS ---
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

class DayOfWeek(str, enum.Enum):
    MONDAY = "Monday"
    TUESDAY = "Tuesday"
    WEDNESDAY = "Wednesday"
    THURSDAY = "Thursday"
    FRIDAY = "Friday"
    SATURDAY = "Saturday"
    SUNDAY = "Sunday"

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

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, default="Student")
    
    # 1. Sleep Schedule (Hard Limits)
    wake_up_time = Column(Time, nullable=False) # e.g., 07:00:00
    bed_time = Column(Time, nullable=False)     # e.g., 23:00:00
    
    # 2. Preferred Capacity (Max Pomodoros they WANT to do)
    morning_capacity = Column(Integer, default=4)
    afternoon_capacity = Column(Integer, default=4)
    night_capacity = Column(Integer, default=4)

    fixed_events = relationship("FixedEvent", back_populates="profile", cascade="all, delete-orphan")

class FixedEvent(Base):
    __tablename__ = "fixed_events"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("student_profiles.id"))
    
    name = Column(String, nullable=False) # "Uni Lecture", "Gym"
    day_of_week = Column(Enum(DayOfWeek), nullable=False)
    
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    
    # Which bucket does this reduce?
    slot_category = Column(Enum(EnergyTime), nullable=False)

    profile = relationship("StudentProfile", back_populates="fixed_events")