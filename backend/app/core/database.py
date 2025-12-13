
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Create the Engine (The Connection)
engine = create_engine(settings.DATABASE_URL)

# Create the Session Factory
# Each request (e.g., "Add Task") gets its own session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. Create the Base Class
# All your models (and your teammates' models) will inherit from this
Base = declarative_base()

# 4. Dependency (Helper function for API routes)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()