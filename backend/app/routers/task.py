from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskResponse

router = APIRouter(prefix="/tasks", tags=["Tasks"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/module/{module_id}", response_model=TaskResponse)
def create_task(module_id: int, payload: TaskCreate, db: Session = Depends(get_db)):
    task = Task(
        title=payload.title,
        description=payload.description,
        due_date=payload.due_date,
        module_id=module_id
    )

    db.add(task)
    db.commit()
    db.refresh(task)
    return task
