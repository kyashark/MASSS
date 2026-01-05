from sqlalchemy.orm import Session
from app.rl_engine.analytics import UserAnalyticsService
from app.rl_engine.predictor import RLScheduler
from app.models.task import Task, TaskStatus

# Global Brain (Loaded once)
rl_brain = RLScheduler()

class RLService:
    def __init__(self, db: Session):
        self.db = db

    def get_rl_only(self, user_id: int):
        """
        Runs RL prediction with a 'Sticky Rule' safety net.
        If the RL agent drops an IN_PROGRESS task, this service forces it back in.
        """
        # 1. Fetch Context & Tasks (Sorted stably)
        analytics = UserAnalyticsService(self.db, user_id)
        user_context = analytics.build_rl_context()
        tasks = self._fetch_tasks(user_id) 

        # 2. Run RL Prediction
        rl_schedule_map = {
            "strategy_used": "Reinforcement Learning",
            "Morning": [], 
            "Afternoon": [], 
            "Evening": []
        }
        
        if rl_brain.model_loaded:
            flat_schedule = rl_brain.predict(user_context, tasks)
            if flat_schedule:
                rl_schedule_map = self._convert_rl_to_schema(flat_schedule, tasks)

        # 3. --- STICKY RULE LOGIC ---
        # Collect IDs of tasks the AI actually scheduled
        scheduled_task_ids = set()
        valid_slots = ["Morning", "Afternoon", "Evening"]

        for slot in valid_slots:
            if slot in rl_schedule_map:
                for t in rl_schedule_map[slot]:
                    scheduled_task_ids.add(t['task_id'])

        # Check for IN_PROGRESS tasks that the AI missed/dropped
        for task in tasks:
            if task.status == TaskStatus.IN_PROGRESS and task.id not in scheduled_task_ids:
                print(f"🧲 Enforcing Sticky Rule for Task: {task.name}")
                
                # Create the formatted object
                sticky_task = {
                    "task_id": task.id,
                    "task_name": task.name,
                    "module": task.module.name if task.module else "General",
                    "assigned_sessions": 1,
                    "priority": str(task.priority.name if hasattr(task.priority, 'name') else task.priority),
                    "status": "IN_PROGRESS",
                    "allocation_type": "STICKY_RULE" # Frontend can use this to show a 'pinned' icon
                }
                
                # Force inject into Morning (or the first available slot)
                # You could add logic here to check if Morning is full, but usually, 
                # active work should go to the top of the day.
                rl_schedule_map["Morning"].insert(0, sticky_task) 

        return rl_schedule_map

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
            
            # Only append if the slot is valid (ignores invalid slot predictions)
            if slot in result and isinstance(result[slot], list):
                 result[slot].append(formatted_task)
                
        return result

    def _fetch_tasks(self, user_id):
        """
        Fetches tasks with deterministic sorting.
        Sorting by ID ensures that updating a task's status doesn't shuffle 
        the list order passed to the RL agent.
        """
        tasks = self.db.query(Task).filter(
            Task.user_id == user_id, 
            Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS])
        ).order_by(
            Task.priority.desc(), 
            Task.id.asc() # <--- CRITICAL: Keeps index stable for RL
        ).all()
        
        return tasks