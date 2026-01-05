from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

# Database & Auth (Matching task.py pattern)
from app.core.database import get_db 
from app.dependencies.auth import get_current_user

# Service
from app.services.dashboard_service import DashboardService

# Router Configuration
router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

# --- GET DASHBOARD STATS ---
@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Fetch dashboard statistics for the currently logged-in user.
    """
    # Use the isolated dashboard service with the authenticated User ID
    service = DashboardService(db, user_id=current_user.id)
    
    return service.get_pulse()