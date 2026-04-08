from fastapi import APIRouter, Depends
from app.schemas.inputs import ScheduleRequest
from app.schemas.outputs import ScheduleResponse
from app.core.security import verify_service_key
from app.engine.analytics import UserAnalyticsService
from app.engine.predictor import RLScheduler

router = APIRouter()

# Load model once when service starts — not on every request
rl_brain = RLScheduler()


@router.post(
    "/schedule",
    response_model=ScheduleResponse,
    dependencies=[Depends(verify_service_key)],
)
def generate_schedule(request: ScheduleRequest):
    """
    Generate a daily schedule for a student.
    Receives all context data from the caller.
    Falls back to empty schedule if model not loaded.
    """
    # Convert Pydantic models to plain dicts for the engine
    tasks = [t.model_dump() for t in request.tasks]
    sessions = [s.model_dump() for s in request.session_history]
    preferences = [p.model_dump() for p in request.slot_preferences]
    routine = [r.model_dump() for r in request.weekly_routine]

    analytics = UserAnalyticsService(
        session_history=sessions,
        slot_preferences=preferences,
        weekly_routine=routine,
        tasks=tasks,
    )
    context = analytics.build_rl_context()

    result = {
        "Morning": [],
        "Afternoon": [],
        "Evening": [],
        "strategy_used": "HEURISTIC_FALLBACK",
        "work_intensity": context.get("work_intensity", 0.0),
    }

    if rl_brain.model_loaded:
        flat_schedule = rl_brain.predict(context, tasks)
        if flat_schedule:
            for item in flat_schedule:
                slot = item.get("slot", "Morning")
                if slot in result:
                    result[slot].append(
                        {
                            "task_id": item["task_id"],
                            "task_name": item["task_name"],
                            "slot": slot,
                            "allocation_type": "RL_DECISION",
                        }
                    )
            result["strategy_used"] = "RL_PPO"

    return result
