import enum
from sqlalchemy import Column, Float, Integer, String, Time, Enum as SAEnum, Boolean
from app.core.database import Base


class DayOfWeek(str, enum.Enum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


class ActivityType(str, enum.Enum):
    CLASS = "class"
    SLEEP = "sleep"
    HABIT = "habit"
    WORK = "work"


class SlotName(str, enum.Enum):
    MORNING = "morning"
    AFTERNOON = "afternoon"
    EVENING = "evening"


class Chronotype(str, enum.Enum):
    MORNING_BIRD = "morning_bird"
    NIGHT_OWL = "night_owl"
    BALANCED = "balanced"


class WeeklyRoutine(Base):
    __tablename__ = "weekly_routine"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    name = Column(String, nullable=False)
    activity_type = Column(SAEnum(ActivityType), default=ActivityType.CLASS)
    day_of_week = Column(SAEnum(DayOfWeek), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)


class SlotPreference(Base):
    __tablename__ = "slot_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    slot_name = Column(SAEnum(SlotName), nullable=False)
    max_pomodoros = Column(Integer, default=4)
    inferred_energy_score = Column(Float, default=0.5)
    is_preferred = Column(Boolean, default=False)
