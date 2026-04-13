from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import List, Dict, Any

# Adjust imports to match your file structure perfectly
from app.models.task import Task, TaskStatus, PriorityLevel
from app.models.profile import WeeklyRoutine, SlotPreference, SlotName, ActivityType
from app.models.exam import Exam


class HeuristicScheduler:
    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id

        # 1. TIME AWARENESS
        # Server Time is assumed to be User Time for MVP.
        self.now = datetime.now()
        self.today = self.now.date()
        self.day_name = self.today.strftime("%A")

    def _get_daily_capacity(self) -> Dict[str, int]:
        prefs = (
            self.db.query(SlotPreference)
            .filter(SlotPreference.user_id == self.user_id)
            .all()
        )
        capacity_map = {SlotName.MORNING: 4, SlotName.AFTERNOON: 4, SlotName.EVENING: 4}
        for p in prefs:
            capacity_map[p.slot_name] = p.max_pomodoros

        current_hour = self.now.hour
        if current_hour >= 12:
            capacity_map[SlotName.MORNING] = 0
        if current_hour >= 18:
            capacity_map[SlotName.AFTERNOON] = 0

        today_name = self.today.strftime("%A").lower()  # ← lowercase
        routines = (
            self.db.query(WeeklyRoutine)
            .filter(
                WeeklyRoutine.user_id == self.user_id,
                WeeklyRoutine.day_of_week == today_name,
            )
            .all()
        )

        for r in routines:
            if r.activity_type in [ActivityType.CLASS, ActivityType.WORK]:
                start_dec = r.start_time.hour + (r.start_time.minute / 60)
                end_dec = r.end_time.hour + (r.end_time.minute / 60)
                duration = max(0, end_dec - start_dec)
                lost_pomos = int(duration * 2)
                midpoint = (start_dec + end_dec) / 2
                if 6 <= midpoint < 12:
                    capacity_map[SlotName.MORNING] = max(
                        0, capacity_map[SlotName.MORNING] - lost_pomos
                    )
                elif 12 <= midpoint < 18:
                    capacity_map[SlotName.AFTERNOON] = max(
                        0, capacity_map[SlotName.AFTERNOON] - lost_pomos
                    )
                else:
                    capacity_map[SlotName.EVENING] = max(
                        0, capacity_map[SlotName.EVENING] - lost_pomos
                    )

        return capacity_map

    def _calculate_score(self, task: Task) -> float:
        score = 0.0
        if task.status == TaskStatus.IN_PROGRESS:
            return 10000.0

        prio_map = {
            PriorityLevel.HIGH: 3,
            PriorityLevel.MEDIUM: 2,
            PriorityLevel.LOW: 1,
        }
        score += prio_map.get(task.priority, 1) * 2

        target_date = (
            task.exam.due_date if (task.exam and task.exam.due_date) else task.deadline
        )
        if target_date:
            d_date = (
                target_date.date() if isinstance(target_date, datetime) else target_date
            )
            days_until = (d_date - self.today).days
            score += 10 / max(0.1, days_until)
        else:
            score += 0.3

        if task.exam:
            score += (task.exam.weight or 1) * 0.5

        return score

    def generate_plan(self):
        capacity = self._get_daily_capacity()
        all_tasks = (
            self.db.query(Task)
            .filter(
                Task.user_id == self.user_id,
                Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]),
            )
            .all()
        )

        fixed_tasks = [t for t in all_tasks if t.is_fixed]
        floating_tasks = [t for t in all_tasks if not t.is_fixed]

        schedule = {SlotName.MORNING: [], SlotName.AFTERNOON: [], SlotName.EVENING: []}
        slot_order = [SlotName.MORNING, SlotName.AFTERNOON, SlotName.EVENING]

        for task in fixed_tasks:
            needed = max(1, task.estimated_pomodoros - task.sessions_count)
            for slot in slot_order:
                if needed <= 0:
                    break
                if capacity[slot] > 0:
                    take = min(needed, capacity[slot])
                    schedule[slot].append(self._format_task(task, take, "fixed"))
                    capacity[slot] -= take
                    needed -= take

        floating_tasks.sort(key=self._calculate_score, reverse=True)

        for task in floating_tasks:
            needed = max(1, task.estimated_pomodoros - task.sessions_count)
            for slot in slot_order:
                if needed <= 0:
                    break
                available = capacity.get(slot, 0)
                if available > 0:
                    take = min(needed, available)
                    schedule[slot].append(self._format_task(task, take, "auto"))
                    capacity[slot] -= take
                    needed -= take

        return schedule

    def _format_task(self, task, sessions, allocation_type):
        priority = task.priority
        status = task.status
        if hasattr(priority, "value"):
            priority = priority.value
        if hasattr(status, "value"):
            status = status.value
        return {
            "task_id": task.id,
            "task_name": task.name,
            "module": task.module.name if task.module else "General",
            "assigned_sessions": sessions,
            "priority": priority,  # already lowercase from enum
            "status": status,  # already lowercase from enum
            "allocation_type": allocation_type,
        }
