from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import SessionLocal
from app.models.module import Module
from app.models.exam import Exam
from app.schemas.module import ModuleCreate, ModuleResponse, ModuleBase
from app.dependencies.auth import get_current_user, DummyUser

router = APIRouter(prefix="/modules", tags=["Modules"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# CREATE
@router.post("/", response_model=ModuleResponse, status_code=201)
def create_module(
    payload: ModuleCreate,
    db: Session = Depends(get_db),
    current_user: DummyUser = Depends(get_current_user),
):
    module = Module(
        user_id=current_user.id,
        name=payload.name,
        category=payload.category,
        color=payload.color,
        priority=payload.priority,
        difficulty=payload.difficulty,
        energy_time=payload.energy_time,
    )

    db.add(module)
    db.flush()  

    # Add exams if provided
    for exam in payload.exams:
        db.add(
            Exam(
                name=exam.name,
                exam_type=exam.exam_type,
                due_date=exam.due_date,
                module_id=module.id,
                user_id=current_user.id
            )
        )

    db.commit()
    db.refresh(module)
    return module


# READ ALL (user modules)
@router.get("/", response_model=List[ModuleResponse])
def get_modules(
    db: Session = Depends(get_db),
    current_user: DummyUser = Depends(get_current_user),
):
    return db.query(Module).filter(Module.user_id == current_user.id).all()


# READ SINGLE MODULE
@router.get("/{module_id}", response_model=ModuleResponse)
def get_module(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: DummyUser = Depends(get_current_user),
):
    module = db.query(Module).filter(
        Module.id == module_id, Module.user_id == current_user.id
    ).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    return module


# UPDATE MODULE
@router.put("/{module_id}", response_model=ModuleResponse)
def update_module(
    module_id: int,
    payload: ModuleBase,
    db: Session = Depends(get_db),
    current_user: DummyUser = Depends(get_current_user),
):
    module = db.query(Module).filter(
        Module.id == module_id, Module.user_id == current_user.id
    ).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    module.name = payload.name
    module.category = payload.category
    module.color = payload.color
    module.priority = payload.priority
    module.difficulty = payload.difficulty
    module.energy_time = payload.energy_time

    db.commit()
    db.refresh(module)
    return module


# DELETE MODULE
@router.delete("/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_module(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: DummyUser = Depends(get_current_user),
):
    module = db.query(Module).filter(
        Module.id == module_id, Module.user_id == current_user.id
    ).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    db.delete(module)
    db.commit()
