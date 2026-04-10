from sqlalchemy import Column, Integer, String, Boolean
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=False)

    # Helpful for team projects (e.g., if you need to ban a user later)
    is_active = Column(Boolean, default=True)

    # Tracks whether the user has completed the onboarding wizard
    # False = show onboarding after login
    # True  = go straight to dashboard
    onboarding_completed = Column(Boolean, default=False)
