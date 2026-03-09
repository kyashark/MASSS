import enum
from sqlalchemy import (
    Boolean,
    Column,
    Integer,
    String,
    Date,
    ForeignKey,
    Enum as SAEnum,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


# Define strict types for Exams
class ExamType(str, enum.Enum):
    FINAL = "Final"
    MIDTERM = "Midterm"
    QUIZ = "Quiz"
    ASSIGNMENT = "Assignment"
    PRESENTATION = "Presentation"
    OTHER = "Other"


class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)

    name = Column(String, nullable=False)
    # Upgrade: Use Enum instead of plain String
    exam_type = Column(SAEnum(ExamType), default=ExamType.QUIZ, nullable=False)

    due_date = Column(Date, nullable=False)

    # Upgrade: Added Weight (Percentage importance, e.g., 30 for 30%)
    # This helps the AI decide what to study for first.
    weight = Column(Integer, default=10)
    is_completed = Column(Boolean, default=False)

    # Foreign Key
    module_id = Column(
        Integer, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False
    )

    # Relationships
    module = relationship("Module", back_populates="exams")

    # Enable linking Tasks to this Exam (e.g., "Study for Final")
    tasks = relationship("Task", back_populates="exam")
