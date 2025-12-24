from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import SessionLocal
from app.models.session import PomodoroSession
from app.models.task import Task, TaskStatus # Import to update status
from app.schemas import session as schemas

router = APIRouter(prefix="/sessions", tags=["Pomodoro Sessions"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 1. START SESSION (Timer Start) ---
@router.post("/start", response_model=schemas.SessionResponse, status_code=status.HTTP_201_CREATED)
def start_session(payload: schemas.SessionCreate, db: Session = Depends(get_db)):
    # Verify Task Exists
    task = db.query(Task).filter(Task.id == payload.task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # LOGIC: Update Task Status to show it's active
    task.status = TaskStatus.IN_PROGRESS

    # Create the Session Log
    new_session = PomodoroSession(
        task_id=payload.task_id,
        start_time=datetime.utcnow(),
        is_completed=False
    )
    
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

# --- 2. END SESSION (Timer Stop) ---
@router.post("/{session_id}/end", response_model=schemas.SessionResponse)
def end_session(
    session_id: int, 
    payload: schemas.SessionEnd, 
    db: Session = Depends(get_db)
):
    session = db.query(PomodoroSession).filter(PomodoroSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.end_time:
        raise HTTPException(status_code=400, detail="Session already ended")

    # LOGIC: Calculate precise duration
    end_time = datetime.utcnow()
    duration_seconds = (end_time - session.start_time).total_seconds()
    
    # Update Session Data
    session.end_time = end_time
    session.duration_minutes = round(duration_seconds / 60, 2)
    session.is_completed = payload.is_completed
    session.focus_rating = payload.focus_rating
    
    # NOTE: We do NOT auto-complete the Task here. 
    # The user might need 3 sessions to finish 1 task.
    # We let the frontend ask "Did you finish the task?" separately.

    db.commit()
    db.refresh(session)
    return session