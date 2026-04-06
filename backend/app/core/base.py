"""
We create one file called base.py that imports all the models from everyone.
Then, main.py (or Alembic for migrations) only needs to look at this one file to find every table in the system.

"""

# app/core/base.py

# 1. Import the Base object (The foundation)
from app.core.database import Base

# 2. Import Core Models (The User table)
from app.core.model import User
