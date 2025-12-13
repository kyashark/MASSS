from sqlalchemy.orm import Session
from app.modules.scheduling.models.task_db import TaskDB
from app.modules.scheduling.schemas.task_schemas import TaskCreate, TaskUpdate

class TaskRepository:

    # CREATE
    @staticmethod
    def create_task(db: Session, task_data: TaskCreate):
        db_task = TaskDB(
            title=task_data.title,
            category=task_data.category,
            description=task_data.description,
            is_completed=False
        )
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        return db_task

    # GET ALL
    @staticmethod
    def get_all_tasks(db: Session):
        return db.query(TaskDB).all()

    # GET ONE
    @staticmethod
    def get_by_id(db: Session, task_id: int):
        return db.query(TaskDB).filter(TaskDB.id == task_id).first()

    # UPDATE
    @staticmethod
    def update_task(db: Session, task_db: TaskDB, updates: TaskUpdate):
        # Convert Pydantic model to dict, removing None values
        update_data = updates.dict(exclude_unset=True)
        
        for key, value in update_data.items():
            setattr(task_db, key, value)

        db.commit()
        db.refresh(task_db)
        return task_db

    # DELETE
    @staticmethod
    def delete_task(db: Session, task_db: TaskDB):
        db.delete(task_db)
        db.commit()
        return True