from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from typing import List

# Import your Logic and Schemas
from app.modules.scheduling.services.heuristic import generate_heuristic_schedule
from app.modules.scheduling.schemas import TaskResponse 
from app.modules.scheduling.models import Task

router = APIRouter()

# Dependency to get DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 1. GET TASKS (To see what we have) ---
@router.get("/tasks", response_model=List[TaskResponse])
def get_all_tasks(db: Session = Depends(get_db)):
    return db.query(Task).all()

# --- 2. GENERATE SCHEDULE (The Magic Button) ---
@router.post("/generate-schedule")
def auto_schedule(db: Session = Depends(get_db)):
    """
    Triggers the Heuristic Scheduler.
    Returns a JSON plan of what the user should do today.
    """
    plan = generate_heuristic_schedule(db)
    return {"status": "success", "schedule": plan}