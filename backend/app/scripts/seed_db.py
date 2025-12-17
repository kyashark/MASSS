import random
import sys
import os
from datetime import datetime, timedelta

# --- SETUP PATH TO ALLOW IMPORTS FROM ROOT ---
# This allows running the script directly like: python app/scripts/seed_db.py
sys.path.append(os.getcwd())

from app.core.database import SessionLocal, engine, Base
from app.modules.scheduling.models import (
    Module, Task, PomodoroSession, Exam, 
    ModuleType, EnergyTime, TaskStatus,
    StudentProfile, FixedEvent, DayOfWeek
)

def seed_data():
    # 1. NUKE OLD TABLES & REBUILD
    # This ensures your new Exam table and modified Task table are created correctly.
    print("💥 Dropping old tables to fix schema...")
    Base.metadata.drop_all(bind=engine) 
    
    print("🛠️  Creating new Database Tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()

    # 5. Create Student Profile
    print("👤 Creating Student Profile...")
    profile = StudentProfile(
        name="John Doe",
        wake_up_time=datetime.strptime("07:00", "%H:%M").time(),
        bed_time=datetime.strptime("23:00", "%H:%M").time(),
        morning_capacity=4,    # Wants to work in morning
        afternoon_capacity=4,
        night_capacity=6       # Night owl
    )
    db.add(profile)
    db.commit()

    # 6. Add Fixed Event (University Class)
    # On Wednesdays, Morning is BUSY.
    print("🏫 Adding University Timetable...")
    uni_class = FixedEvent(
        profile_id=profile.id,
        name="Data Structures Lecture",
        day_of_week=DayOfWeek.WEDNESDAY,
        start_time=datetime.strptime("09:00", "%H:%M").time(),
        end_time=datetime.strptime("11:00", "%H:%M").time(),
        slot_category=EnergyTime.MORNING 
    )
    db.add(uni_class)
    db.commit()
    
    print("✅ Seed Complete! Profile and Timetable ready.")

    # 2. CREATE MODULES
    print("📚 Creating Modules...")
    
    # Module 1: Hard Math (Morning Energy)
    math_mod = Module(
        name="Advanced Calculus", 
        category=ModuleType.MATH, 
        difficulty=5, 
        preferred_energy=EnergyTime.MORNING
    )

    # Module 2: Coding (Afternoon Energy)
    code_mod = Module(
        name="Full Stack Project", 
        category=ModuleType.CODING, 
        difficulty=3, 
        preferred_energy=EnergyTime.AFTERNOON
    )

    # Module 3: History (Night Energy)
    hist_mod = Module(
        name="World History", 
        category=ModuleType.THEORY, 
        difficulty=2, 
        preferred_energy=EnergyTime.NIGHT
    )
    
    db.add_all([math_mod, code_mod, hist_mod])
    db.commit() # Commit to generate IDs
    
    # Reload to ensure we have the objects bound
    modules = [math_mod, code_mod, hist_mod]

    # 3. SCHEDULE EXAMS (The New Table)
    print("📝 Scheduling Exams...")
    
    # Math has an URGENT exam (in 3 days)
    math_exam = Exam(
        module_id=math_mod.id, 
        name="Calculus Midterm", 
        date=datetime.now() + timedelta(days=3), 
        importance=5
    )
    
    # History has a FAR exam (in 40 days)
    hist_exam = Exam(
        module_id=hist_mod.id, 
        name="History Final", 
        date=datetime.now() + timedelta(days=40), 
        importance=5
    )
    
    db.add_all([math_exam, hist_exam])
    db.commit()

    # 4. GENERATE HISTORY (Training Data for RL)
    # Pattern: Math is bad at Night, Good in Morning.
    print("🧠 Generating 50 Past Sessions (User History)...")
    
    for i in range(50):
        mod = random.choice(modules)
        
        # Create a completed task
        task = Task(
            name=f"Practice {mod.name} set {i}",
            module_id=mod.id,
            estimated_pomodoros=1,
            status=TaskStatus.COMPLETED,
            deadline=datetime.now() - timedelta(days=random.randint(5, 30))
        )
        db.add(task)
        db.commit()
        
        # Simulate Session
        is_night = random.choice([True, False])
        
        # BIAS LOGIC (The "Fake User Behavior")
        if mod.category == ModuleType.MATH and is_night:
            rating = random.randint(1, 2) # Bad focus
        elif mod.category == ModuleType.MATH and not is_night:
            rating = random.randint(4, 5) # Good focus
        else:
            rating = random.randint(3, 5) # Good focus for others

        # Set time
        session_date = datetime.now() - timedelta(days=random.randint(1, 30))
        if is_night:
            start_time = session_date.replace(hour=20, minute=0) # 8 PM
        else:
            start_time = session_date.replace(hour=9, minute=0)  # 9 AM

        session = PomodoroSession(
            task_id=task.id,
            start_time=start_time,
            end_time=start_time + timedelta(minutes=25),
            completed=True,
            focus_rating=rating
        )
        db.add(session)

    # 5. GENERATE PENDING TASKS (For Scheduling Demo)
    print("📅 Generating Pending Tasks (With & Without Deadlines)...")
    
    # Task A: Urgent Math (Should be Top Priority due to Exam + Deadline)
    t1 = Task(
        name="Math Revision: Limits",
        module_id=math_mod.id,
        estimated_pomodoros=2,
        deadline=datetime.now() + timedelta(days=2),
        is_assignment=False,
        status=TaskStatus.PENDING
    )
    
    # Task B: Coding Assignment (Strict Deadline)
    t2 = Task(
        name="Backend API Setup",
        module_id=code_mod.id,
        estimated_pomodoros=3,
        deadline=datetime.now() + timedelta(days=5),
        is_assignment=True, # Priority Boost!
        status=TaskStatus.PENDING
    )
    
    # Task C: Relaxed Reading (No Deadline - "Open Ended")
    t3 = Task(
        name="Read History Chapter 4",
        module_id=hist_mod.id,
        estimated_pomodoros=1,
        deadline=None, # <--- Testing "None" handling
        is_assignment=False,
        status=TaskStatus.PENDING
    )

    db.add_all([t1, t2, t3])
    db.commit()
    db.close()
    
    print("✅ Seed Complete! Database is ready.")
    print("   - 3 Modules Created")
    print("   - 2 Exams Scheduled")
    print("   - 50 Past Sessions Recorded")
    print("   - 3 Pending Tasks Waiting (1 Urgent, 1 Assignment, 1 Open-Ended)")

if __name__ == "__main__":
    seed_data()