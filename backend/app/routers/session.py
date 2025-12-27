from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import SessionLocal
from app.models.session import PomodoroSession, SessionEndType
from app.models.task import Task, TaskStatus
from app.schemas import session as schemas
from app.dependencies.auth import get_current_user # Auth Dependency

router = APIRouter(prefix="/sessions", tags=["Pomodoro Sessions"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 1. START SESSION ---
@router.post("/start", response_model=schemas.SessionResponse, status_code=status.HTTP_201_CREATED)
def start_session(
    payload: schemas.SessionCreate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # 1. Verify Task
    task = db.query(Task).filter(
        Task.id == payload.task_id,
        Task.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # 2. Sticky Logic: Mark Task as IN_PROGRESS immediately
    task.status = TaskStatus.IN_PROGRESS
    
    # 3. Create Session Log
    new_session = PomodoroSession(
        task_id=payload.task_id,
        user_id=current_user.id,
        start_time=datetime.utcnow(),
        is_completed=False
    )
    
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

# --- 2. END SESSION (The Logic Engine) ---
@router.post("/{session_id}/end", response_model=schemas.SessionResponse)
def end_session(
    session_id: int, 
    payload: schemas.SessionEnd, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # 1. Find Session
    session = db.query(PomodoroSession).filter(
        PomodoroSession.id == session_id,
        PomodoroSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.end_time:
        raise HTTPException(status_code=400, detail="Session already ended")

    # 2. Calculate Duration
    end_time = datetime.utcnow()
    duration_seconds = (end_time - session.start_time).total_seconds()
    duration_minutes = round(duration_seconds / 60, 2)
    
    # 3. Update Session Data
    session.end_time = end_time
    session.duration_minutes = duration_minutes
    session.end_type = payload.end_type
    session.focus_rating = payload.focus_rating
    
    if payload.end_type == SessionEndType.COMPLETED:
        session.is_completed = True

    # 4. MOMENTUM LOGIC (Update Task State)
    task = session.task # Access via relationship

    if payload.end_type == SessionEndType.COMPLETED:
        # Success: Add to count
        task.sessions_count += 1
        # Task remains IN_PROGRESS until user explicitly clicks "Complete Task" on the form
    
    elif payload.end_type == SessionEndType.ABORTED:
        # Failure: The "Momentum Rule"
        if task.sessions_count == 0:
            # False Start -> Reset to PENDING
            task.status = TaskStatus.PENDING
        else:
            # Has History -> Keep IN_PROGRESS (Sticky)
            pass

    # Note: If end_type is STOPPED, we do nothing to the task (It stays IN_PROGRESS)

    db.commit()
    db.refresh(session)
    return session