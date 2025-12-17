from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.modules.scheduling.models import Task, Module, TaskStatus, EnergyTime

# --- CONSTANTS ---
SLOT_CONFIG = {
    1: {"name": "Morning",   "start_time": "06:00", "end_time": "12:00", "capacity": 4}, 
    2: {"name": "Afternoon", "start_time": "12:00", "end_time": "18:00", "capacity": 4},
    3: {"name": "Night",     "start_time": "18:00", "end_time": "00:00", "capacity": 4}
}

def get_days_until_nearest_exam(task: Task) -> int:
    """Helper: Days until closest exam or 999 if none."""
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
    """Helper: Score = Difficulty + Urgency + ExamPressure"""
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
    Returns tasks grouped by Time Slots (Buckets).
    Does NOT force specific start times.
    """
    # 1. Fetch & Sort
    tasks = db.query(Task).filter(Task.status == TaskStatus.PENDING).all()
    if not tasks:
        return []

    unassigned_tasks = sorted(tasks, key=calculate_priority_score, reverse=True)
    final_plan = []
    
    current_date = datetime.now()
    safety_limit = 0 
    
    # --- ALLOCATION LOOP ---
    while unassigned_tasks and safety_limit < 60:
        date_str = current_date.strftime("%Y-%m-%d")
        
        # Determine available slots logic (Same as before)
        available_slots = [1, 2, 3]
        if current_date.date() == datetime.now().date():
            current_hour = datetime.now().hour
            if current_hour >= 18: available_slots = [3]
            elif current_hour >= 22: available_slots = []
            elif current_hour >= 12: available_slots = [2, 3]
        
        daily_buckets = {1: [], 2: [], 3: []}
        slot_loads = {1: 0, 2: 0, 3: 0}
        
        tasks_assigned_today = []

        for task in unassigned_tasks:
            needed = task.estimated_pomodoros
            if needed > 4: continue 

            # Preference Logic
            pref_energy = task.module.preferred_energy 
            target_slot = 1
            if pref_energy == EnergyTime.AFTERNOON: target_slot = 2
            elif pref_energy == EnergyTime.NIGHT: target_slot = 3
            
            preferred_order = [target_slot, (target_slot % 3) + 1, ((target_slot + 1) % 3) + 1]
            valid_order = [s for s in preferred_order if s in available_slots]
            
            slot_found = None
            for slot_id in valid_order:
                if slot_loads[slot_id] + needed <= SLOT_CONFIG[slot_id]["capacity"]:
                    daily_buckets[slot_id].append(task)
                    slot_loads[slot_id] += needed
                    slot_found = slot_id
                    break
            
            if slot_found:
                tasks_assigned_today.append(task)
        
        # --- OUTPUT FORMATTING (The Change) ---
        for slot_id in available_slots:
            bucket_tasks = daily_buckets[slot_id]
            if not bucket_tasks:
                continue
            
            config = SLOT_CONFIG[slot_id]
            
            # We preserve the order (High Priority First)
            # But we give them all the same "Window"
            for index, t in enumerate(bucket_tasks):
                final_plan.append({
                    "date": date_str,
                    "slot_number": slot_id,
                    "slot_name": config["name"],  # Morning
                    "time_range": f"{config['start_time']} - {config['end_time']}", # "06:00 - 12:00"
                    "suggested_order": index + 1, # 1, 2, 3...
                    "task_id": t.id,
                    "task_name": t.name,
                    "module_name": t.module.name,
                    "duration_pomodoros": t.estimated_pomodoros,
                    "priority_score": round(calculate_priority_score(t), 2)
                })

        # Cleanup
        for t in tasks_assigned_today:
            unassigned_tasks.remove(t)
            
        current_date += timedelta(days=1)
        safety_limit += 1
            
    return final_plan