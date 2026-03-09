from fastapi import FastAPI
from sqlalchemy import text
from fastapi.middleware.cors import CORSMiddleware

# 1. Import Core Database Setup
from app.core.database import engine
from app.core import base

# 2. Import Your Module Routers
# from app.modules.scheduling.router import router as scheduling_router
from app.modules.test_crud.router import router as test_crud_router
from app.routers import (
    module_router,
    exam_router,
    task_router,
    session_router,
    profile_router,
    schedule_router,
)
from app.routers.rl_state import router as rl_state_router
from app.routers.rl_action import router as rl_action_router
from app.routers.rl_session import router as rl_session_router
from app.routers.rl_bridge_router import router as rl_bridge_router
from app.routers.rl_policy import router as rl_policy_router
from app.routers.rl_gap import router as rl_gap_router
from app.routers.stats import router as stats_router


# Ensure tables exist (Good for development, safer to leave it)
base.Base.metadata.create_all(bind=engine)

app = FastAPI(title="MASSS - Smart Scheduler")

# Allow your frontend origin
origins = [
    "http://localhost:5173",  # Vite dev server
    "http://127.0.0.1:5173",
]
# --- CORS Configuration (Frontend Access) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Register Routers ---
# This makes your Scheduling API accessible at /api/scheduling/...
# app.include_router(
#     scheduling_router,
#     prefix="/api/scheduling",
#     tags=["Scheduling"]
# )

app.include_router(module_router, prefix="/api")
app.include_router(exam_router, prefix="/api")
app.include_router(task_router, prefix="/api")
app.include_router(session_router, prefix="/api")
app.include_router(profile_router, prefix="/api")

app.include_router(schedule_router, prefix="/api")


app.include_router(rl_state_router, prefix="/api")
app.include_router(rl_action_router, prefix="/api")
app.include_router(rl_session_router, prefix="/api")
app.include_router(rl_bridge_router, prefix="/api")
app.include_router(rl_policy_router, prefix="/api")
app.include_router(rl_gap_router, prefix="/api")
app.include_router(stats_router, prefix="/api/stats")

# --- Basic Health Check Endpoint ---
app.include_router(test_crud_router, prefix="/api/test-crud", tags=["Test CRUD"])


@app.get("/")
def home():
    return {"message": "Hello Shark, Smart Scheduler AI is Online! 🦈"}


@app.get("/test-db")
def test_db_connection():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "Database Connected Successfully"}
    except Exception as e:
        return {"status": "Connection Failed", "error": str(e)}
