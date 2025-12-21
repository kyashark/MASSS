from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.module import Module
from app.models.exam import Exam
from app.schemas.module import ModuleCreate, ModuleResponse
from app.dependencies.auth import get_current_user, DummyUser

router = APIRouter(prefix="/modules", tags=["Modules"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=ModuleResponse)
def create_module(
    payload: ModuleCreate,
    db: Session = Depends(get_db),
    current_user: DummyUser = Depends(get_current_user),
):
    module = Module(
        user_id=current_user.id,  # 👈 future-proof
        name=payload.name,
        category=payload.category,
        color=payload.color,
        priority=payload.priority,
        difficulty=payload.difficulty,
        energy_time=payload.energy_time,
    )

    db.add(module)
    db.flush()

    for exam in payload.exams:
        db.add(
            Exam(
                name=exam.name,
                exam_type=exam.exam_type,
                due_date=exam.due_date,
                module_id=module.id,
            )
        )

    db.commit()
    db.refresh(module)
    return module


@router.get("/", response_model=list[ModuleResponse])
def get_modules(
    db: Session = Depends(get_db),
    current_user: DummyUser = Depends(get_current_user),
):
    return (
        db.query(Module)
        .filter(Module.user_id == current_user.id)
        .all()
    )
