from fastapi import FastAPI
from sqlalchemy import text
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine, Base
from app.core import base  # registers all models for Alembic

from app.routers import (
    module_router,
    exam_router,
    task_router,
    session_router,
    profile_router,
    schedule_router,
)
from app.routers.rl_state import router as rl_state_router
from app.routers.stats import router as stats_router
from app.routers.auth import router as auth_router
from app.routers.onboarding import router as onboarding_router


app = FastAPI(title="MASSS - Smart Scheduler API")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers ---
app.include_router(auth_router, prefix="/api")
app.include_router(module_router, prefix="/api")
app.include_router(exam_router, prefix="/api")
app.include_router(task_router, prefix="/api")
app.include_router(session_router, prefix="/api")
app.include_router(profile_router, prefix="/api")
app.include_router(schedule_router, prefix="/api")
app.include_router(rl_state_router, prefix="/api")
app.include_router(stats_router, prefix="/api/stats")
app.include_router(onboarding_router, prefix="/api")


@app.get("/")
def home():
    return {"message": "MASSS API is online"}


@app.get("/health")
def health():
    from app.services.rl_client import check_rl_health

    rl = check_rl_health()
    return {
        "api": "ok",
        "rl_service": rl.get("status", "unreachable"),
        "rl_model_loaded": rl.get("model_loaded", False),
    }


@app.get("/test-db")
def test_db():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "Database connected"}
    except Exception as e:
        return {"status": "Failed", "error": str(e)}
