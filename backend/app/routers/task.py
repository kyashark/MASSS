from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import SessionLocal
# Make sure you have the Module model available for validation
# from app.models.module import Module 
from app.models.task import Task, TaskStatus, PriorityLevel
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["Tasks"])

# Dependency (As per your old file structure)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 1. CREATE TASK ---
@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreate, db: Session = Depends(get_db)):
    """
    Creates a new task.
    We check if the Module exists first (optional but recommended).
    """
    # Optional: Validation logic if you have the Module model imported
    # module = db.query(Module).filter(Module.id == payload.module_id).first()
    # if not module:
    #     raise HTTPException(status_code=404, detail="Module not found")

    # We use **payload.dict() to automatically map:
    # name, description, deadline, priority, estimated_pomodoros, module_id
    new_task = Task(**payload.dict())

    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

# --- 2. GET TASKS (With Filtering) ---
@router.get("/", response_model=List[TaskResponse])
def read_tasks(
    status: Optional[TaskStatus] = None,
    module_id: Optional[int] = None,
    priority: Optional[PriorityLevel] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Task)

    # Filter Logic
    if status:
        query = query.filter(Task.status == status)
    else:
        # Default: Don't show ARCHIVED tasks unless explicitly asked
        query = query.filter(Task.status != TaskStatus.ARCHIVED)

    if module_id:
        query = query.filter(Task.module_id == module_id)
        
    if priority:
        query = query.filter(Task.priority == priority)

    return query.all()

# --- 3. UPDATE TASK (Patch) ---
@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, payload: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Only update fields that are sent (exclude_unset=True)
    update_data = payload.dict(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)
    return task

# --- 4. DELETE TASK (Soft Archive) ---
@router.delete("/{task_id}")
def archive_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Soft Delete: Mark as ARCHIVED instead of removing from DB
    task.status = TaskStatus.ARCHIVED
    db.commit()
    
    return {"message": "Task archived successfully"}