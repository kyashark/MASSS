from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.profile import WeeklyRoutine, SlotPreference, Chronotype
from app.schemas.profile import (
    RoutineCreate,
    RoutineResponse,
    RoutineUpdate,
    PreferenceUpdate,
    PreferenceResponse,
)
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/profile", tags=["Student Profile"])


# --- ROUTINE MANAGEMENT ---
@router.get("/routine", response_model=List[RoutineResponse])
def get_routine(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return (
        db.query(WeeklyRoutine).filter(WeeklyRoutine.user_id == current_user.id).all()
    )


@router.post(
    "/routine",
    response_model=List[RoutineResponse],
    status_code=status.HTTP_201_CREATED,
)
def add_routine_event(
    payload: RoutineCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    created_events = []
    for day in payload.days:
        new_event = WeeklyRoutine(
            user_id=current_user.id,
            name=payload.name,
            activity_type=payload.activity_type,
            day_of_week=day,
            start_time=payload.start_time,
            end_time=payload.end_time,
        )
        db.add(new_event)
        created_events.append(new_event)
    db.commit()
    for event in created_events:
        db.refresh(event)
    return created_events


@router.delete("/routine/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_routine_event(
    event_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    event = (
        db.query(WeeklyRoutine)
        .filter(WeeklyRoutine.id == event_id, WeeklyRoutine.user_id == current_user.id)
        .first()
    )
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()


@router.put("/routine/{event_id}", response_model=RoutineResponse)
def update_routine_event(
    event_id: int,
    payload: RoutineUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    event = (
        db.query(WeeklyRoutine)
        .filter(WeeklyRoutine.id == event_id, WeeklyRoutine.user_id == current_user.id)
        .first()
    )
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if payload.name:
        event.name = payload.name
    if payload.activity_type:
        event.activity_type = payload.activity_type
    if payload.start_time:
        event.start_time = payload.start_time
    if payload.end_time:
        event.end_time = payload.end_time
    db.commit()
    db.refresh(event)
    return event


# --- PREFERENCE MANAGEMENT ---
@router.get("/preferences", response_model=List[PreferenceResponse])
def get_preferences(
    db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    return (
        db.query(SlotPreference).filter(SlotPreference.user_id == current_user.id).all()
    )


@router.post("/preferences", response_model=PreferenceResponse)
def set_slot_preference(
    payload: PreferenceUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    pref = (
        db.query(SlotPreference)
        .filter(
            SlotPreference.user_id == current_user.id,
            SlotPreference.slot_name == payload.slot_name,
        )
        .first()
    )
    if pref:
        pref.max_pomodoros = payload.max_pomodoros
        pref.is_preferred = payload.is_preferred
    else:
        pref = SlotPreference(
            user_id=current_user.id,
            slot_name=payload.slot_name,
            max_pomodoros=payload.max_pomodoros,
            is_preferred=payload.is_preferred,
        )
        db.add(pref)
    db.commit()
    db.refresh(pref)
    return pref


@router.post("/initialize", status_code=status.HTTP_201_CREATED)
def initialize_student_profile(
    chronotype: Chronotype,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    defaults = {
        Chronotype.MORNING_BIRD: {"morning": 6, "afternoon": 4, "evening": 2},
        Chronotype.NIGHT_OWL: {"morning": 2, "afternoon": 4, "evening": 6},
        Chronotype.BALANCED: {"morning": 4, "afternoon": 4, "evening": 4},
    }
    selected = defaults.get(chronotype)
    for slot, val in selected.items():
        pref = SlotPreference(
            user_id=current_user.id,
            slot_name=slot,
            max_pomodoros=val,
            inferred_energy_score=0.5,
        )
        db.add(pref)
    db.commit()
    return {"message": f"Profile initialized as {chronotype.value}"}
