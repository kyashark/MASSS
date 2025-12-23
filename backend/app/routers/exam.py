from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import SessionLocal
from app.models.exam import Exam
from app.schemas.exam import ExamCreate, ExamUpdate, ExamResponse
from app.dependencies.auth import get_current_user, DummyUser  # import your dummy auth

router = APIRouter(prefix="/exams", tags=["Exams"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


#  CREATE
@router.post("/module/{module_id}", response_model=ExamResponse, status_code=201)
def add_exam(
    module_id: int,
    payload: ExamCreate,
    db: Session = Depends(get_db),
    current_user: DummyUser = Depends(get_current_user)
):
    exam = Exam(
        name=payload.name,
        exam_type=payload.exam_type,
        due_date=payload.due_date,
        module_id=module_id,
        user_id=current_user.id,  # associate with user
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam


#  READ ALL (by module & user)
@router.get("/module/{module_id}", response_model=List[ExamResponse])
def get_exams_by_module(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: DummyUser = Depends(get_current_user)
):
    exams = db.query(Exam).filter(
        Exam.module_id == module_id,
        Exam.user_id == current_user.id
    ).all()
    return exams


#  READ ONE
@router.get("/{exam_id}", response_model=ExamResponse)
def get_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: DummyUser = Depends(get_current_user)
):
    exam = db.query(Exam).filter(
        Exam.id == exam_id,
        Exam.user_id == current_user.id
    ).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam


#  UPDATE
@router.put("/{exam_id}", response_model=ExamResponse)
def update_exam(
    exam_id: int,
    payload: ExamUpdate,
    db: Session = Depends(get_db),
    current_user: DummyUser = Depends(get_current_user)
):
    exam = db.query(Exam).filter(
        Exam.id == exam_id,
        Exam.user_id == current_user.id
    ).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    if payload.name is not None:
        exam.name = payload.name
    if payload.exam_type is not None:
        exam.exam_type = payload.exam_type
    if payload.due_date is not None:
        exam.due_date = payload.due_date

    db.commit()
    db.refresh(exam)
    return exam


#  DELETE
@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: DummyUser = Depends(get_current_user)
):
    exam = db.query(Exam).filter(
        Exam.id == exam_id,
        Exam.user_id == current_user.id
    ).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    db.delete(exam)
    db.commit()
