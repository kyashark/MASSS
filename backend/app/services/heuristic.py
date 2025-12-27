from sqlalchemy.orm import Session
from datetime import datetime, date, time
from typing import List, Dict, Any

from app.models.task import Task, TaskStatus, PriorityLevel
from app.models.profile import WeeklyRoutine, SlotPreference, SlotName, ActivityType

class HeuristicScheduler:
    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id
        # We don't hardcode 'today' anymore. We calculate based on the requested date.

    def _get_capacity_for_date(self, target_date: date) -> Dict[str, int]:
        """
        Calculates capacity for a SPECIFIC future date.
        """
        day_name = target_date.strftime("%A")
        
        # 1. Get Defaults
        prefs = self.db.query(SlotPreference).filter(SlotPreference.user_id == self.user_id).all()
        capacity_map = {p.slot_name: p.max_pomodoros for p in prefs}
        for slot in [SlotName.MORNING, SlotName.AFTERNOON, SlotName.EVENING]:
            if slot not in capacity_map: capacity_map[slot] = 4

        # 2. Subtract Fixed Routines (Classes/Sleep) specific to that day
        routines = self.db.query(WeeklyRoutine).filter(
            WeeklyRoutine.user_id == self.user_id,
            WeeklyRoutine.day_of_week == day_name # Checks Monday vs Sunday
        ).all()

        for r in routines:
            if r.activity_type in [ActivityType.CLASS, ActivityType.WORK, ActivityType.HABIT]:
                # Convert time range to Pomodoros
                start = r.start_time.hour + (r.start_time.minute / 60)
                end = r.end_time.hour + (r.end_time.minute / 60)
                lost_pomos = int((end - start) * 2)
                
                midpoint = (start + end) / 2
                if 6 <= midpoint < 12:
                    capacity_map[SlotName.MORNING] = max(0, capacity_map[SlotName.MORNING] - lost_pomos)
                elif 12 <= midpoint < 18:
                    capacity_map[SlotName.AFTERNOON] = max(0, capacity_map[SlotName.AFTERNOON] - lost_pomos)
                else:
                    capacity_map[SlotName.EVENING] = max(0, capacity_map[SlotName.EVENING] - lost_pomos)
        
        # 3. "Past Time" Check (Only applies if target_date is TODAY)
        if target_date == date.today():
            current_hour = datetime.now().hour
            if current_hour >= 12: capacity_map[SlotName.MORNING] = 0
            if current_hour >= 18: capacity_map[SlotName.AFTERNOON] = 0
            
        return capacity_map

    def _calculate_score(self, task_data: dict, current_date: date) -> float:
        """
        Calculates urgency score relative to the simulation date.
        """
        score = 0.0
        
        # Priority
        prio_map = {PriorityLevel.HIGH: 3, PriorityLevel.MEDIUM: 2, PriorityLevel.LOW: 1}
        score += (prio_map.get(task_data['priority'], 1) * 2)

        # Sticky
        if task_data['status'] == TaskStatus.IN_PROGRESS: score += 50 

        # Deadline Logic
        if task_data['deadline']:
            days_until = (task_data['deadline'].date() - current_date).days
            denominator = max(0.5, days_until)
            score += (10 / denominator)
        else:
            score += 0.5 # Low urgency

        return score

    def plan_one_day(self, target_date: date, active_tasks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Plans a single day and UPDATES the 'active_tasks' list in place.
        """
        capacity = self._get_capacity_for_date(target_date)
        schedule = {SlotName.MORNING: [], SlotName.AFTERNOON: [], SlotName.EVENING: []}
        
        # 1. Sort tasks dynamically for this specific date
        # (e.g., A task becomes more urgent on Day 3 than Day 1)
        active_tasks.sort(key=lambda t: self._calculate_score(t, target_date), reverse=True)

        slot_order = [SlotName.MORNING, SlotName.AFTERNOON, SlotName.EVENING]

        for task in active_tasks:
            # How much work is REALLY left?
            needed = task['remaining_pomodoros']
            
            if needed <= 0: continue

            for slot in slot_order:
                if needed <= 0: break
                
                available = capacity.get(slot, 0)
                if available > 0:
                    take = min(needed, available)
                    
                    # Add to Schedule
                    schedule[slot].append({
                        "task_id": task['id'],
                        "task_name": task['name'],
                        "module": task['module_name'],
                        "assigned_sessions": take,
                        "priority": task['priority'],
                        "status": task['status'],
                        "score": round(self._calculate_score(task, target_date), 2)
                    })
                    
                    # UPDATE STATE (The Simulation Part)
                    capacity[slot] -= take
                    needed -= take
                    
                    # Update the task object so the next loop knows it's done
                    task['remaining_pomodoros'] -= take

        return schedule