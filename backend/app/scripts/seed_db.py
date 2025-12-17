import random
import sys
import os
from datetime import datetime, timedelta

# --- SETUP PATH TO ALLOW IMPORTS ---
# This hack allows us to run this script directly from the backend folder
sys.path.append(os.getcwd())

from app.core.database import SessionLocal, engine, Base
from app.modules.scheduling.models import Module, Task, PomodoroSession, ModuleType, EnergyTime, TaskStatus

def seed_data():
    # 1. Create Tables
    print("🛠️  Creating Database Tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()

    # 2. Clear Old Data (Reset)
    print("🧹 Clearing old data...")
    db.query(PomodoroSession).delete()
    db.query(Task).delete()
    db.query(Module).delete()
    db.commit()

    # 3. Create Modules
    print("📚 Creating Modules...")
    
    # Module 1: Hard Math (Exam coming soon!)
    math_mod = Module(
        name="Advanced Calculus", 
        category=ModuleType.MATH, 
        difficulty=5, 
        preferred_energy=EnergyTime.MORNING,
        upcoming_exam_date=datetime.now() + timedelta(days=4), # URGENT!
        exam_importance=5
    )

    # Module 2: Coding (Project based)
    code_mod = Module(
        name="Full Stack Project", 
        category=ModuleType.CODING, 
        difficulty=3, 
        preferred_energy=EnergyTime.AFTERNOON,
        upcoming_exam_date=None # No exam
    )

    # Module 3: History (Reading)
    hist_mod = Module(
        name="World History", 
        category=ModuleType.THEORY, 
        difficulty=2, 
        preferred_energy=EnergyTime.NIGHT,
        upcoming_exam_date=datetime.now() + timedelta(days=20) # Far away
    )

    db.add_all([math_mod, code_mod, hist_mod])
    db.commit()

    # Reload modules to get IDs
    modules = [math_mod, code_mod, hist_mod]

    # 4. Generate History (The "Training Data" for RL)
    print("🧠 Generating User History (Biased Patterns)...")
    
    for i in range(50):
        mod = random.choice(modules)
        
        # Create a completed task
        task = Task(
            name=f"Old Task {i} - {mod.name}",
            module_id=mod.id,
            estimated_pomodoros=1,
            status=TaskStatus.COMPLETED,
            deadline=datetime.now() - timedelta(days=random.randint(2, 30))
        )
        db.add(task)
        db.commit()

        # BIAS LOGIC: 
        # If Math is done at NIGHT -> Rating is LOW (1-2)
        # If Math is done in MORNING -> Rating is HIGH (4-5)
        is_night = random.choice([True, False])
        
        if mod.category == ModuleType.MATH and is_night:
            rating = random.randint(1, 2)
        elif mod.category == ModuleType.MATH and not is_night:
            rating = random.randint(4, 5)
        else:
            rating = random.randint(3, 5) # General random good rating

        start_time = datetime.now() - timedelta(days=random.randint(1, 30))
        if is_night:
            start_time = start_time.replace(hour=20)
        else:
            start_time = start_time.replace(hour=9)

        session = PomodoroSession(
            task_id=task.id,
            start_time=start_time,
            end_time=start_time + timedelta(minutes=25),
            completed=True,
            focus_rating=rating
        )
        db.add(session)

    # 5. Generate Pending Tasks (For Scheduling Demo)
    print("📅 Generating Pending Tasks for Scheduler...")
    
    # Urgent Math Tasks (Should be scheduled FIRST because exam is in 4 days)
    for i in range(3):
        t = Task(
            name=f"Math Revision Ch.{i+1}",
            module_id=math_mod.id,
            estimated_pomodoros=2,
            deadline=datetime.now() + timedelta(days=3),
            status=TaskStatus.PENDING
        )
        db.add(t)

    # Relaxed History Tasks
    for i in range(3):
        t = Task(
            name=f"Read History Ch.{i+1}",
            module_id=hist_mod.id,
            estimated_pomodoros=1,
            deadline=datetime.now() + timedelta(days=7),
            status=TaskStatus.PENDING
        )
        db.add(t)

    db.commit()
    db.close()
    print("✅ Seed Complete! You are ready to build the Scheduler.")

if __name__ == "__main__":
    seed_data()