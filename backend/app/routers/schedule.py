from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.schemas.schedule import ScheduleResponse
from app.dependencies.auth import get_current_user

# Import BOTH services
from app.services.scheduling import SchedulingService as HeuristicService
from app.services.rl_scheduling import RLService

router = APIRouter(prefix="/schedule", tags=["AI Scheduler"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

# --- ENDPOINT 1: THE HEURISTIC (Baseline) ---
@router.get("/heuristic", response_model=ScheduleResponse)
def get_heuristic_schedule(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Forcefully runs the Greedy Heuristic Algorithm.
    """
    service = HeuristicService(db)
    # Note: Ensure your Heuristic generate_plan() returns a dict 
    # compatible with the Schema (Morning=[], Afternoon=[]).
    plan = service.get_today_schedule(user_id=current_user.id)
    
    # Tag it manually
    plan['strategy_used'] = "Heuristic (Baseline)"
    return plan

# --- ENDPOINT 2: THE RL AGENT (The Brain) ---
@router.get("/rl", response_model=ScheduleResponse)
def get_rl_schedule(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Forcefully runs the RL PPO Model.
    """
    service = RLService(db)
    plan = service.get_rl_only(user_id=current_user.id)
    return plan