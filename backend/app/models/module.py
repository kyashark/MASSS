import enum
from sqlalchemy import Column, Integer, String, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.core.database import Base


class Category(str, enum.Enum):
    CODING = "coding"
    MATH_LOGIC = "math_logic"
    LANGUAGE = "language"
    CREATIVE_DESIGN = "creative_design"
    MEMORIZATION = "memorization"
    OTHER = "other"


class EnergyTime(str, enum.Enum):
    MORNING = "morning"
    AFTERNOON = "afternoon"
    EVENING = "evening"


class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    name = Column(String, nullable=False)
    color = Column(String, default="#E89BAE")
    category = Column(SAEnum(Category), default=Category.OTHER, nullable=False)
    energy_time = Column(
        SAEnum(EnergyTime), default=EnergyTime.AFTERNOON, nullable=False
    )
    exams = relationship("Exam", back_populates="module", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="module", cascade="all, delete-orphan")
