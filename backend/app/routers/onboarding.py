from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import time

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.model import User
from app.models.profile import (
    SlotPreference,
    WeeklyRoutine,
    ActivityType,
    DayOfWeek,
    SlotName,
    Chronotype,
)

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])


# ── Schemas ───────────────────────────────────────────────────────────────────


class ChronotypeRequest(BaseModel):
    chronotype: str  # MORNING_BIRD, NIGHT_OWL, BALANCED


class RoutineEventRequest(BaseModel):
    name: str
    activity_type: str
    days: List[str]  # list of day names e.g. ["Monday", "Wednesday"]
    start_time: str  # HH:MM
    end_time: str  # HH:MM


class CapacityRequest(BaseModel):
    morning: int
    afternoon: int
    evening: int


class CompleteOnboardingRequest(BaseModel):
    chronotype: str
    routine_events: List[RoutineEventRequest]
    capacity: CapacityRequest


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.get("/status")
def get_onboarding_status(
    current_user: User = Depends(get_current_user),
):
    """
    Returns whether the current user has completed onboarding.
    Frontend calls this after login to decide where to redirect.
    """
    return {
        "onboarding_completed": current_user.onboarding_completed,
        "user_id": current_user.id,
        "username": current_user.username,
    }


@router.post("/complete")
def complete_onboarding(
    payload: CompleteOnboardingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Saves all onboarding data in one request.
    Called when the user clicks Finish on the last step.

    What this does:
    1. Sets slot preferences based on chronotype + capacity input
    2. Creates weekly routine events
    3. Marks onboarding as completed on the user record
    """

    # ── Step 1: Set Slot Preferences ─────────────────────────────────────────

    # Delete any existing preferences for this user
    # Prevents duplicates if onboarding is run more than once
    db.query(SlotPreference).filter(SlotPreference.user_id == current_user.id).delete()

    # Map chronotype to default energy scores
    # These seed the RL inferred_energy_score before real data exists
    chronotype_energy = {
        "MORNING_BIRD": {"Morning": 0.85, "Afternoon": 0.55, "Evening": 0.30},
        "NIGHT_OWL": {"Morning": 0.30, "Afternoon": 0.55, "Evening": 0.85},
        "BALANCED": {"Morning": 0.60, "Afternoon": 0.60, "Evening": 0.60},
    }
    energy_defaults = chronotype_energy.get(
        payload.chronotype, chronotype_energy["BALANCED"]
    )

    slot_capacities = {
        "Morning": payload.capacity.morning,
        "Afternoon": payload.capacity.afternoon,
        "Evening": payload.capacity.evening,
    }

    for slot_name, capacity in slot_capacities.items():
        pref = SlotPreference(
            user_id=current_user.id,
            slot_name=slot_name,
            max_pomodoros=capacity,
            is_preferred=(energy_defaults.get(slot_name, 0.5) >= 0.75),
            inferred_energy_score=energy_defaults.get(slot_name, 0.5),
        )
        db.add(pref)

    # ── Step 2: Create Weekly Routine Events ──────────────────────────────────

    # Delete existing routine for this user
    db.query(WeeklyRoutine).filter(WeeklyRoutine.user_id == current_user.id).delete()

    for event in payload.routine_events:
        # Validate activity type
        try:
            activity = ActivityType(event.activity_type)
        except ValueError:
            raise HTTPException(
                status_code=422, detail=f"Invalid activity_type: {event.activity_type}"
            )

        # Parse times
        try:
            start_h, start_m = map(int, event.start_time.split(":"))
            end_h, end_m = map(int, event.end_time.split(":"))
            start = time(start_h, start_m)
            end = time(end_h, end_m)
        except ValueError:
            raise HTTPException(
                status_code=422, detail=f"Invalid time format. Use HH:MM"
            )

        # Create one WeeklyRoutine row per day
        for day_str in event.days:
            try:
                day = DayOfWeek(day_str)
            except ValueError:
                raise HTTPException(status_code=422, detail=f"Invalid day: {day_str}")

            routine = WeeklyRoutine(
                user_id=current_user.id,
                name=event.name,
                activity_type=activity,
                day_of_week=day,
                start_time=start,
                end_time=end,
            )
            db.add(routine)

    # ── Step 3: Mark Onboarding Complete ─────────────────────────────────────

    current_user.onboarding_completed = True
    db.add(current_user)

    db.commit()

    return {
        "message": "Onboarding completed successfully",
        "onboarding_completed": True,
    }


@router.post("/skip")
def skip_onboarding(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Marks onboarding as completed without saving any data.
    User goes straight to dashboard with default settings.
    """
    # Set balanced defaults so the user gets something reasonable
    db.query(SlotPreference).filter(SlotPreference.user_id == current_user.id).delete()

    for slot_name, energy in [
        ("Morning", 0.6),
        ("Afternoon", 0.6),
        ("Evening", 0.6),
    ]:
        pref = SlotPreference(
            user_id=current_user.id,
            slot_name=slot_name,
            max_pomodoros=4,
            is_preferred=False,
            inferred_energy_score=energy,
        )
        db.add(pref)

    current_user.onboarding_completed = True
    db.add(current_user)
    db.commit()

    return {"message": "Onboarding skipped", "onboarding_completed": True}
