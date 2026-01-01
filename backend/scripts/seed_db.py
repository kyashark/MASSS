import random
from datetime import datetime, timedelta, time, date
from sqlalchemy.orm import Session
from app.core.database import SessionLocal

# Import your existing models
from app.models.module import Module, Category, Priority, EnergyTime
from app.models.exam import Exam, ExamType
from app.models.task import Task, TaskStatus, PriorityLevel
from app.models.session import PomodoroSession, SessionEndType
from app.models.profile import WeeklyRoutine, SlotPreference, ActivityType, DayOfWeek, SlotName

# --- CONFIGURATION ---
USER_ID = 1
PAST_DAYS = 30
NUM_SESSIONS = 150 

def seed_data():
    db = SessionLocal()
    print("🌱 Starting Smart Seed Process for User ID: 1...")

    try:
        # 1. CLEANUP
        print("🧹 Clearing old data...")
        db.query(PomodoroSession).delete()
        db.query(Task).delete()
        db.query(Exam).delete()
        db.query(Module).delete()
        db.query(WeeklyRoutine).delete()
        db.query(SlotPreference).delete()
        db.commit()

        # 2. PROFILE & 3. PREFERENCES (Same as before)
        print("📅 Setting up Routine & Preferences...")
        routines = []
        days = [d.value for d in DayOfWeek]
        for d in days:
            routines.append(WeeklyRoutine(
                user_id=USER_ID, name="Sleep", activity_type=ActivityType.SLEEP,
                day_of_week=d, start_time=time(23, 0), end_time=time(7, 0)
            ))
        for d in [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY]:
            routines.append(WeeklyRoutine(
                user_id=USER_ID, name="Morning Lectures", activity_type=ActivityType.CLASS,
                day_of_week=d, start_time=time(9, 0), end_time=time(12, 0)
            ))
        db.add_all(routines)

        prefs = [
            SlotPreference(user_id=USER_ID, slot_name=SlotName.MORNING, max_pomodoros=2, is_preferred=False),
            SlotPreference(user_id=USER_ID, slot_name=SlotName.AFTERNOON, max_pomodoros=6, is_preferred=True),
            SlotPreference(user_id=USER_ID, slot_name=SlotName.EVENING, max_pomodoros=4, is_preferred=False)
        ]
        db.add_all(prefs)
        db.commit()

        # 4. MODULES & 5. EXAMS (Same as before)
        print("📚 Creating Modules & Exams...")
        subjects = [
            ("Advanced Algorithms", Category.CODING, Priority.HIGH, 5, EnergyTime.AFTERNOON),
            ("Linear Algebra", Category.MATH, Priority.HIGH, 4, EnergyTime.MORNING),
            ("Web Development", Category.CODING, Priority.MEDIUM, 3, EnergyTime.EVENING),
            ("Japanese History", Category.MEMORIZATION, Priority.LOW, 2, EnergyTime.AFTERNOON),
            ("Creative Writing", Category.CREATIVE_DESIGN, Priority.LOW, 1, EnergyTime.EVENING)
        ]
        modules_db = []
        for name, cat, prio, diff, energy in subjects:
            mod = Module(user_id=USER_ID, name=name, category=cat, priority=prio, difficulty=diff, energy_time=energy)
            db.add(mod)
            modules_db.append(mod)
        db.flush()

        exams_db = []
        today = date.today()
        for mod in modules_db:
            exams_db.append(Exam(user_id=USER_ID, module_id=mod.id, name=f"{mod.name} Midterm", exam_type=ExamType.MIDTERM, due_date=today - timedelta(days=20), weight=30))
            exams_db.append(Exam(user_id=USER_ID, module_id=mod.id, name=f"{mod.name} Final", exam_type=ExamType.FINAL, due_date=today + timedelta(days=30), weight=40))
        db.add_all(exams_db)
        db.flush()

        # 6. TASKS
        print("✅ Creating Tasks...")
        tasks_db = []
        # Completed Tasks
        for i in range(25):
            mod = random.choice(modules_db)
            t = Task(user_id=USER_ID, module_id=mod.id, name=f"Read Chapter {i+1}", estimated_pomodoros=3, sessions_count=3, priority=PriorityLevel.LOW, status=TaskStatus.COMPLETED)
            tasks_db.append(t)
        # Pending Tasks
        for i in range(35):
            mod = random.choice(modules_db)
            related_exam = next((e for e in exams_db if e.module_id == mod.id and e.exam_type == ExamType.FINAL), None)
            t = Task(
                user_id=USER_ID, module_id=mod.id,
                exam_id=related_exam.id if related_exam and random.random() > 0.4 else None,
                name=f"{mod.name} Assignment {i+1}", estimated_pomodoros=random.randint(2, 6),
                sessions_count=random.choice([0, 1]), # Some have momentum
                priority=random.choice(list(PriorityLevel)),
                status=TaskStatus.IN_PROGRESS if random.random() > 0.8 else TaskStatus.PENDING,
                deadline=datetime.utcnow() + timedelta(days=random.randint(2, 14))
            )
            tasks_db.append(t)
        db.add_all(tasks_db)
        db.commit()

        # ---------------------------------------------------------
        # 7. SESSIONS (The Matrix Logic Implementation)
        # ---------------------------------------------------------
        print("🧠 Creating Historical Sessions with Logic Matrix...")
        all_tasks = db.query(Task).all()
        sessions_db = []

        for _ in range(NUM_SESSIONS):
            target_task = random.choice(all_tasks)
            
            # Random time & base rating based on Energy Profile
            session_date = datetime.utcnow() - timedelta(days=random.randint(1, PAST_DAYS))
            hour = random.randint(8, 23)
            start_time = session_date.replace(hour=hour, minute=random.randint(0, 50), second=0)

            # Focus Bias (Morning=Bad, Afternoon=Good)
            if 6 <= hour < 12: base_rating = random.choices([1, 2, 3], weights=[0.4, 0.4, 0.2])[0]
            elif 12 <= hour < 18: base_rating = random.choices([4, 5], weights=[0.3, 0.7])[0]
            else: base_rating = random.choices([2, 3, 4], weights=[0.2, 0.5, 0.3])[0]

            # --- APPLYING THE SCENARIOS ---
            scenario_roll = random.random()

            # Scenario A: Normal Finish (Success) - 75% chance
            if scenario_roll < 0.75:
                end_type = SessionEndType.COMPLETED
                duration = 25.0
                is_completed = True
                rating = base_rating # True focus

            # Scenario B: "Stop For Now" (Pause/Interrupt) - 15% chance
            elif scenario_roll < 0.90:
                end_type = SessionEndType.STOPPED
                duration = random.uniform(5.0, 20.0) # Worked for a bit then stopped
                is_completed = False
                rating = max(1, base_rating - 1) # Rating slightly lower due to interruption

            # Scenario C: "Discard/Restart" (Bad Session) - 10% chance
            else:
                end_type = SessionEndType.ABORTED
                duration = random.uniform(0.5, 10.0) # Short duration
                is_completed = False
                rating = None # Usually no rating on abort, or very low (1)
                
                # If aborted, sometimes we give it a 1-star rating to show frustration
                if random.random() > 0.5:
                    rating = 1

            # Create the Session Object
            s = PomodoroSession(
                user_id=USER_ID,
                task_id=target_task.id,
                start_time=start_time,
                end_time=start_time + timedelta(minutes=duration),
                duration_minutes=round(duration, 2),
                is_completed=is_completed,
                end_type=end_type,
                focus_rating=rating
            )
            sessions_db.append(s)

        db.add_all(sessions_db)
        db.commit()

        print(f"\n🎉 SUCCESS! Database Seeded with Matrix Logic.")
        print(f"   - Total Sessions: {len(sessions_db)}")
        print(f"   - Scenarios Included: COMPLETED (Normal), STOPPED (Pause), ABORTED (Discard)")

    except Exception as e:
        print(f"❌ ERROR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()