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
        Runs RL prediction and integrates real-time Work Intensity.
        """
        # 1. Fetch Fresh Context (Includes Intensity & Decay logic)
        analytics = UserAnalyticsService(self.db, user_id)
        user_context = analytics.build_rl_context()
        tasks = self._fetch_tasks(user_id)

        # 2. Run RL Prediction
        # Initialize map with Metadata for the Frontend
        rl_schedule_map = {
            "strategy_used": "Reinforcement Learning",
            "work_intensity": user_context.get("work_intensity", 0.0),  # <--- NEW
            "Morning": [],
            "Afternoon": [],
            "Evening": [],
        }

        if rl_brain.model_loaded:
            # Predictor now uses the 555-dimension state
            flat_schedule = rl_brain.predict(user_context, tasks)
            if flat_schedule:
                rl_schedule_map = self._convert_rl_to_schema(
                    flat_schedule, tasks, user_context
                )

        # 3. --- STICKY RULE LOGIC ---
        scheduled_task_ids = set()
        valid_slots = ["Morning", "Afternoon", "Evening"]

        for slot in valid_slots:
            if slot in rl_schedule_map:
                for t in rl_schedule_map[slot]:
                    scheduled_task_ids.add(t["task_id"])

        for task in tasks:
            if (
                task.status == TaskStatus.IN_PROGRESS
                and task.id not in scheduled_task_ids
            ):
                sticky_task = {
                    "task_id": task.id,
                    "task_name": task.name,
                    "module": task.module.name if task.module else "General",
                    "assigned_sessions": 1,
                    "priority": str(
                        task.priority.name
                        if hasattr(task.priority, "name")
                        else task.priority
                    ),
                    "status": "IN_PROGRESS",
                    "allocation_type": "STICKY_RULE",
                }
                rl_schedule_map["Morning"].insert(0, sticky_task)

        return rl_schedule_map

    def _convert_rl_to_schema(self, flat_schedule, all_tasks, user_context):
        """Adapter: Includes Intensity Metadata in the result"""
        result = {
            "strategy_used": "Reinforcement Learning",
            "work_intensity": user_context.get("work_intensity", 0.0),  # <--- NEW
            "Morning": [],
            "Afternoon": [],
            "Evening": [],
        }
        task_map = {t.id: t for t in all_tasks}

        for item in flat_schedule:
            task = task_map.get(item["task_id"])
            if not task:
                continue

            slot = item["slot"]
            formatted_task = {
                "task_id": task.id,
                "task_name": task.name,
                "module": task.module.name if task.module else "General",
                "assigned_sessions": 1,
                "priority": task.priority.name
                if hasattr(task.priority, "name")
                else str(task.priority),
                "status": task.status.name
                if hasattr(task.status, "name")
                else str(task.status),
                "allocation_type": "RL_DECISION",
                "intensity_context": item.get("intensity_context", 0.0),  # <--- NEW
            }

            if slot in result and isinstance(result[slot], list):
                result[slot].append(formatted_task)

        return result

    def _fetch_tasks(self, user_id):
        # (Keep your deterministic sorting logic, it is critical for RL stability)
        tasks = (
            self.db.query(Task)
            .filter(
                Task.user_id == user_id,
                Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]),
            )
            .order_by(Task.priority.desc(), Task.id.asc())
            .all()
        )
        return tasks
