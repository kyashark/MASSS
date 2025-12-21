from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.exam import Exam
from app.schemas.exam import ExamCreate, ExamResponse

router = APIRouter(prefix="/exams", tags=["Exams"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/module/{module_id}", response_model=ExamResponse)
def add_exam(module_id: int, payload: ExamCreate, db: Session = Depends(get_db)):
    exam = Exam(
        name=payload.name,
        exam_type=payload.exam_type,
        due_date=payload.due_date,
        module_id=module_id
    )

    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam
