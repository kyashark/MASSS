from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.models.session import PomodoroSession, SessionEndType, get_sl_time
from app.models.task import Task, TaskStatus
from app.schemas import session as schemas
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/sessions", tags=["Pomodoro Sessions"])


# -----------------------------
# Helper: Auto Slot Detection
# -----------------------------
def get_slot_name(current_time: datetime) -> str:
    hour = current_time.hour
    if 6 <= hour < 12:
        return "Morning"
    if 12 <= hour < 18:
        return "Afternoon"
    return "Evening"


# =====================================================
# 1️⃣ START SESSION
# =====================================================
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
    task = (
        db.query(Task)
        .filter(Task.id == payload.task_id, Task.user_id == current_user.id)
        .first()
    )

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.status == TaskStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Task already completed")

    now = get_sl_time()

    # Mark task as IN_PROGRESS so the RL momentum signal fires
    # and the heuristic sticky rule works correctly
    if task.status != TaskStatus.IN_PROGRESS:
        task.status = TaskStatus.IN_PROGRESS
        db.add(task)

    new_session = PomodoroSession(
        task_id=payload.task_id,
        user_id=current_user.id,
        start_time=now,
        slot_type=get_slot_name(now),
        is_completed=False,
    )

    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session


# =====================================================
# 2️⃣ END SESSION (Logic Engine)
# =====================================================
@router.post("/{session_id}/end", response_model=schemas.SessionResponse)
def end_session(
    session_id: int,
    payload: schemas.SessionEnd,
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
    end_time = get_sl_time()
    duration_seconds = max(0, (end_time - session.start_time).total_seconds())
    duration_minutes = round(duration_seconds / 60, 2)

    # 3. Update Session Data
    session.end_time = end_time
    session.duration_minutes = duration_minutes
    session.end_type = payload.end_type
    session.focus_rating = payload.focus_rating

    # 4. Task Logic (Momentum + Workload Update)
    task = session.task

    # ---- SUCCESS CASE (Timer Finished) ----
    if payload.end_type == SessionEndType.COMPLETED:
        session.is_completed = True
        task.sessions_count += 1

        # --- MAJOR UPDATE: AUTO-ADJUST ESTIMATE ---
        # If the student is continuing work (sessions_count > estimate),
        # we automatically increase the estimate so the task stays active.
        if task.sessions_count > task.estimated_pomodoros:
            task.estimated_pomodoros = task.sessions_count

        # Auto-complete task only if goal reached (or handled manually via separate status update)
        if task.sessions_count >= task.estimated_pomodoros:
            # You can decide if you want to auto-complete or wait for 'Task Done' button
            # To allow "Continue" to work, we keep it as IN_PROGRESS until a manual finish
            pass

    # ---- ABORTED CASE (Discarded) ----
    elif payload.end_type == SessionEndType.ABORTED:
        if task.sessions_count == 0:
            task.status = TaskStatus.PENDING

    # Note: If STOPPED, task remains IN_PROGRESS automatically.

    # --- 5. DATA SYNC ---
    db.commit()
    db.refresh(session)
    return session


# =====================================================
# 3️⃣ GET RECENT SESSIONS
# =====================================================
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
