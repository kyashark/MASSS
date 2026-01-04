from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import SessionLocal
from app.models.profile import WeeklyRoutine, SlotPreference, SlotName
from app.schemas.profile import (
    RoutineCreate, RoutineResponse, 
    PreferenceUpdate, PreferenceResponse,RoutineUpdate 
)   
from app.dependencies.auth import get_current_user # Auth Dependency

router = APIRouter(prefix="/profile", tags=["Student Profile"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================
# 1. ROUTINE MANAGEMENT (Classes, Sleep)
# ==========================================

# GET Routine (My Weekly Schedule)
@router.get("/routine", response_model=List[RoutineResponse])
def get_routine(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return db.query(WeeklyRoutine).filter(
        WeeklyRoutine.user_id == current_user.id
    ).all()

# ADD Event (Add a Class)
# @router.post("/routine", response_model=RoutineResponse, status_code=status.HTTP_201_CREATED)
# def add_routine_event(
#     payload: RoutineCreate,
#     db: Session = Depends(get_db),
#     current_user = Depends(get_current_user)
# ):
#     # Logic: Check for direct overlaps could go here, 
#     # but for now we trust the user.
    
#     new_event = WeeklyRoutine(
#         user_id=current_user.id,
#         name=payload.name,
#         activity_type=payload.activity_type,
#         day_of_week=payload.day_of_week,
#         start_time=payload.start_time,
#         end_time=payload.end_time
#     )
    
#     db.add(new_event)
#     db.commit()
#     db.refresh(new_event)
#     return new_event
@router.post("/routine", response_model=List[RoutineResponse], status_code=status.HTTP_201_CREATED)
def add_routine_event(
    payload: RoutineCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    created_events = []

    # --- THE LOOP ---
    # Create one DB entry for every day selected in the list
    for day in payload.days:
        new_event = WeeklyRoutine(
            user_id=current_user.id,
            name=payload.name,
            activity_type=payload.activity_type,
            day_of_week=day, # Assign single day
            start_time=payload.start_time,
            end_time=payload.end_time
        )
        db.add(new_event)
        created_events.append(new_event)
    
    db.commit()
    
    # Refresh all to get IDs
    for event in created_events:
        db.refresh(event)
        
    return created_events



# DELETE Event (Remove a Class)
@router.delete("/routine/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_routine_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    event = db.query(WeeklyRoutine).filter(
        WeeklyRoutine.id == event_id,
        WeeklyRoutine.user_id == current_user.id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    db.delete(event)
    db.commit()


# ==========================================
# 2. PREFERENCE MANAGEMENT (Energy Buckets)
# ==========================================

# GET Preferences
@router.get("/preferences", response_model=List[PreferenceResponse])
def get_preferences(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # If user has no prefs set, we could return defaults here
    prefs = db.query(SlotPreference).filter(
        SlotPreference.user_id == current_user.id
    ).all()
    
    if not prefs:
        # Optional: Auto-create defaults if empty
        return []
        
    return prefs

# UPDATE/SET Preferences
@router.post("/preferences", response_model=PreferenceResponse)
def set_slot_preference(
    payload: PreferenceUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Upsert logic: If preference for 'Morning' exists, update it. 
    If not, create it.
    """
    pref = db.query(SlotPreference).filter(
        SlotPreference.user_id == current_user.id,
        SlotPreference.slot_name == payload.slot_name
    ).first()

    if pref:
        # Update existing
        pref.max_pomodoros = payload.max_pomodoros
        pref.is_preferred = payload.is_preferred
    else:
        # Create new
        pref = SlotPreference(
            user_id=current_user.id,
            slot_name=payload.slot_name,
            max_pomodoros=payload.max_pomodoros,
            is_preferred=payload.is_preferred
        )
        db.add(pref)

    db.commit()
    db.refresh(pref)
    return pref


# UPDATE Event (Edit Name, Time, or Type)
@router.put("/routine/{event_id}", response_model=RoutineResponse)
def update_routine_event(
    event_id: int,
    payload: RoutineUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    event = db.query(WeeklyRoutine).filter(
        WeeklyRoutine.id == event_id,
        WeeklyRoutine.user_id == current_user.id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    # Update fields if they are provided in the payload
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
