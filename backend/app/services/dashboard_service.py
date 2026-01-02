# app/services/dashboard_service.py

from datetime import datetime, timedelta
from sqlalchemy import func, extract
from sqlalchemy.orm import Session
from app.models.session import PomodoroSession, SessionEndType

class DashboardService:
    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id

    def get_pulse(self):
        """
        Calculates visuals for the React Dashboard (Bento Cards).
        """
        now = datetime.now()
        
        # --- 1. ENERGY BATTERY ---
        # Determine period
        current_hour = now.hour
        if 5 <= current_hour < 12:
            period = "Morning"
            start_h, end_h = 5, 12
        elif 12 <= current_hour < 17:
            period = "Afternoon"
            start_h, end_h = 12, 17
        else:
            period = "Evening"
            start_h, end_h = 17, 24

        # Calculate Battery % based on history
        thirty_days_ago = now - timedelta(days=30)
        avg_focus = self.db.query(func.avg(PomodoroSession.focus_rating))\
            .filter(
                PomodoroSession.user_id == self.user_id,
                PomodoroSession.start_time >= thirty_days_ago,
                extract('hour', PomodoroSession.start_time) >= start_h,
                extract('hour', PomodoroSession.start_time) < end_h
            ).scalar()

        # Default to 60% (3.0) if no data
        if avg_focus is None: avg_focus = 3.0
        battery_level = int((float(avg_focus) / 5.0) * 100)

        # --- 2. FATIGUE / STRESS ---
        # Analyze last 5 sessions
        recent_sessions = self.db.query(PomodoroSession)\
            .filter(PomodoroSession.user_id == self.user_id)\
            .order_by(PomodoroSession.start_time.desc())\
            .limit(5).all()

        status = "NORMAL"
        recent_avg = 0.0

        if recent_sessions:
            ratings = [s.focus_rating for s in recent_sessions if s.focus_rating]
            # Count quits (SessionEndType != COMPLETED or is_completed is False)
            quit_count = sum(1 for s in recent_sessions if s.end_type != SessionEndType.COMPLETED)
            recent_avg = sum(ratings) / len(ratings) if ratings else 0

            # Status Rules
            if quit_count >= 2:
                status = "STRESSED"
            elif recent_avg < 2.5:
                status = "TIRED"
            elif recent_avg >= 4.0 and quit_count == 0:
                status = "FRESH"
        else:
            status = "FRESH"

        return {
            "period": period,
            "battery_level": battery_level,
            "status": status,
            "recent_avg_focus": round(recent_avg, 1)
        }