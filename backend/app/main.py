from fastapi import FastAPI
from sqlalchemy import text
from fastapi.middleware.cors import CORSMiddleware

# 1. Import Core Database Setup
from app.core.database import engine
from app.core import base

# 2. Import Your Module Routers
from app.modules.scheduling.router import router as scheduling_router
from app.modules.test_crud.router import router as test_crud_router


# Ensure tables exist (Good for development, safer to leave it)
base.Base.metadata.create_all(bind=engine)

app = FastAPI(title="MASSS - Smart Scheduler")

# --- CORS Configuration (Frontend Access) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Register Routers ---
# This makes your Scheduling API accessible at /api/scheduling/...
app.include_router(
    scheduling_router, 
    prefix="/api/scheduling", 
    tags=["Scheduling"]
)

# --- Basic Health Check Endpoint ---
app.include_router(
    test_crud_router, 
    prefix="/api/test-crud", 
    tags=["Test CRUD"])


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