from sqlalchemy.orm import Session, joinedload
from sqlalchemy import case
from app.rl_engine.analytics import (
    UserAnalyticsService,
    get_effective_days_until,
    get_effective_deadline,
)
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
        State space: 605 dimensions (50 tasks × 12 features + 5 env signals)
        """
        # 1. Fetch Fresh Context (Includes Intensity & Decay logic)
        analytics = UserAnalyticsService(self.db, user_id)
        user_context = analytics.build_rl_context()
        tasks = self._fetch_tasks(user_id)

        # 2. Run RL Prediction
        rl_schedule_map = {
            "strategy_used": "Reinforcement Learning",
            "work_intensity": user_context.get("work_intensity", 0.0),
            "Morning": [],
            "Afternoon": [],
            "Evening": [],
        }

        if rl_brain.model_loaded:
            flat_schedule = rl_brain.predict(user_context, tasks)
            if flat_schedule:
                rl_schedule_map = self._convert_rl_to_schema(
                    flat_schedule, tasks, user_context
                )

        # 3. STICKY RULE — IN_PROGRESS tasks the RL missed
        # FIXED: insert into highest-energy slot, not always Morning
        # If RL already scheduled it, skip it
        scheduled_task_ids = {
            t["task_id"]
            for slot in ["Morning", "Afternoon", "Evening"]
            for t in rl_schedule_map.get(slot, [])
        }

        # Find the best slot from energy_map for sticky tasks
        energy_map = user_context.get("energy_map", {})
        best_slot = max(energy_map, key=energy_map.get) if energy_map else "Morning"

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
                    "priority": (
                        task.priority.name
                        if hasattr(task.priority, "name")
                        else str(task.priority)
                    ),
                    "status": "IN_PROGRESS",
                    "allocation_type": "STICKY_RULE",
                    # Include deadline context so frontend knows urgency source
                    "deadline_source": self._deadline_source(task),
                    "days_until": get_effective_days_until(task),
                }
                rl_schedule_map[best_slot].insert(0, sticky_task)

        return rl_schedule_map

    def _convert_rl_to_schema(self, flat_schedule, all_tasks, user_context):
        """Converts flat predictor output to slot-grouped schema."""
        result = {
            "strategy_used": "Reinforcement Learning",
            "work_intensity": user_context.get("work_intensity", 0.0),
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
                "priority": (
                    task.priority.name
                    if hasattr(task.priority, "name")
                    else str(task.priority)
                ),
                "status": (
                    task.status.name
                    if hasattr(task.status, "name")
                    else str(task.status)
                ),
                "allocation_type": "RL_DECISION",
                "intensity_context": item.get("intensity_context", 0.0),
                "deadline_source": self._deadline_source(task),
                "days_until": get_effective_days_until(task),
            }

            if slot in result and isinstance(result[slot], list):
                result[slot].append(formatted_task)

        return result

    def _fetch_tasks(self, user_id):
        """
        FIXED: added joinedload(Task.exam) so get_effective_deadline()
        can access task.exam.due_date without lazy load issues.

        Without this, task.exam would be None even if the exam exists,
        because SQLAlchemy lazy loads relationships only within an active
        session context — which may not be available inside state_builder.
        """
        tasks = (
            self.db.query(Task)
            .options(
                joinedload(Task.exam),  # ← eager load exam deadline
                joinedload(Task.module),  # ← already needed for .module.name
            )
            .filter(
                Task.user_id == user_id,
                Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]),
            )
            .order_by(
                # Explicit priority ordering: HIGH first, MEDIUM, then LOW
                # Cannot use .desc() on string enum — sorts alphabetically:
                # "Medium" > "Low" > "High" → HIGH tasks would go LAST (wrong)
                case(
                    {"HIGH": 3, "MEDIUM": 2, "LOW": 1}, value=Task.priority, else_=0
                ).desc(),
                Task.id.asc(),
            )
            .all()
        )
        return tasks

    def _deadline_source(self, task) -> str | None:
        """
        Returns where the effective deadline comes from for this task.
        Uses get_effective_deadline() — same logic as state_builder and reward.
        """
        if getattr(task, "deadline", None):
            return "task"
        # get_effective_deadline checks exam.due_date as fallback
        deadline = get_effective_deadline(task)
        if deadline is not None:
            return "exam"
        return None
