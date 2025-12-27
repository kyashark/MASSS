from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import SessionLocal
from app.models.task import Task, TaskStatus, PriorityLevel
from app.models.module import Module
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from app.dependencies.auth import get_current_user # Assuming standard auth

router = APIRouter(prefix="/tasks", tags=["Tasks"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 1. CREATE TASK ---
@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Optional: Check if Module belongs to user
    module = db.query(Module).filter(
        Module.id == payload.module_id,
        Module.user_id == current_user.id
    ).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found or access denied")

    new_task = Task(
        **payload.dict(),
        user_id=current_user.id, # Assign owner
        sessions_count=0 # Start at 0
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

# --- 2. GET TASKS ---
@router.get("/", response_model=List[TaskResponse])
def read_tasks(
    status: Optional[TaskStatus] = None,
    module_id: Optional[int] = None,
    exam_id: Optional[int] = None,
    priority: Optional[PriorityLevel] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Base query: Only get tasks for THIS user
    query = db.query(Task).filter(Task.user_id == current_user.id)

    # Filter Logic
    if status:
        query = query.filter(Task.status == status)
    else:
        # Default: Hide Archived tasks unless explicitly requested
        query = query.filter(Task.status != TaskStatus.ARCHIVED)

    if module_id:
        query = query.filter(Task.module_id == module_id)
        
    if exam_id:
        query = query.filter(Task.exam_id == exam_id)
        
    if priority:
        query = query.filter(Task.priority == priority)

    return query.all()

# --- 3. GET SINGLE TASK ---
@router.get("/{task_id}", response_model=TaskResponse)
def read_task(
    task_id: int, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    task = db.query(Task).filter(
        Task.id == task_id, 
        Task.user_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

# --- 4. UPDATE TASK ---
@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int, 
    payload: TaskUpdate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    task = db.query(Task).filter(
        Task.id == task_id, 
        Task.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Only update fields that are sent
    update_data = payload.dict(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)
    return task

# --- 5. ARCHIVE TASK ---
@router.delete("/{task_id}")
def archive_task(
    task_id: int, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    task = db.query(Task).filter(
        Task.id == task_id, 
        Task.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Soft Delete
    task.status = TaskStatus.ARCHIVED
    db.commit()
    
    return {"message": "Task archived successfully"}