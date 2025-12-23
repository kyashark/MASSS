from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)

    due_date = Column(Date, nullable=True)
    is_completed = Column(Boolean, default=False)

    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"))

    module = relationship("Module", back_populates="tasks")
