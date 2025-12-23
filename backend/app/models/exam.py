from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)           
    name = Column(String, nullable=False)
    exam_type = Column(String, nullable=False)   # Final, Quiz, Assignment
    due_date = Column(Date, nullable=False)

    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"))

    module = relationship("Module", back_populates="exams")
