from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
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


# ── Schemas ────────────────────────────────────────────────────────────────────


class RoutineEventRequest(BaseModel):
    name: str
    activity_type: str
    days: List[str]
    start_time: str
    end_time: str


class SlotConfigRequest(BaseModel):
    """One of the user's 3 custom study slots."""

    slot_name: str  # "morning" | "afternoon" | "evening"
    slot_label: str  # user's display name e.g. "Deep Work"
    start_time: str  # "HH:MM"
    end_time: str  # "HH:MM"
    max_pomodoros: int

    @field_validator("slot_name")
    @classmethod
    def validate_slot_name(cls, v):
        if v not in {"morning", "afternoon", "evening"}:
            raise ValueError("slot_name must be morning, afternoon, or evening")
        return v


class CompleteOnboardingRequest(BaseModel):
    chronotype: str
    routine_events: List[RoutineEventRequest] = []
    slots: List[SlotConfigRequest]  # exactly 3 items


# ── Chronotype defaults ────────────────────────────────────────────────────────
# Used to pre-populate the slot configurator in the frontend.
# Also used as fallback when skip_onboarding is called.

CHRONOTYPE_SLOT_DEFAULTS = {
    "morning_bird": [
        {
            "slot_name": "morning",
            "slot_label": "Morning Focus",
            "start_time": "07:00",
            "end_time": "12:00",
            "max_pomodoros": 6,
        },
        {
            "slot_name": "afternoon",
            "slot_label": "Afternoon",
            "start_time": "13:00",
            "end_time": "17:00",
            "max_pomodoros": 3,
        },
        {
            "slot_name": "evening",
            "slot_label": "Wind Down",
            "start_time": "18:00",
            "end_time": "21:00",
            "max_pomodoros": 1,
        },
    ],
    "night_owl": [
        {
            "slot_name": "morning",
            "slot_label": "Morning",
            "start_time": "09:00",
            "end_time": "12:00",
            "max_pomodoros": 1,
        },
        {
            "slot_name": "afternoon",
            "slot_label": "Afternoon",
            "start_time": "13:00",
            "end_time": "17:00",
            "max_pomodoros": 3,
        },
        {
            "slot_name": "evening",
            "slot_label": "Night Grind",
            "start_time": "20:00",
            "end_time": "23:30",
            "max_pomodoros": 6,
        },
    ],
    "balanced": [
        {
            "slot_name": "morning",
            "slot_label": "Morning",
            "start_time": "08:00",
            "end_time": "12:00",
            "max_pomodoros": 4,
        },
        {
            "slot_name": "afternoon",
            "slot_label": "Afternoon",
            "start_time": "13:00",
            "end_time": "17:00",
            "max_pomodoros": 4,
        },
        {
            "slot_name": "evening",
            "slot_label": "Evening",
            "start_time": "19:00",
            "end_time": "22:00",
            "max_pomodoros": 4,
        },
    ],
}

ENERGY_DEFAULTS = {
    "morning_bird": {"morning": 0.85, "afternoon": 0.55, "evening": 0.30},
    "night_owl": {"morning": 0.30, "afternoon": 0.55, "evening": 0.85},
    "balanced": {"morning": 0.60, "afternoon": 0.60, "evening": 0.60},
}


def _parse_time(time_str: str) -> time:
    h, m = map(int, time_str.split(":"))
    # Handle "24:00" edge case
    if h == 24:
        h = 23
        m = 59
    return time(h, m)


def _save_slots(user_id: int, slots: list, chronotype: str, db: Session):
    """Shared logic for saving slot preferences."""
    db.query(SlotPreference).filter(SlotPreference.user_id == user_id).delete()

    energy_map = ENERGY_DEFAULTS.get(chronotype, ENERGY_DEFAULTS["balanced"])

    for slot in slots:
        slot_name = slot["slot_name"] if isinstance(slot, dict) else slot.slot_name
        slot_label = slot["slot_label"] if isinstance(slot, dict) else slot.slot_label
        start_str = slot["start_time"] if isinstance(slot, dict) else slot.start_time
        end_str = slot["end_time"] if isinstance(slot, dict) else slot.end_time
        max_pomo = (
            slot["max_pomodoros"] if isinstance(slot, dict) else slot.max_pomodoros
        )

        energy = energy_map.get(slot_name, 0.60)

        pref = SlotPreference(
            user_id=user_id,
            slot_name=slot_name,
            slot_label=slot_label,
            start_time=_parse_time(start_str),
            end_time=_parse_time(end_str),
            max_pomodoros=max_pomo,
            is_preferred=energy >= 0.75,
            inferred_energy_score=energy,
        )
        db.add(pref)


# ── Endpoints ──────────────────────────────────────────────────────────────────


@router.get("/status")
def get_onboarding_status(current_user: User = Depends(get_current_user)):
    return {
        "onboarding_completed": current_user.onboarding_completed,
        "user_id": current_user.id,
        "username": current_user.username,
    }


@router.get("/slot-defaults/{chronotype}")
def get_slot_defaults(chronotype: str):
    """
    Returns default slot configuration for a chronotype.
    Frontend calls this when the user picks a chronotype in Step 1
    to pre-populate the slot configurator in Step 3.
    """
    if chronotype not in CHRONOTYPE_SLOT_DEFAULTS:
        raise HTTPException(status_code=400, detail=f"Unknown chronotype: {chronotype}")
    return {
        "chronotype": chronotype,
        "slots": CHRONOTYPE_SLOT_DEFAULTS[chronotype],
    }


@router.post("/complete")
def complete_onboarding(
    payload: CompleteOnboardingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate exactly 3 slots covering all 3 slot names
    slot_names_provided = {s.slot_name for s in payload.slots}
    required = {"morning", "afternoon", "evening"}
    if slot_names_provided != required:
        raise HTTPException(
            status_code=422,
            detail=f"Must provide exactly one slot for each of: morning, afternoon, evening",
        )

    # ── Step 1: Save custom slot preferences ──
    _save_slots(current_user.id, payload.slots, payload.chronotype, db)

    # ── Step 2: Create weekly routine events ──
    db.query(WeeklyRoutine).filter(WeeklyRoutine.user_id == current_user.id).delete()

    for event in payload.routine_events:
        try:
            activity = ActivityType(event.activity_type)
        except ValueError:
            raise HTTPException(
                status_code=422, detail=f"Invalid activity_type: {event.activity_type}"
            )

        try:
            start_h, start_m = map(int, event.start_time.split(":"))
            end_h, end_m = map(int, event.end_time.split(":"))
            start = time(start_h, start_m)
            end = time(end_h, end_m)
        except ValueError:
            raise HTTPException(
                status_code=422, detail="Invalid time format. Use HH:MM"
            )

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

    # ── Step 3: Mark onboarding complete ──
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
    # Use balanced defaults when skipping
    _save_slots(
        current_user.id,
        CHRONOTYPE_SLOT_DEFAULTS["balanced"],
        "balanced",
        db,
    )
    current_user.onboarding_completed = True
    db.add(current_user)
    db.commit()
    return {"message": "Onboarding skipped", "onboarding_completed": True}
