from sqlalchemy import Column, Integer, String, Boolean
from app.core.database import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = {"extend_existing": True}  # ✅ add this

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
