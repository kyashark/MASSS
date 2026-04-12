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


class ExamType(str, enum.Enum):
    FINAL = "final"
    MIDTERM = "midterm"
    QUIZ = "quiz"
    ASSIGNMENT = "assignment"
    PRESENTATION = "presentation"
    OTHER = "other"


class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    name = Column(String, nullable=False)
    exam_type = Column(SAEnum(ExamType), default=ExamType.QUIZ, nullable=False)
    due_date = Column(Date, nullable=False)
    weight = Column(Integer, default=10)
    is_completed = Column(Boolean, default=False)
    module_id = Column(
        Integer, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False
    )
    module = relationship("Module", back_populates="exams")
    tasks = relationship("Task", back_populates="exam")
