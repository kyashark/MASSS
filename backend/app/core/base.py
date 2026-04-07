"""
base.py — Central model registry for Alembic migrations.

Import every SQLAlchemy model here so Alembic can find
all tables when generating migrations.

Add new models below as you create them.
"""

# Foundation
from app.core.database import Base

# User
from app.core.model import User

# Domain Models
from app.models.module import Module
from app.models.exam import Exam
from app.models.task import Task
from app.models.session import PomodoroSession
from app.models.profile import WeeklyRoutine, SlotPreference
