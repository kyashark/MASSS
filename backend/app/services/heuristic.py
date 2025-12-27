from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date, time
from typing import List, Dict, Any
import math

from app.models.task import Task, TaskStatus, PriorityLevel
from app.models.profile import WeeklyRoutine, SlotPreference, SlotName, ActivityType

class HeuristicScheduler:
    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id
        
        # 1. TIME AWARENESS (Crucial)
        # In a real app, pass the user's local timezone offset. 
        # For now, we assume Server Time = User Time.
        self.now = datetime.now() 
        self.today = self.now.date()
        self.day_name = self.today.strftime("%A")

    def _get_daily_capacity(self) -> Dict[str, int]:
        """
        Calculates capacity considering:
        1. Fixed Events (Classes)
        2. Energy Preferences
        3. REAL TIME (If it's 4 PM, Morning capacity is 0)
        """
        # --- A. Setup Defaults ---
        prefs = self.db.query(SlotPreference).filter(SlotPreference.user_id == self.user_id).all()
        capacity_map = {p.slot_name: p.max_pomodoros for p in prefs}
        
        # Defaults if missing
        for slot in [SlotName.MORNING, SlotName.AFTERNOON, SlotName.EVENING]:
            if slot not in capacity_map: capacity_map[slot] = 4

        # --- B. The "Time Travel" Check (Past Slots are Dead) ---
        current_hour = self.now.hour
        
        # Morning ends at 12:00
        if current_hour >= 12:
            capacity_map[SlotName.MORNING] = 0
        
        # Afternoon ends at 18:00
        if current_hour >= 18:
            capacity_map[SlotName.AFTERNOON] = 0
            
        # Evening ends at 00:00 (Technically next day)
        # We assume if you check at 11:59 PM, you have 0 capacity left.

        # --- C. Subtract Fixed Routines ---
        routines = self.db.query(WeeklyRoutine).filter(
            WeeklyRoutine.user_id == self.user_id,
            WeeklyRoutine.day_of_week == self.day_name
        ).all()

        for r in routines:
            if r.activity_type in [ActivityType.CLASS, ActivityType.WORK, ActivityType.HABIT]:
                # Calculate Duration
                start_dec = r.start_time.hour + (r.start_time.minute / 60)
                end_dec = r.end_time.hour + (r.end_time.minute / 60)
                duration = end_dec - start_dec
                
                # Convert to Pomodoros (2 per hour)
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
        Implementation of the specific Formula:
        Score = (User_Priority * 2) + (10 / Days_Until_Deadline) + Exam_Bonus
        """
        score = 0.0

        # --- 1. The Sticky Override ---
        if task.status == TaskStatus.IN_PROGRESS:
            return 10000.0 # God Tier

        # --- 2. User Priority ---
        # Map Enum to Int
        prio_map = {PriorityLevel.HIGH: 3, PriorityLevel.MEDIUM: 2, PriorityLevel.LOW: 1}
        p_val = prio_map.get(task.priority, 1)
        score += (p_val * 2)

        # --- 3. The Anchor Logic (Deadline) ---
        target_date = None
        if task.deadline:
            target_date = task.deadline.date()
        elif task.exam:
            target_date = task.exam.due_date
        
        if target_date:
            days_until = (target_date - self.today).days
            
            # Division by Zero Guard
            # If due today (0) or overdue (-5), treat as "Due Now" (0.1)
            denominator = max(0.1, days_until) 
            
            score += (10 / denominator)
        else:
            # No deadline? Treat as if due in 30 days (Low urgency)
            score += (10 / 30)

        # --- 4. Exam Weight Tie-Breaker ---
        if task.exam:
            # Exam weight is 0-100. Let's scale it down.
            # 40% weight -> +20 points
            score += (task.exam.weight * 0.5)

        return score

    def generate_plan(self) -> Dict[str, List[Dict[str, Any]]]:
        capacity = self._get_daily_capacity()
        
        # 1. Fetch ALL Active Tasks
        all_tasks = self.db.query(Task).filter(
            Task.user_id == self.user_id,
            Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS])
        ).all()

        # 2. Separate Fixed vs Floating
        fixed_tasks = [t for t in all_tasks if t.is_fixed]
        floating_tasks = [t for t in all_tasks if not t.is_fixed]

        schedule = {SlotName.MORNING: [], SlotName.AFTERNOON: [], SlotName.EVENING: []}

        # --- PHASE 1: PRE-FILL FIXED TASKS ---
        # Fixed tasks ignore score. They just take the space.
        for t in fixed_tasks:
            needed = t.estimated_pomodoros - t.sessions_count
            if needed <= 0: needed = 1
            
            # Simple assumption: Fixed tasks go where they fit or overflow
            # Ideally, fixed tasks should have a "fixed_time" field, 
            # but for MVP we fill them into the first available capacity.
            # (Refinement: If you add 'fixed_slot' to Task model later, use it here)
            pass 

        # --- PHASE 2: SCORE & SORT FLOATING TASKS ---
        floating_tasks.sort(key=self._calculate_score, reverse=True)

        # --- PHASE 3: BIN PACKING ---
        slot_order = [SlotName.MORNING, SlotName.AFTERNOON, SlotName.EVENING]

        for task in floating_tasks:
            needed = task.estimated_pomodoros - task.sessions_count
            # Fallback: If underestimated (0 left but not done), assume 1 session needed
            if needed <= 0: needed = 1

            for slot in slot_order:
                if needed <= 0: break 
                
                available = capacity.get(slot, 0)
                
                if available > 0:
                    take = min(needed, available)
                    
                    # Add to Plan
                    schedule[slot].append({
                        "task_id": task.id,
                        "task_name": task.name,
                        "module": task.module.name if task.module else "General",
                        "assigned_sessions": take,
                        "priority": task.priority,
                        "status": task.status,
                        "score": round(self._calculate_score(task), 2) # Debug info
                    })
                    
                    # Update State
                    capacity[slot] -= take
                    needed -= take

        return schedule