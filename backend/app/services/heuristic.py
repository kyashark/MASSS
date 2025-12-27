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
        """
        Calculates capacity based on Profile & Current Time.
        """
        # A. Setup Defaults from DB
        prefs = self.db.query(SlotPreference).filter(SlotPreference.user_id == self.user_id).all()
        capacity_map = {SlotName.MORNING: 4, SlotName.AFTERNOON: 4, SlotName.EVENING: 4}
        for p in prefs:
            capacity_map[p.slot_name] = p.max_pomodoros

        # B. Time Travel Check (Zero out past slots)
        current_hour = self.now.hour
        if current_hour >= 12: capacity_map[SlotName.MORNING] = 0
        if current_hour >= 18: capacity_map[SlotName.AFTERNOON] = 0

        # C. Subtract Fixed Routines (Classes)
        routines = self.db.query(WeeklyRoutine).filter(
            WeeklyRoutine.user_id == self.user_id,
            WeeklyRoutine.day_of_week == self.day_name
        ).all()

        for r in routines:
            if r.activity_type in [ActivityType.CLASS, ActivityType.WORK]:
                # Calculate Duration
                start_dec = r.start_time.hour + (r.start_time.minute / 60)
                end_dec = r.end_time.hour + (r.end_time.minute / 60)
                duration = max(0, end_dec - start_dec)
                
                # Convert to Pomodoros (approx 2 per hour)
                lost_pomos = int(duration * 2)
                
                midpoint = (start_dec + end_dec) / 2
                if 6 <= midpoint < 12:
                    capacity_map[SlotName.MORNING] = max(0, capacity_map[SlotName.MORNING] - lost_pomos)
                elif 12 <= midpoint < 18:
                    capacity_map[SlotName.AFTERNOON] = max(0, capacity_map[SlotName.AFTERNOON] - lost_pomos)
                else:
                    capacity_map[SlotName.EVENING] = max(0, capacity_map[SlotName.EVENING] - lost_pomos)

        return capacity_map

    def _calculate_score(self, task: Task) -> float:
        """
        Formula: (Priority * 2) + (10 / Days_Until_Deadline) + Momentum_Bonus + Exam_Bonus
        """
        score = 0.0

        # 1. Sticky Rule (Momentum)
        if task.status == TaskStatus.IN_PROGRESS:
            return 10000.0 

        # 2. User Priority
        prio_map = {PriorityLevel.HIGH: 3, PriorityLevel.MEDIUM: 2, PriorityLevel.LOW: 1}
        # Handle enum safely (if it's an object use .value or .name, if string use direct)
        p_val = prio_map.get(task.priority, 1) 
        score += (p_val * 2)

        # 3. Anchor Logic (Deadline)
      
        target_date = task.exam.due_date if (task.exam and task.exam.due_date) else task.deadline
        if target_date:
            # Normalize to date object
            d_date = target_date.date() if isinstance(target_date, datetime) else target_date
            days_until = (d_date - self.today).days
            denominator = max(0.1, days_until) 
            score += (10 / denominator)
        else:
            score += 0.3 # Low urgency

        # 4. Exam Weight
        if task.exam:
            score += (task.exam.weight or 1) * 0.5

        return score

    def generate_plan(self) -> Dict[str, List[Dict[str, Any]]]:
        capacity = self._get_daily_capacity()
        
        all_tasks = self.db.query(Task).filter(
            Task.user_id == self.user_id,
            Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS])
        ).all()

        fixed_tasks = [t for t in all_tasks if t.is_fixed]
        floating_tasks = [t for t in all_tasks if not t.is_fixed]

        schedule = {SlotName.MORNING: [], SlotName.AFTERNOON: [], SlotName.EVENING: []}
        slot_order = [SlotName.MORNING, SlotName.AFTERNOON, SlotName.EVENING]

        # --- PHASE 1: PRE-FILL FIXED TASKS (Fixed Logic) ---
        for task in fixed_tasks:
            needed = max(1, task.estimated_pomodoros - task.sessions_count)
            
            # Fixed tasks are greedy: they take the first available slot
            for slot in slot_order:
                if needed <= 0: break
                
                # Check if slot has capacity (or force it if it's FIXED)
                # Note: Usually Fixed tasks Force their way in, but let's respect capacity for now
                if capacity[slot] > 0:
                    take = min(needed, capacity[slot])
                    
                    schedule[slot].append(self._format_task(task, take, "Fixed"))
                    
                    capacity[slot] -= take
                    needed -= take

        # --- PHASE 2: SCORE & SORT FLOATING TASKS ---
        floating_tasks.sort(key=self._calculate_score, reverse=True)

        # --- PHASE 3: BIN PACKING ---
        for task in floating_tasks:
            needed = max(1, task.estimated_pomodoros - task.sessions_count)

            for slot in slot_order:
                if needed <= 0: break
                
                available = capacity.get(slot, 0)
                if available > 0:
                    take = min(needed, available)
                    
                    schedule[slot].append(self._format_task(task, take, "Auto"))
                    
                    capacity[slot] -= take
                    needed -= take

        return schedule

    def _format_task(self, task, sessions, allocation_type):
        """Helper to format the output for Pydantic"""
        return {
            "task_id": task.id,
            "task_name": task.name,
            "module": task.module.name if task.module else "General",
            "assigned_sessions": sessions,
            "priority": task.priority.name if hasattr(task.priority, "name") else str(task.priority),
            "status": task.status.name if hasattr(task.status, "name") else str(task.status),
            "allocation_type": allocation_type
        }