import enum
from sqlalchemy import (
    Column,
    Float,
    Integer,
    String,
    Time,
    Enum as SAEnum,
    # ForeignKey,
    Boolean,
)

# from sqlalchemy.orm import relationship
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
    CLASS = "Class"
    SLEEP = "Sleep"
    HABIT = "Habit"
    WORK = "Work"


class SlotName(str, enum.Enum):
    MORNING = "Morning"
    AFTERNOON = "Afternoon"
    EVENING = "Evening"


class Chronotype(str, enum.Enum):
    MORNING_BIRD = "Morning Bird"
    NIGHT_OWL = "Night Owl"
    BALANCED = "Balanced"


# --- Table 1: Fixed Schedule ---
class WeeklyRoutine(Base):
    __tablename__ = "weekly_routine"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)

    name = Column(String, nullable=False)
    activity_type = Column(SAEnum(ActivityType), default=ActivityType.CLASS)

    day_of_week = Column(SAEnum(DayOfWeek), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)


# --- Table 2: Energy Preferences ---
class SlotPreference(Base):
    __tablename__ = "slot_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)

    slot_name = Column(SAEnum(SlotName), nullable=False)

    # User-defined limit
    max_pomodoros = Column(Integer, default=4)

    # NEW: Behavioral Energy Score (0.0 to 1.0)
    inferred_energy_score = Column(Float, default=0.5)

    is_preferred = Column(Boolean, default=False)
