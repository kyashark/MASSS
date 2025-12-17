from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.modules.scheduling.models import Task, Module, TaskStatus, EnergyTime

# --- CONSTANTS ---
SLOT_CONFIG = {
    1: {"name": "Morning",   "start_time": "06:00:00", "capacity": 4}, # Capacity in Pomodoros (4 = 2 hours)
    2: {"name": "Afternoon", "start_time": "12:00:00", "capacity": 4},
    3: {"name": "Night",     "start_time": "18:00:00", "capacity": 4}
}

def get_days_until_nearest_exam(task: Task) -> int:
    """Returns days until closest exam or 999 if none."""
    if not task.module.exams:
        return 999
    today = datetime.now()
    nearest_days = 999
    for exam in task.module.exams:
        if exam.date > today:
            days_diff = (exam.date - today).days
            if days_diff < nearest_days:
                nearest_days = days_diff
    return nearest_days

def calculate_priority_score(task: Task) -> float:
    """Score = Difficulty + Urgency + ExamPressure"""
    score = 0.0
    score += task.module.difficulty
    
    if task.deadline:
        days_left = (task.deadline - datetime.now()).days
    else:
        days_left = 14 

    if days_left < 0:
        score += 50
    else:
        score += (15 / (days_left + 1))
            
    exam_days = get_days_until_nearest_exam(task)
    if 0 <= exam_days <= 3:
        score += 25
    elif 4 <= exam_days <= 7:
        score += 10
            
    return score

def generate_heuristic_schedule(db: Session):
    """
    FORECAST SCHEDULER:
    Allocates tasks starting from 'Now' and spilling over to future days 
    until all pending tasks are scheduled.
    """
    # 1. Fetch & Sort
    tasks = db.query(Task).filter(Task.status == TaskStatus.PENDING).all()
    if not tasks:
        return []

    # Sort high priority first
    unassigned_tasks = sorted(tasks, key=calculate_priority_score, reverse=True)
    
    final_plan = []
    
    # 2. Simulation Setup
    current_date = datetime.now()
    safety_limit = 0 # Prevent infinite loops
    
    # 3. Allocation Loop (Keep going until no tasks left)
    while unassigned_tasks and safety_limit < 60: # Limit to 60 days ahead
        date_str = current_date.strftime("%Y-%m-%d")
        
        # A. Determine which slots are available TODAY
        available_slots = [1, 2, 3]
        
        # If we are scheduling for "Today", check the current time
        if current_date.date() == datetime.now().date():
            current_hour = datetime.now().hour
            if current_hour >= 18:
                available_slots = [3] # Only Night left (or maybe none if it's 11 PM)
                if current_hour >= 22: available_slots = [] # Too late!
            elif current_hour >= 12:
                available_slots = [2, 3] # Afternoon & Night
            # Else (Morning) -> All slots [1, 2, 3] are open
        
        # B. Init Buckets for this Day
        daily_buckets = {
            1: {"load": 0, "tasks": []},
            2: {"load": 0, "tasks": []},
            3: {"load": 0, "tasks": []}
        }
        
        tasks_assigned_today = []

        # C. Try to fit tasks into this day
        for task in unassigned_tasks:
            needed = task.estimated_pomodoros
            
            # Skip if task is huge (>4 slots) for now, or it will block forever
            if needed > 4: 
                continue 

            # Energy Preference Logic
            pref_energy = task.module.preferred_energy 
            target_slot = 1
            if pref_energy == EnergyTime.AFTERNOON: target_slot = 2
            elif pref_energy == EnergyTime.NIGHT: target_slot = 3
            
            # Order: Preferred -> Next -> Next
            # But ONLY check slots that are actually available (e.g. don't check Morning if it's 2 PM)
            preferred_order = [target_slot, (target_slot % 3) + 1, ((target_slot + 1) % 3) + 1]
            valid_order = [s for s in preferred_order if s in available_slots]
            
            slot_found = None
            for slot_id in valid_order:
                if daily_buckets[slot_id]["load"] + needed <= SLOT_CONFIG[slot_id]["capacity"]:
                    daily_buckets[slot_id]["tasks"].append(task)
                    daily_buckets[slot_id]["load"] += needed
                    slot_found = slot_id
                    break
            
            if slot_found:
                tasks_assigned_today.append(task)
        
        # D. Save Today's Plan to Output
        for slot_id in available_slots:
            bucket = daily_buckets[slot_id]
            if bucket["tasks"]:
                slot_info = SLOT_CONFIG[slot_id]
                for t in bucket["tasks"]:
                    final_plan.append({
                        "date": date_str,
                        "slot_number": slot_id,
                        "slot_name": slot_info["name"],
                        "start_time": slot_info["start_time"],
                        "task_id": t.id,
                        "task_name": t.name,
                        "module_name": t.module.name,
                        "duration_pomodoros": t.estimated_pomodoros,
                        "priority_score": round(calculate_priority_score(t), 2)
                    })
        
        # E. Cleanup & Advance
        # Remove tasks assigned today from the master list
        for t in tasks_assigned_today:
            unassigned_tasks.remove(t)
            
        # Move to tomorrow
        current_date += timedelta(days=1)
        safety_limit += 1
            
    return final_plan