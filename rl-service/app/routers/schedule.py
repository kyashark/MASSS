from fastapi import APIRouter, Depends
from app.schemas.inputs import ScheduleRequest
from app.schemas.outputs import ScheduleResponse
from app.core.security import verify_service_key
from app.engine.analytics import UserAnalyticsService
from app.engine.predictor import RLScheduler

router = APIRouter()

rl_brain = RLScheduler()


@router.post(
    "/schedule",
    response_model=ScheduleResponse,
    dependencies=[Depends(verify_service_key)],
)
def generate_schedule(request: ScheduleRequest):
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

    # ── Sticky Rule ───────────────────────────────────────────────────────────
    # IN_PROGRESS tasks the model missed must always appear in the schedule.
    # The RL agent learned momentum (+5.0 reward) but with few tasks it often
    # picks invalid indices and misses them entirely.
    # Find the best energy slot to insert them.
    scheduled_ids = {
        item["task_id"]
        for slot_list in [result["Morning"], result["Afternoon"], result["Evening"]]
        for item in slot_list
    }

    energy_map = context.get("energy_map", {})
    best_slot = (
        max(energy_map, key=energy_map.get) if energy_map else "morning"
    )  # ← lowercase

    for task in tasks:
        if (
            task.get("status") == "in_progress"  # ← lowercase
            and task["id"] not in scheduled_ids
        ):
            result[best_slot].insert(
                0,
                {
                    "task_id": task["id"],
                    "task_name": task["name"],
                    "slot": best_slot,
                    "allocation_type": "sticky_rule",  # ← lowercase
                },
            )
            # Mark strategy as RL_PPO since at least one task is scheduled
            if result["strategy_used"] == "HEURISTIC_FALLBACK":
                result["strategy_used"] = "RL_PPO"

    return result
