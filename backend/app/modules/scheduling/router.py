# app/modules/scheduling/router.py

from fastapi import APIRouter
from app.modules.scheduling.routers import tasks  # Import your sub-routers here
# from app.modules.scheduling.routers import sessions (Future)

# 1. Create the Master Router
router = APIRouter()

# 2. Attach the sub-routers
# The main app will see "/api/schedule/tasks" automatically
router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])

# Later you will add:
# router.include_router(sessions.router, prefix="/sessions", tags=["Sessions"])