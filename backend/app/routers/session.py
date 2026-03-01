from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import SessionLocal

# --- IMPORT get_sl_time HERE ---
from app.models.session import PomodoroSession, SessionEndType, get_sl_time
from app.models.task import Task, TaskStatus
from app.schemas import session as schemas
from app.dependencies.auth import get_current_user  # Auth Dependency

router = APIRouter(prefix="/sessions", tags=["Pomodoro Sessions"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- 1. START SESSION ---
@router.post(
    "/start",
    response_model=schemas.SessionResponse,
    status_code=status.HTTP_201_CREATED,
)
def start_session(
    payload: schemas.SessionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # 1. Verify Task
    task = (
        db.query(Task)
        .filter(Task.id == payload.task_id, Task.user_id == current_user.id)
        .first()
    )

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # 2. Sticky Logic: Mark Task as IN_PROGRESS immediately
    task.status = TaskStatus.IN_PROGRESS

    # 3. Create Session Log
    new_session = PomodoroSession(
        task_id=payload.task_id,
        user_id=current_user.id,
        # --- FIXED: Use SL Time explicitly ---
        start_time=get_sl_time(),
        is_completed=False,
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
    # Add an optional field to the schema for 'add_sessions'
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # 1. Find Session
    session = (
        db.query(PomodoroSession)
        .filter(
            PomodoroSession.id == session_id, PomodoroSession.user_id == current_user.id
        )
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.end_time:
        raise HTTPException(status_code=400, detail="Session already ended")

    # 2. Calculate Duration
    # --- FIXED: Get current SL time ---
    end_time = get_sl_time()

    # Calculate duration (SL Time - SL Time = Correct Duration)
    duration_seconds = (end_time - session.start_time).total_seconds()
    duration_minutes = round(duration_seconds / 60, 2)

    # 3. Update Session Data
    session.end_time = end_time
    session.duration_minutes = duration_minutes
    session.end_type = payload.end_type
    session.focus_rating = payload.focus_rating

    if payload.end_type == SessionEndType.COMPLETED:
        session.is_completed = True

    # --- 4. MOMENTUM & TASK UPDATE (Combined) ---
    task = session.task

    # A. Handle Session Completion (Success)
    if payload.end_type == SessionEndType.COMPLETED:
        task.sessions_count += 1

        # NEW RESEARCH ADDITION: If user says "I need 2 more sessions for this"
        if hasattr(payload, "extra_sessions") and payload.extra_sessions:
            task.estimated_pomodoros += payload.extra_sessions

    # B. Handle Failure (The Momentum Rule)
    elif payload.end_type == SessionEndType.ABORTED:
        if task.sessions_count == 0:
            # If it was their first try and they quit, reset to PENDING
            task.status = TaskStatus.PENDING
        else:
            # If they worked on it before, keep it IN_PROGRESS (Sticky)
            pass

    # Note: If STOPPED, task remains IN_PROGRESS automatically.

    # --- 5. DATA SYNC ---
    db.commit()
    db.refresh(session)
    return session


# --- 3. GET RECENT SESSIONS ---
@router.get("/", response_model=List[schemas.SessionResponse])
def get_recent_sessions(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    sessions = (
        db.query(PomodoroSession)
        .filter(PomodoroSession.user_id == current_user.id)
        .order_by(PomodoroSession.start_time.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return sessions
