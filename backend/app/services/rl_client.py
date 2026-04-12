"""
rl_client.py
------------
HTTP client that communicates with the standalone RL Scheduler Service.

This replaces all direct imports from app.rl_engine.
The main backend no longer runs any RL logic internally.
It fetches data, sends it to the RL service, and returns the result.
"""

import httpx
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.task import Task, TaskStatus
from app.models.session import PomodoroSession
from app.models.profile import SlotPreference, WeeklyRoutine
from app.models.module import Module

# Timeout for RL service calls in seconds
# RL prediction can take a moment if the model is large
RL_TIMEOUT = 30.0

# Standard headers sent with every request to the RL service
RL_HEADERS = {
    "Content-Type": "application/json",
    "X-Service-Key": settings.RL_SERVICE_KEY,
}


# ─── Data Fetchers ────────────────────────────────────────────────────────────
def _fetch_tasks(user_id: int, db: Session) -> list:
    from sqlalchemy.orm import joinedload

    tasks = (
        db.query(Task)
        .options(joinedload(Task.exam), joinedload(Task.module))
        .filter(
            Task.user_id == user_id,
            Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]),
        )
        .all()
    )

    result = []
    for task in tasks:
        days_until = None
        if task.deadline:
            days_until = (task.deadline - datetime.now()).days
        elif task.exam and task.exam.due_date:
            due = task.exam.due_date
            if hasattr(due, "hour"):
                days_until = (due - datetime.now()).days
            else:
                due_dt = datetime.combine(due, datetime.min.time())
                days_until = (due_dt - datetime.now()).days

        # Category — enum value is now lowercase with underscores
        category = "other"
        if task.module and task.module.category:
            cat = task.module.category
            category = cat.value if hasattr(cat, "value") else str(cat)

        # Priority and status — enum values now already lowercase
        priority = (
            task.priority.value
            if hasattr(task.priority, "value")
            else str(task.priority)
        )
        status = (
            task.status.value if hasattr(task.status, "value") else str(task.status)
        )

        result.append(
            {
                "id": task.id,
                "name": task.name,
                "priority": priority,  # "high", "medium", "low"
                "difficulty": task.difficulty or 3,
                "category": category,  # "coding", "math_logic", etc.
                "estimated_pomodoros": task.estimated_pomodoros or 1,
                "sessions_count": task.sessions_count or 0,
                "days_until": days_until,
                "status": status,  # "pending", "in_progress"
            }
        )

    return result


def _fetch_session_history(user_id: int, db: Session) -> list:
    cutoff = datetime.now() - timedelta(days=14)
    sessions = (
        db.query(PomodoroSession)
        .filter(
            PomodoroSession.user_id == user_id,
            PomodoroSession.start_time >= cutoff,
        )
        .order_by(PomodoroSession.start_time.desc())
        .limit(50)
        .all()
    )

    result = []
    for s in sessions:
        # Enum values now already lowercase
        end_type = (
            s.end_type.value
            if hasattr(s.end_type, "value")
            else str(s.end_type or "aborted")
        ).lower()

        slot_type = (s.slot_type or "morning").lower()

        result.append(
            {
                "focus_rating": float(s.focus_rating) if s.focus_rating else None,
                "end_type": end_type,  # "completed", "stopped", etc.
                "slot_type": slot_type,  # "morning", "afternoon", "evening"
                "duration_minutes": float(s.duration_minutes or 0),
                "started_at": s.start_time.isoformat() if s.start_time else "",
            }
        )

    return result


def _fetch_slot_preferences(user_id: int, db: Session) -> list:
    prefs = db.query(SlotPreference).filter(SlotPreference.user_id == user_id).all()

    if not prefs:
        return [
            {"slot_name": "morning", "max_pomodoros": 4},
            {"slot_name": "afternoon", "max_pomodoros": 4},
            {"slot_name": "evening", "max_pomodoros": 4},
        ]

    result = []
    for p in prefs:
        slot_name = (
            p.slot_name.value if hasattr(p.slot_name, "value") else str(p.slot_name)
        )
        result.append({"slot_name": slot_name, "max_pomodoros": p.max_pomodoros or 4})

    return result


def _fetch_weekly_routine(user_id: int, db: Session) -> list:
    events = db.query(WeeklyRoutine).filter(WeeklyRoutine.user_id == user_id).all()

    result = []
    for e in events:
        activity_type = (
            e.activity_type.value
            if hasattr(e.activity_type, "value")
            else str(e.activity_type)
        )
        day_of_week = (
            e.day_of_week.value
            if hasattr(e.day_of_week, "value")
            else str(e.day_of_week)
        )

        result.append(
            {
                "name": e.name,
                "activity_type": activity_type,  # "class", "sleep", "habit", "work"
                "day_of_week": day_of_week,  # "monday", "tuesday", etc.
                "start_time": e.start_time.strftime("%H:%M")
                if e.start_time
                else "00:00",
                "end_time": e.end_time.strftime("%H:%M") if e.end_time else "00:00",
            }
        )

    return result


def _build_request_body(
    user_id: int,
    db: Session,
    active_slot: str = "morning",
    include_tasks: bool = True,
) -> dict:
    """
    Builds the full request body for any RL service endpoint.
    Fetches all required data from the database in one place.
    """
    body = {
        "user_id": user_id,
        "active_slot": active_slot,
        "session_history": _fetch_session_history(user_id, db),
        "slot_preferences": _fetch_slot_preferences(user_id, db),
        "weekly_routine": _fetch_weekly_routine(user_id, db),
    }

    if include_tasks:
        body["tasks"] = _fetch_tasks(user_id, db)

    return body


# ─── Public Functions Called by Routers ──────────────────────────────────────


def get_rl_schedule(user_id: int, db: Session, active_slot: str = "morning") -> dict:
    """
    Call the RL service to generate a daily schedule.
    Returns the schedule dict or a fallback empty schedule on error.
    """
    body = _build_request_body(user_id, db, active_slot, include_tasks=True)

    try:
        with httpx.Client(timeout=RL_TIMEOUT) as client:
            response = client.post(
                f"{settings.RL_SERVICE_URL}/schedule",
                json=body,
                headers=RL_HEADERS,
            )
            response.raise_for_status()
            return response.json()

    except httpx.ConnectError:
        # RL service is not running
        return _fallback_schedule("RL service unavailable")

    except httpx.TimeoutException:
        # RL service took too long
        return _fallback_schedule("RL service timeout")

    except httpx.HTTPStatusError as e:
        # RL service returned an error (4xx or 5xx)
        return _fallback_schedule(f"RL service error: {e.response.status_code}")


def get_rl_state(user_id: int, db: Session, active_slot: str = "morning") -> dict:
    """
    Call the RL service for the state vector (dashboard cards).
    Returns state dict or empty dict on error.
    """
    body = _build_request_body(user_id, db, active_slot, include_tasks=False)

    try:
        with httpx.Client(timeout=RL_TIMEOUT) as client:
            response = client.post(
                f"{settings.RL_SERVICE_URL}/state",
                json=body,
                headers=RL_HEADERS,
            )
            response.raise_for_status()
            return response.json()

    except (httpx.ConnectError, httpx.TimeoutException, httpx.HTTPStatusError):
        return {}


def check_rl_health() -> dict:
    """
    Check if the RL service is running.
    Used by the main backend health endpoint.
    No authentication needed for this call.
    """
    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.get(f"{settings.RL_SERVICE_URL}/health")
            response.raise_for_status()
            return response.json()
    except Exception:
        return {"status": "unreachable", "model_loaded": False}


# ─── Fallback ─────────────────────────────────────────────────────────────────


def _fallback_schedule(reason: str) -> dict:
    """
    Returns an empty schedule with a clear reason.
    The frontend handles empty schedules gracefully.
    """
    return {
        "morning": [],
        "afternoon": [],
        "evening": [],
        "strategy_used": "unavailable",
        "work_intensity": 0.0,
        "error": reason,
    }
