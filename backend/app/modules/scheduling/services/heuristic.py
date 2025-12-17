from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.modules.scheduling.models import Task, Module, TaskStatus, EnergyTime, StudentProfile, DayOfWeek, FixedEvent

# Constants
SLOT_CONFIG = {
    1: {"name": "Morning",   "start": "06:00", "end": "12:00"}, 
    2: {"name": "Afternoon", "start": "12:00", "end": "18:00"},
    3: {"name": "Night",     "start": "18:00", "end": "00:00"}
}
POMODORO_MINUTES = 30

# Map Python weekday integer (0=Mon, 6=Sun) to our Enum
WEEKDAY_MAP = {
    0: DayOfWeek.MONDAY,
    1: DayOfWeek.TUESDAY,
    2: DayOfWeek.WEDNESDAY,
    3: DayOfWeek.THURSDAY,
    4: DayOfWeek.FRIDAY,
    5: DayOfWeek.SATURDAY,
    6: DayOfWeek.SUNDAY
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

def get_net_capacity(db: Session, profile: StudentProfile, date_obj: datetime):
    """
    Calculates Available Slots = (Max Capacity) - (Fixed Events)
    """
    # 1. Base Capacities
    caps = {
        1: profile.morning_capacity,
        2: profile.afternoon_capacity,
        3: profile.night_capacity
    }
    
    # 2. Find Day of Week
    day_enum = WEEKDAY_MAP[date_obj.weekday()]
    
    # 3. Fetch Fixed Events for this specific day
    events = db.query(FixedEvent).filter(
        FixedEvent.profile_id == profile.id, 
        FixedEvent.day_of_week == day_enum
    ).all()
    
    # 4. Subtract Fixed Time
    for event in events:
        # Calculate duration in minutes
        # Simple hack: Convert time objects to dummy datetimes to subtract
        dummy_date = datetime.today()
        t1 = datetime.combine(dummy_date, event.start_time)
        t2 = datetime.combine(dummy_date, event.end_time)
        duration_minutes = (t2 - t1).seconds / 60
        
        # Convert to Pomodoros (approx)
        pomodoros_taken = int(duration_minutes / POMODORO_MINUTES)
        
        # Deduct from relevant slot
        slot_map = {EnergyTime.MORNING: 1, EnergyTime.AFTERNOON: 2, EnergyTime.NIGHT: 3}
        target = slot_map[event.slot_category]
        
        caps[target] = max(0, caps[target] - pomodoros_taken)
        
    return caps

def generate_heuristic_schedule(db: Session):
    # 1. Get Profile
    profile = db.query(StudentProfile).first()
    if not profile:
        # Fallback profile if none exists
        class DummyProfile:
            morning_capacity=4
            afternoon_capacity=4
            night_capacity=4
        profile = DummyProfile()

    tasks = db.query(Task).filter(Task.status == TaskStatus.PENDING).all()
    if not tasks: return []

    unassigned_tasks = sorted(tasks, key=calculate_priority_score, reverse=True)
    final_plan = []
    
    current_date = datetime.now()
    safety_limit = 0 
    
    while unassigned_tasks and safety_limit < 60:
        date_str = current_date.strftime("%Y-%m-%d")
        
        # --- DYNAMIC CAPACITY CALCULATION ---
        # "Today is Wednesday. I have class. Morning capacity is reduced."
        daily_caps = get_net_capacity(db, profile, current_date)
        
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
            # Skip if task is bigger than the BIGGEST slot available today
            max_slot = max(daily_caps.values())
            if needed > max_slot: continue 

            pref_energy = task.module.preferred_energy 
            target_slot = 1
            if pref_energy == EnergyTime.AFTERNOON: target_slot = 2
            elif pref_energy == EnergyTime.NIGHT: target_slot = 3
            
            preferred_order = [target_slot, (target_slot % 3) + 1, ((target_slot + 1) % 3) + 1]
            valid_order = [s for s in preferred_order if s in available_slots]
            
            slot_found = None
            for slot_id in valid_order:
                # Use DYNAMIC daily_caps here
                if slot_loads[slot_id] + needed <= daily_caps[slot_id]:
                    daily_buckets[slot_id].append(task)
                    slot_loads[slot_id] += needed
                    slot_found = slot_id
                    break
            
            if slot_found:
                tasks_assigned_today.append(task)
        
        # Output Formatting
        for slot_id in available_slots:
            bucket_tasks = daily_buckets[slot_id]
            if not bucket_tasks: continue
            
            config = SLOT_CONFIG[slot_id]
            for index, t in enumerate(bucket_tasks):
                final_plan.append({
                    "date": date_str,
                    "slot_number": slot_id,
                    "slot_name": config["name"],
                    "time_range": f"{config['start']} - {config['end']}",
                    "suggested_order": index + 1,
                    "task_id": t.id,
                    "task_name": t.name,
                    "module_name": t.module.name,
                    "duration_pomodoros": t.estimated_pomodoros,
                    "priority_score": round(calculate_priority_score(t), 2)
                })

        for t in tasks_assigned_today:
            unassigned_tasks.remove(t)
            
        current_date += timedelta(days=1)
        safety_limit += 1
            
    return final_plan