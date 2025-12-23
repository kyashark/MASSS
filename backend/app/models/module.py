from sqlalchemy import Column, Integer, String, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base 
import enum


class Category(str, enum.Enum):
    CODING = "Coding"
    MATH = "Math/Logic"
    LANGUAGE = "Language"
    CREATIVE_DESIGN = "Creative Design"
    MEMORIZATION = "Memorization"

class Priority(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class EnergyTime(str, enum.Enum):
    MORNING = "Morning"
    AFTERNOON = "Afternoon"
    EVENING = "Evening"

class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    color = Column(String, default="#E89BAE")
    priority = Column(Enum(Priority), default=Priority.MEDIUM)
    difficulty = Column(Integer, default=3) # 1 to 5
    energy_time = Column(String, nullable=False)

    # Relationships (Using strings to avoid circular imports)
    exams = relationship("Exam", back_populates="module", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="module", cascade="all, delete-orphan")