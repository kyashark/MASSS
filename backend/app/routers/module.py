from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.module import Module
from app.models.exam import Exam
from app.schemas.module import ModuleCreate, ModuleResponse, ModuleBase
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/modules", tags=["Modules"])


@router.post("/", response_model=ModuleResponse, status_code=status.HTTP_201_CREATED)
def create_module(
    payload: ModuleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    new_module = Module(
        user_id=current_user.id,
        name=payload.name,
        category=payload.category,
        color=payload.color,
        energy_time=payload.energy_time,
    )
    db.add(new_module)
    db.flush()

    for exam_data in payload.exams:
        new_exam = Exam(
            module_id=new_module.id,
            user_id=current_user.id,
            name=exam_data.name,
            exam_type=exam_data.exam_type,
            due_date=exam_data.due_date,
            weight=exam_data.weight,
        )
        db.add(new_exam)

    db.commit()
    db.refresh(new_module)
    return new_module


@router.get("/", response_model=List[ModuleResponse])
def get_modules(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return db.query(Module).filter(Module.user_id == current_user.id).all()


@router.get("/{module_id}", response_model=ModuleResponse)
def get_module(
    module_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    module = (
        db.query(Module)
        .filter(Module.id == module_id, Module.user_id == current_user.id)
        .first()
    )

    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    return module


@router.put("/{module_id}", response_model=ModuleResponse)
def update_module(
    module_id: int,
    payload: ModuleBase,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    module = (
        db.query(Module)
        .filter(Module.id == module_id, Module.user_id == current_user.id)
        .first()
    )

    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    module.name = payload.name
    module.category = payload.category
    module.color = payload.color
    module.energy_time = payload.energy_time

    db.commit()
    db.refresh(module)
    return module


@router.delete("/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_module(
    module_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    module = (
        db.query(Module)
        .filter(Module.id == module_id, Module.user_id == current_user.id)
        .first()
    )

    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    db.delete(module)
    db.commit()
