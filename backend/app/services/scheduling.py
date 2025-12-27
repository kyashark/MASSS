from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import List, Dict, Any

from app.models.task import Task, TaskStatus
from app.services.heuristic import HeuristicScheduler

class SchedulingService:
    def __init__(self, db: Session):
        self.db = db

    def generate_forecast(self, user_id: int, days: int = 3):
        """
        Generates a schedule for Today + Next N Days.
        """
        scheduler = HeuristicScheduler(self.db, user_id)
        
        # 1. Fetch Data ONCE (Convert SQL Alchemy to Mutable Dicts)
        # We need mutable dicts to simulate "Work Done" without saving to DB.
        raw_tasks = self.db.query(Task).filter(
            Task.user_id == user_id,
            Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS])
        ).all()

        # Convert to a simulation-friendly list
        simulation_tasks = []
        for t in raw_tasks:
            remaining = t.estimated_pomodoros - t.sessions_count
            if remaining <= 0: remaining = 1 # Fallback
            
            simulation_tasks.append({
                "id": t.id,
                "name": t.name,
                "module_name": t.module.name if t.module else "General",
                "priority": t.priority,
                "status": t.status,
                "deadline": t.deadline,
                "remaining_pomodoros": remaining # This will decrease as we loop
            })

        # 2. The Simulation Loop
        forecast = []
        today = date.today()

        for i in range(days):
            current_date = today + timedelta(days=i)
            
            # Run the heuristic for this specific day
            daily_plan = scheduler.plan_one_day(current_date, simulation_tasks)
            
            forecast.append({
                "date": current_date,
                "day_name": current_date.strftime("%A"),
                "slots": daily_plan
            })

        return {"forecast": forecast}