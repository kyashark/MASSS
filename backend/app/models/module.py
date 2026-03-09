import enum
from sqlalchemy import Column, Integer, String, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.core.database import Base


class Category(str, enum.Enum):
    CODING = "Coding"
    MATH = "Math/Logic"
    LANGUAGE = "Language"
    CREATIVE_DESIGN = "Creative Design"
    MEMORIZATION = "Memorization"
    OTHER = "Other"


class EnergyTime(str, enum.Enum):
    MORNING = "Morning"
    AFTERNOON = "Afternoon"
    EVENING = "Evening"


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

    # Relationships
    exams = relationship("Exam", back_populates="module", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="module", cascade="all, delete-orphan")
