# services/analytics.py
"""
Analytics service.

Queries the database and constructs the context required by the RL agent.
Acts as the bridge between persistence and the RL engine.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import datetime

# Import your models
from app.models.session import PomodoroSession, SessionEndType
from app.models.task import Task
from app.models.module import Module

class UserAnalyticsService:
    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id

    def build_rl_context(self):
        """
        Aggregates raw session rows into a clean dictionary for the RL Agent.
        """
        # 1. Get Average Focus per Time Slot (Morning, Afternoon, Evening)
        # We define slots based on hour: Morn < 12, Aft < 18, Eve >= 18
        time_stats = self.db.query(
            func.avg(
                case(
                    (func.extract('hour', PomodoroSession.start_time) < 12, PomodoroSession.focus_rating),
                    (func.extract('hour', PomodoroSession.start_time) < 18, PomodoroSession.focus_rating),
                    else_=PomodoroSession.focus_rating
                )
            ).label('avg_focus'),
            case(
                (func.extract('hour', PomodoroSession.start_time) < 12, 'Morning'),
                (func.extract('hour', PomodoroSession.start_time) < 18, 'Afternoon'),
                else_='Evening'
            ).label('slot')
        ).filter(
            PomodoroSession.user_id == self.user_id,
            PomodoroSession.focus_rating != None
        ).group_by('slot').all()

        # Convert to simple dict: {'Morning': 4.5, 'Afternoon': 3.2, ...}
        energy_map = {row.slot: float(row.avg_focus or 3.0) for row in time_stats}

        # 2. Get Fatigue History (Last 5 sessions)
        last_5_sessions = self.db.query(PomodoroSession.focus_rating)\
            .filter(PomodoroSession.user_id == self.user_id)\
            .order_by(PomodoroSession.start_time.desc())\
            .limit(5).all()
        
        recent_ratings = [s[0] for s in last_5_sessions if s[0] is not None]

        # 3. Get Category Affinity (Which subjects do they complete?)
        # High Completion Rate = High Affinity
        cat_stats = self.db.query(
            Module.category,
            func.count(PomodoroSession.id).label('total_attempts'),
            func.sum(case((PomodoroSession.end_type == SessionEndType.COMPLETED, 1), else_=0)).label('completes')
        ).join(Task, PomodoroSession.task_id == Task.id)\
         .join(Module, Task.module_id == Module.id)\
         .filter(PomodoroSession.user_id == self.user_id)\
         .group_by(Module.category).all()

        category_bias = {}
        for row in cat_stats:
            # Calculate Success Rate (0.0 to 1.0)
            success_rate = row.completes / max(1, row.total_attempts)
            category_bias[row.category] = success_rate

        return {
            "energy_map": energy_map,          # e.g., {'Morning': 4.2}
            "recent_ratings": recent_ratings,  # e.g., [5, 4, 2, 3, 5]
            "category_bias": category_bias     # e.g., {'Math': 0.8, 'Coding': 0.4}
        }