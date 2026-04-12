from fastapi import APIRouter, Depends
from app.schemas.inputs import StateRequest
from app.schemas.outputs import StateResponse
from app.core.security import verify_service_key
from app.engine.analytics import UserAnalyticsService
from datetime import datetime

router = APIRouter()

SLOT_HOURS = {
    "morning": (6, 12),  # ← lowercase
    "afternoon": (12, 18),
    "evening": (18, 24),
}


@router.post(
    "/state",
    response_model=StateResponse,
    dependencies=[Depends(verify_service_key)],
)
def get_state_vector(request: StateRequest):
    """Returns the human-readable RL state vector for the dashboard."""
    sessions = [s.model_dump() for s in request.session_history]
    preferences = [p.model_dump() for p in request.slot_preferences]
    routine = [r.model_dump() for r in request.weekly_routine]

    analytics = UserAnalyticsService(
        session_history=sessions,
        slot_preferences=preferences,
        weekly_routine=routine,
    )

    current_hour = datetime.now().hour
    live_slot = (
        "morning"
        if 6 <= current_hour < 12  # ← lowercase
        else "afternoon"
        if 12 <= current_hour < 18
        else "evening"
    )

    work_intensity = analytics._calculate_work_intensity()

    slot_fatigue = {
        slot: analytics._calculate_slot_cognitive_fatigue(slot, start, end)
        for slot, (start, end) in SLOT_HOURS.items()
    }

    raw_energy = {
        slot: analytics._calculate_slot_energy(slot, start, end, work_intensity)
        for slot, (start, end) in SLOT_HOURS.items()
    }

    def energy_label(score: float) -> str:
        return "HIGH" if score >= 0.65 else "MEDIUM" if score >= 0.40 else "LOW"

    energy_battery = {
        slot: {
            "score": round((raw - 1.0) / 4.0, 2),
            "label": energy_label((raw - 1.0) / 4.0),
        }
        for slot, raw in raw_energy.items()
    }

    history = analytics._get_recent_performance_history()
    trend = (
        "Positive"
        if len(history) >= 2 and history[0] >= history[1]
        else "Declining"
        if len(history) >= 2
        else "Neutral"
    )

    active_fatigue = slot_fatigue[request.active_slot]
    cognitive_label = (
        "FRESH"
        if active_fatigue < 0.40
        else "FATIGUING"
        if active_fatigue < 0.70
        else "BURNOUT RISK"
    )

    return {
        "cognitive_fatigue": active_fatigue,
        "cognitive_label": cognitive_label,
        "is_live_slot": request.active_slot == live_slot,
        "live_slot_name": live_slot,
        "slot_fatigue": {s: round(v, 2) for s, v in slot_fatigue.items()},
        "workload_intensity": round(work_intensity, 2),
        "focus_history": [round(f, 1) for f in list(reversed(history))],
        "energy_battery": energy_battery,
        "category_strengths": analytics._calculate_category_bias(),
        "trend": trend,
        "active_slot": request.active_slot,
        "post_class_fatigue": analytics._calculate_post_class_fatigue(),
        "class_event_name": analytics._get_most_recent_class_name(),
    }
