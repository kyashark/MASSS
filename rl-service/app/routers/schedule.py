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

    print(
        "[rl.schedule] request",
        {
            "active_slot": request.active_slot,
            "tasks": len(tasks),
            "sessions": len(sessions),
            "preferences": len(preferences),
            "routine": len(routine),
            "model_loaded": rl_brain.model_loaded,
        },
    )

    analytics = UserAnalyticsService(
        session_history=sessions,
        slot_preferences=preferences,
        weekly_routine=routine,
        tasks=tasks,
    )
    context = analytics.build_rl_context()

    result = {
        "morning": [],
        "afternoon": [],
        "evening": [],
        "strategy_used": "heuristic_fallback",
        "work_intensity": context.get("work_intensity", 0.0),
    }

    if rl_brain.model_loaded:
        flat_schedule = rl_brain.predict(context, tasks)

        print("[rl.schedule] predicted", {"items": len(flat_schedule)})

        if flat_schedule:
            for item in flat_schedule:
                slot = item.get("slot", "morning")  # now lowercase from predictor
                if slot in result:
                    result[slot].append(
                        {
                            "task_id": item["task_id"],
                            "task_name": item["task_name"],
                            "slot": slot,
                            "allocation_type": "rl_decision",
                        }
                    )
            result["strategy_used"] = "rl_ppo"
        else:
            # ── HEURISTIC FALLBACK (RL returned empty) ──
            energy_map = context.get("energy_map", {})
            best_slot = max(energy_map, key=energy_map.get) if energy_map else "morning"

            priority_order = {"high": 0, "medium": 1, "low": 2}

            sorted_tasks = sorted(
                tasks,
                key=lambda t: (
                    priority_order.get(str(t.get("priority", "low")).lower(), 2),
                    t.get("days_until", 30) or 30,
                ),
            )

            capacity = context.get("capacity_map", {}).get(best_slot, 4)
            scheduled_count = 0

            for task in sorted_tasks:
                if scheduled_count >= capacity:
                    break

                result[best_slot].append(
                    {
                        "task_id": task["id"],
                        "task_name": task["name"],
                        "slot": best_slot,
                        "allocation_type": "priority_fallback",
                    }
                )
                scheduled_count += 1

            if result[best_slot]:
                result["strategy_used"] = "priority_fallback"

    # ── Sticky Rule ───────────────────────────────────────────────────────────
    # IN_PROGRESS tasks the model missed must always appear in the schedule.
    # The RL agent learned momentum (+5.0 reward) but with few tasks it often
    # picks invalid indices and misses them entirely.
    # Find the best energy slot to insert them.
    scheduled_ids = {
        item["task_id"]
        for slot_list in [result["morning"], result["afternoon"], result["evening"]]
        for item in slot_list
    }

    energy_map = context.get("energy_map", {})
    best_slot = max(energy_map, key=energy_map.get) if energy_map else "morning"

    for task in tasks:
        if task.get("status") == "in_progress" and task["id"] not in scheduled_ids:
            result[best_slot].insert(
                0,
                {
                    "task_id": task["id"],
                    "task_name": task["name"],
                    "slot": best_slot,
                    "allocation_type": "sticky_rule",
                },
            )
            if result["strategy_used"] in ("heuristic_fallback", "priority_fallback"):
                result["strategy_used"] = "rl_ppo"

    return result
