from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.session import PomodoroSession, SessionEndType
from app.models.task import Task
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/dashboard-summary")
def get_dashboard_stats(
    db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    user_id = current_user.id
    today = datetime.now().date()

    # 1. Get Last 7 Sessions for the Heartbeat Chart
    recent_sessions = (
        db.query(PomodoroSession)
        .filter(PomodoroSession.user_id == user_id)
        .order_by(desc(PomodoroSession.start_time))
        .limit(7)
        .all()
    )

    # Reverse so the newest is on the right of the chart
    recent_ratings = [float(s.focus_rating or 3.0) for s in reversed(recent_sessions)]

    # 2. Get Last Task Name
    last_session = recent_sessions[0] if recent_sessions else None
    last_task_name = "No sessions yet"
    if last_session:
        task = db.query(Task).filter(Task.id == last_session.task_id).first()
        last_task_name = task.name if task else "Unknown Task"

    # 3. Calculate Daily Streak (Simple logic)
    # Checks how many consecutive days have at least one completed session
    streak = 0
    check_date = today
    while True:
        count = (
            db.query(PomodoroSession)
            .filter(
                PomodoroSession.user_id == user_id,
                func.date(PomodoroSession.start_time) == check_date,
                PomodoroSession.end_type == SessionEndType.COMPLETED,
            )
            .count()
        )

        if count > 0:
            streak += 1
            check_date -= timedelta(days=1)
        else:
            break

    # 4. Best Focus This Week
    start_of_week = datetime.now() - timedelta(days=7)
    best_focus = (
        db.query(func.max(PomodoroSession.focus_rating))
        .filter(
            PomodoroSession.user_id == user_id,
            PomodoroSession.start_time >= start_of_week,
        )
        .scalar()
        or 0.0
    )

    # 5. Sessions Today (for the Nudge)
    sessions_today = (
        db.query(PomodoroSession)
        .filter(
            PomodoroSession.user_id == user_id,
            func.date(PomodoroSession.start_time) == today,
        )
        .count()
    )

    return {
        "recent_ratings": recent_ratings,
        "last_task_name": last_task_name,
        "streak_days": streak,
        "best_focus_week": float(best_focus),
        "sessions_today": sessions_today,
        "recent_avg_focus": sum(recent_ratings) / len(recent_ratings)
        if recent_ratings
        else 0,
    }


@router.get("/health")
def get_system_health(current_user=Depends(get_current_user)):
    """
    Returns health status of the main backend and RL service.
    Useful for debugging and monitoring.
    """
    from app.services.rl_client import check_rl_health

    rl_status = check_rl_health()

    return {
        "main_api": "ok",
        "rl_service": rl_status.get("status", "unreachable"),
        "rl_model_loaded": rl_status.get("model_loaded", False),
    }
