from sqlalchemy.orm import Session
from app.rl_engine.analytics import UserAnalyticsService
from app.rl_engine.predictor import RLScheduler
from app.models.task import Task, TaskStatus
from datetime import datetime

# Global Brain
rl_brain = RLScheduler()

class RLService:
    def __init__(self, db: Session):
        self.db = db

    def get_rl_only(self, user_id: int):
        """
        Strictly runs RL. No fallback.
        """
        # 1. Fetch Context & Tasks
        analytics = UserAnalyticsService(self.db, user_id)
        user_context = analytics.build_rl_context()
        tasks = self._fetch_tasks(user_id) 

        # 2. Run RL
        if rl_brain.model_loaded:
            flat_schedule = rl_brain.predict(user_context, tasks)
            if flat_schedule:
                return self._convert_rl_to_schema(flat_schedule, tasks)
        
        # 3. Return Empty if failed (so you can see it failed)
        return {
            "strategy_used": "RL (Failed/Empty)",
            "Morning": [], "Afternoon": [], "Evening": []
        }

    def _convert_rl_to_schema(self, flat_schedule, all_tasks):
        """Adapter: Flat List -> Nested Dict"""
        result = {
            "strategy_used": "Reinforcement Learning",
            "Morning": [], "Afternoon": [], "Evening": []
        }
        task_map = {t.id: t for t in all_tasks}

        for item in flat_schedule:
            task = task_map.get(item['task_id'])
            if not task: continue
            
            slot = item['slot']
            formatted_task = {
                "task_id": task.id,
                "task_name": task.name,
                "module": task.module.name if task.module else "General",
                "assigned_sessions": 1,
                "priority": task.priority.name if hasattr(task.priority, 'name') else str(task.priority),
                "status": task.status.name if hasattr(task.status, 'name') else str(task.status),
                "allocation_type": "RL_DECISION"
            }
            if slot in result: result[slot].append(formatted_task)
                
        return result

    def _fetch_tasks(self, user_id):
        # ... (Same helper as before to get tasks + calculate days_until) ...
        # Simplified for brevity:
        tasks = self.db.query(Task).filter(
            Task.user_id == user_id, 
            Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS])
        ).all()
        # Add quick days_until logic here or relies on Task model properties
        return tasks