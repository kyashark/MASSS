import enum
from sqlalchemy import Column, Integer, String, Time, Enum as SAEnum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

# --- Enums for Standardization ---
class DayOfWeek(str, enum.Enum):
    MONDAY = "Monday"
    TUESDAY = "Tuesday"
    WEDNESDAY = "Wednesday"
    THURSDAY = "Thursday"
    FRIDAY = "Friday"
    SATURDAY = "Saturday"
    SUNDAY = "Sunday"

class ActivityType(str, enum.Enum):
    CLASS = "Class"       # Hard constraint (University)
    SLEEP = "Sleep"       # Hard constraint
    HABIT = "Habit"       # Soft constraint (Gym, Meditation)
    WORK = "Work"         # Part-time job

class SlotName(str, enum.Enum):
    MORNING = "Morning"     # 06:00 - 12:00
    AFTERNOON = "Afternoon" # 12:00 - 18:00
    EVENING = "Evening"     # 18:00 - 00:00

# --- Table 1: Fixed Schedule ---
class WeeklyRoutine(Base):
    __tablename__ = "weekly_routine"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    
    name = Column(String, nullable=False) # e.g., "Calculus Lecture"
    activity_type = Column(SAEnum(ActivityType), default=ActivityType.CLASS)
    
    day_of_week = Column(SAEnum(DayOfWeek), nullable=False)
    start_time = Column(Time, nullable=False) # e.g., 09:00:00
    end_time = Column(Time, nullable=False)   # e.g., 11:00:00

# --- Table 2: Energy Preferences ---
class SlotPreference(Base):
    __tablename__ = "slot_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    
    slot_name = Column(SAEnum(SlotName), nullable=False)
    
    # "How many Pomodoros can I handle?"
    max_pomodoros = Column(Integer, default=4) 
    
    # Is this my favorite time to work? (Optional hint for AI)
    is_preferred = Column(Boolean, default=False)