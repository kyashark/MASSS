from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import SessionLocal

# Import your Logic and Schemas

# Import Logic
from app.modules.scheduling.services.heuristic import generate_heuristic_schedule

# Import Schemas (Added TaskCreate)
from app.modules.scheduling.schemas import TaskResponse, TaskCreate 

# Import Models (Added Module, TaskStatus)
from app.modules.scheduling.models import Task, Module, TaskStatus
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


# --- 3. CREATE TASK (The "Add New" Feature) ---
@router.post("/tasks", response_model=TaskResponse)
def create_task(task_in: TaskCreate, db: Session = Depends(get_db)):
    """
    Creates a new task in the database.
    Verifies that the Module exists before adding.
    """
    # 1. Validate Module Exists
    # We cannot add a task to a non-existent module!
    module = db.query(Module).filter(Module.id == task_in.module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail=f"Module with ID {task_in.module_id} not found")

    # 2. Save to DB
    new_task = Task(
        name=task_in.name,
        module_id=task_in.module_id,
        estimated_pomodoros=task_in.estimated_pomodoros,
        deadline=task_in.deadline, # Can be None (Handled by your Schema)
        is_assignment=task_in.is_assignment,
        status=TaskStatus.PENDING # Always start as Pending
    )
    
    db.add(new_task)
    db.commit()
    db.refresh(new_task) # Reload to get the new ID and CreatedAt date
    return new_task

# --- GET PENDING TASKS ONLY (For the Main To-Do List) ---
@router.get("/tasks/pending", response_model=List[TaskResponse])
def get_pending_tasks(db: Session = Depends(get_db)):
    """
    Get only tasks that are not yet completed.
    Useful for the main 'Backlog' view.
    """
    return db.query(Task).filter(Task.status == TaskStatus.PENDING).all()