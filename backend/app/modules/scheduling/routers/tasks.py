from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

# Import Shared Core Dependencies
from app.core.database import get_db

# Import Your Module Files
from app.modules.scheduling.schemas.task_schemas import TaskCreate, TaskUpdate, TaskResponse
from app.modules.scheduling.repository.task_repo import TaskRepository

router = APIRouter()
repo = TaskRepository()

@router.post("/", response_model=TaskResponse)
def create_task(data: TaskCreate, db: Session = Depends(get_db)):
    return repo.create_task(db, data)

@router.get("/", response_model=list[TaskResponse])
def get_tasks(db: Session = Depends(get_db)):
    return repo.get_all_tasks(db)

@router.get("/{task_id}", response_model=TaskResponse)
def get_by_id(task_id: int, db: Session = Depends(get_db)):
    task = repo.get_by_id(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, data: TaskUpdate, db: Session = Depends(get_db)):
    task_db = repo.get_by_id(db, task_id)
    if not task_db:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return repo.update_task(db, task_db, data)

@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task_db = repo.get_by_id(db, task_id)
    if not task_db:
        raise HTTPException(status_code=404, detail="Task not found")
    
    repo.delete_task(db, task_db)
    return {"status": "success", "message": "Task deleted"}