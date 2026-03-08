"""
seed_db.py — Presentation-ready data for MASSS RL demo.

Run: python seed_db.py

Creates:
  - 4  Modules  (SE, ML, DB Systems, Technical Writing)
  - 4  Exams    (urgent → relaxed spread)
  - 12 Tasks    (mix of priority / deadline / progress)
  - 3  SlotPreferences (Morning peak)
  - 14 WeeklyRoutine events (realistic SLIIT timetable + sleep + habits)
  - 28 PomodoroSessions (14-day history — shows clear morning-person pattern)
"""

import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timedelta, time
from app.core.database import SessionLocal
from app.models.module import Module, Category, EnergyTime
from app.models.exam import Exam, ExamType
from app.models.task import Task, TaskStatus, PriorityLevel
from app.models.profile import (
    SlotPreference,
    SlotName,
    WeeklyRoutine,
    ActivityType,
    DayOfWeek,
)
from app.models.session import PomodoroSession, SessionEndType

USER_ID = 1
TODAY = datetime.now()


def sl_dt(offset_days=0, hour=9, minute=0):
    """Return a datetime at offset_days from today at hour:minute."""
    base = TODAY + timedelta(days=offset_days)
    return base.replace(hour=hour, minute=minute, second=0, microsecond=0)


def make_session(task_id, days_ago, hour, slot, end_type, focus, duration=25.0):
    start = sl_dt(offset_days=-days_ago, hour=hour)
    return PomodoroSession(
        user_id=USER_ID,
        task_id=task_id,
        start_time=start,
        end_time=start + timedelta(minutes=duration),
        duration_minutes=duration,
        is_completed=(end_type == SessionEndType.COMPLETED),
        focus_rating=focus,
        end_type=end_type,
        slot_type=slot,
    )


def routine(name, activity_type, day, start_h, start_m, end_h, end_m):
    return WeeklyRoutine(
        user_id=USER_ID,
        name=name,
        activity_type=activity_type,
        day_of_week=day,
        start_time=time(start_h, start_m),
        end_time=time(end_h, end_m),
    )


def seed():
    db = SessionLocal()
    try:
        # ── CLEAR ────────────────────────────────────────────────────────
        print("🧹  Clearing existing data for user_id=1 …")
        db.query(PomodoroSession).filter(PomodoroSession.user_id == USER_ID).delete()
        db.query(Task).filter(Task.user_id == USER_ID).delete()
        db.query(Exam).filter(Exam.user_id == USER_ID).delete()
        db.query(SlotPreference).filter(SlotPreference.user_id == USER_ID).delete()
        db.query(WeeklyRoutine).filter(WeeklyRoutine.user_id == USER_ID).delete()
        db.query(Module).filter(Module.user_id == USER_ID).delete()
        db.commit()

        # ── MODULES ──────────────────────────────────────────────────────
        print("📚  Seeding modules …")
        mod_se = Module(
            user_id=USER_ID,
            name="Software Engineering",
            category=Category.CODING,
            energy_time=EnergyTime.AFTERNOON,
            color="#3B82F6",
        )
        mod_ml = Module(
            user_id=USER_ID,
            name="Machine Learning",
            category=Category.MATH,
            energy_time=EnergyTime.MORNING,
            color="#8B5CF6",
        )
        mod_db = Module(
            user_id=USER_ID,
            name="Database Systems",
            category=Category.MEMORIZATION,
            energy_time=EnergyTime.EVENING,
            color="#F59E0B",
        )
        mod_tw = Module(
            user_id=USER_ID,
            name="Technical Writing",
            category=Category.LANGUAGE,
            energy_time=EnergyTime.AFTERNOON,
            color="#10B981",
        )
        db.add_all([mod_se, mod_ml, mod_db, mod_tw])
        db.flush()

        # ── EXAMS ────────────────────────────────────────────────────────
        print("📝  Seeding exams …")
        exam_db_quiz = Exam(
            user_id=USER_ID,
            name="DB Systems Quiz",
            exam_type=ExamType.QUIZ,
            module_id=mod_db.id,
            due_date=(TODAY + timedelta(days=2)).date(),
            weight=20,
            is_completed=False,
        )
        exam_ml_final = Exam(
            user_id=USER_ID,
            name="ML Final Exam",
            exam_type=ExamType.FINAL,
            module_id=mod_ml.id,
            due_date=(TODAY + timedelta(days=5)).date(),
            weight=40,
            is_completed=False,
        )
        exam_se_mid = Exam(
            user_id=USER_ID,
            name="SE Midterm",
            exam_type=ExamType.MIDTERM,
            module_id=mod_se.id,
            due_date=(TODAY + timedelta(days=12)).date(),
            weight=30,
            is_completed=False,
        )
        exam_tw_assign = Exam(
            user_id=USER_ID,
            name="Tech Writing Assignment",
            exam_type=ExamType.ASSIGNMENT,
            module_id=mod_tw.id,
            due_date=(TODAY + timedelta(days=20)).date(),
            weight=15,
            is_completed=False,
        )
        db.add_all([exam_db_quiz, exam_ml_final, exam_se_mid, exam_tw_assign])
        db.flush()

        # ── TASKS ─────────────────────────────────────────────────────────
        print("✅  Seeding tasks …")

        # HIGH — urgent exam links
        t1 = Task(
            user_id=USER_ID,
            name="Revise Regression Models",
            module_id=mod_ml.id,
            exam_id=exam_ml_final.id,
            priority=PriorityLevel.HIGH,
            difficulty=4,
            estimated_pomodoros=6,
            sessions_count=2,
            status=TaskStatus.IN_PROGRESS,
            deadline=None,
        )
        t2 = Task(
            user_id=USER_ID,
            name="Study Neural Networks",
            module_id=mod_ml.id,
            exam_id=exam_ml_final.id,
            priority=PriorityLevel.HIGH,
            difficulty=5,
            estimated_pomodoros=8,
            sessions_count=0,
            status=TaskStatus.PENDING,
            deadline=None,
        )
        t3 = Task(
            user_id=USER_ID,
            name="Memorise SQL Joins",
            module_id=mod_db.id,
            exam_id=exam_db_quiz.id,
            priority=PriorityLevel.HIGH,
            difficulty=3,
            estimated_pomodoros=4,
            sessions_count=3,
            status=TaskStatus.IN_PROGRESS,
            deadline=None,
        )
        t11 = Task(
            user_id=USER_ID,
            name="Practice DB Past Papers",
            module_id=mod_db.id,
            exam_id=exam_db_quiz.id,
            priority=PriorityLevel.HIGH,
            difficulty=3,
            estimated_pomodoros=4,
            sessions_count=0,
            status=TaskStatus.PENDING,
            deadline=None,
        )

        # MEDIUM — own deadlines or exam linked
        t4 = Task(
            user_id=USER_ID,
            name="Implement REST API",
            module_id=mod_se.id,
            exam_id=exam_se_mid.id,
            priority=PriorityLevel.MEDIUM,
            difficulty=3,
            estimated_pomodoros=5,
            sessions_count=1,
            status=TaskStatus.IN_PROGRESS,
            deadline=TODAY + timedelta(days=10),
        )
        t5 = Task(
            user_id=USER_ID,
            name="Write Unit Tests",
            module_id=mod_se.id,
            exam_id=None,
            priority=PriorityLevel.MEDIUM,
            difficulty=2,
            estimated_pomodoros=3,
            sessions_count=0,
            status=TaskStatus.PENDING,
            deadline=TODAY + timedelta(days=7),
        )
        t6 = Task(
            user_id=USER_ID,
            name="DB Normalisation Practice",
            module_id=mod_db.id,
            exam_id=exam_db_quiz.id,
            priority=PriorityLevel.MEDIUM,
            difficulty=3,
            estimated_pomodoros=3,
            sessions_count=0,
            status=TaskStatus.PENDING,
            deadline=None,
        )
        t7 = Task(
            user_id=USER_ID,
            name="Read Research Papers",
            module_id=mod_tw.id,
            exam_id=None,
            priority=PriorityLevel.MEDIUM,
            difficulty=2,
            estimated_pomodoros=4,
            sessions_count=0,
            status=TaskStatus.PENDING,
            deadline=None,
        )
        t8 = Task(
            user_id=USER_ID,
            name="Draft Technical Report",
            module_id=mod_tw.id,
            exam_id=exam_tw_assign.id,
            priority=PriorityLevel.MEDIUM,
            difficulty=2,
            estimated_pomodoros=5,
            sessions_count=1,
            status=TaskStatus.IN_PROGRESS,
            deadline=None,
        )

        # LOW
        t9 = Task(
            user_id=USER_ID,
            name="Refactor Codebase",
            module_id=mod_se.id,
            exam_id=None,
            priority=PriorityLevel.LOW,
            difficulty=2,
            estimated_pomodoros=4,
            sessions_count=0,
            status=TaskStatus.PENDING,
            deadline=TODAY + timedelta(days=21),
        )
        t10 = Task(
            user_id=USER_ID,
            name="Review ML Lecture Slides",
            module_id=mod_ml.id,
            exam_id=exam_ml_final.id,
            priority=PriorityLevel.LOW,
            difficulty=1,
            estimated_pomodoros=2,
            sessions_count=0,
            status=TaskStatus.PENDING,
            deadline=None,
        )
        t12 = Task(
            user_id=USER_ID,
            name="Explore Docker Deployment",
            module_id=mod_se.id,
            exam_id=None,
            priority=PriorityLevel.LOW,
            difficulty=3,
            estimated_pomodoros=3,
            sessions_count=0,
            status=TaskStatus.PENDING,
            deadline=None,
        )

        db.add_all([t1, t2, t3, t4, t5, t6, t7, t8, t9, t10, t11, t12])
        db.flush()

        # ── SLOT PREFERENCES ─────────────────────────────────────────────
        print("🕐  Seeding slot preferences …")
        db.add_all(
            [
                SlotPreference(
                    user_id=USER_ID,
                    slot_name=SlotName.MORNING,
                    max_pomodoros=4,
                    inferred_energy_score=0.82,
                    is_preferred=True,
                ),
                SlotPreference(
                    user_id=USER_ID,
                    slot_name=SlotName.AFTERNOON,
                    max_pomodoros=3,
                    inferred_energy_score=0.61,
                    is_preferred=False,
                ),
                SlotPreference(
                    user_id=USER_ID,
                    slot_name=SlotName.EVENING,
                    max_pomodoros=2,
                    inferred_energy_score=0.42,
                    is_preferred=False,
                ),
            ]
        )
        db.flush()

        # ── WEEKLY ROUTINE ────────────────────────────────────────────────
        # Realistic SLIIT undergraduate timetable.
        # — 2hr ML lecture Monday morning   → post-class fatigue fires Mon afternoon
        # — 3hr SE lab Wednesday afternoon  → heaviest fatigue trigger
        # — DB lecture Tuesday + Thursday
        # — Sleep blocks every day (shows up in timeline bar)
        # — Gym habit Mon/Wed/Fri morning
        print("📅  Seeding weekly routine …")

        weekly = [
            # ── SLEEP (every day) ────────────────────────────────────────
            routine("Sleep", ActivityType.SLEEP, DayOfWeek.MONDAY, 0, 0, 6, 30),
            routine("Sleep", ActivityType.SLEEP, DayOfWeek.TUESDAY, 0, 0, 6, 30),
            routine("Sleep", ActivityType.SLEEP, DayOfWeek.WEDNESDAY, 0, 0, 6, 30),
            routine("Sleep", ActivityType.SLEEP, DayOfWeek.THURSDAY, 0, 0, 6, 30),
            routine("Sleep", ActivityType.SLEEP, DayOfWeek.FRIDAY, 0, 0, 6, 30),
            routine("Sleep", ActivityType.SLEEP, DayOfWeek.SATURDAY, 0, 0, 7, 30),
            routine("Sleep", ActivityType.SLEEP, DayOfWeek.SUNDAY, 0, 0, 7, 30),
            # ── HABITS ───────────────────────────────────────────────────
            routine("Gym", ActivityType.HABIT, DayOfWeek.MONDAY, 6, 30, 7, 30),
            routine("Gym", ActivityType.HABIT, DayOfWeek.WEDNESDAY, 6, 30, 7, 30),
            routine("Gym", ActivityType.HABIT, DayOfWeek.FRIDAY, 6, 30, 7, 30),
            # ── CLASSES ──────────────────────────────────────────────────
            # Monday: 2hr ML lecture (08:00–10:00) → post-class fatigue demo
            routine(
                "Machine Learning Lecture",
                ActivityType.CLASS,
                DayOfWeek.MONDAY,
                8,
                0,
                10,
                0,
            ),
            # Tuesday: 1.5hr DB lecture (09:00–10:30)
            routine(
                "Database Systems Lecture",
                ActivityType.CLASS,
                DayOfWeek.TUESDAY,
                9,
                0,
                10,
                30,
            ),
            # Wednesday: 3hr SE lab (13:00–16:00) → HEAVIEST fatigue trigger
            routine(
                "Software Engineering Lab",
                ActivityType.CLASS,
                DayOfWeek.WEDNESDAY,
                13,
                0,
                16,
                0,
            ),
            # Thursday: 1.5hr DB lecture again
            routine(
                "Database Systems Lecture",
                ActivityType.CLASS,
                DayOfWeek.THURSDAY,
                9,
                0,
                10,
                30,
            ),
            # Friday: 1hr Technical Writing (10:00–11:00)
            routine(
                "Technical Writing Lecture",
                ActivityType.CLASS,
                DayOfWeek.FRIDAY,
                10,
                0,
                11,
                0,
            ),
        ]

        db.add_all(weekly)
        db.flush()

        # ── POMODORO SESSIONS (28 sessions, 14-day history) ───────────────
        # Pattern clearly shows:
        #   Morning  → focus 4–5 (high)   ← student is a morning person
        #   Afternoon → focus 3–4 (medium)
        #   Evening   → focus 2–3 (low)   ← tired after a day of classes
        print("🍅  Seeding pomodoro sessions …")

        sessions = []

        # ── MORNING (focus 4–5) ──────────────────────────────────────────
        morning = [
            # (task, days_ago, hour, focus, duration, end_type)
            (t1.id, 1, 8, 5, 25.0, SessionEndType.COMPLETED),
            (t1.id, 2, 9, 4, 25.0, SessionEndType.COMPLETED),
            (t3.id, 3, 7, 5, 25.0, SessionEndType.COMPLETED),
            (t3.id, 4, 8, 4, 25.0, SessionEndType.COMPLETED),
            (t3.id, 5, 9, 5, 25.0, SessionEndType.COMPLETED),
            (t4.id, 6, 8, 4, 25.0, SessionEndType.COMPLETED),
            (t5.id, 7, 7, 5, 25.0, SessionEndType.COMPLETED),
            (t2.id, 8, 9, 4, 25.0, SessionEndType.COMPLETED),
            (t11.id, 9, 8, 5, 25.0, SessionEndType.COMPLETED),
            (t1.id, 10, 7, 4, 25.0, SessionEndType.COMPLETED),
        ]
        for task_id, days, hour, focus, dur, et in morning:
            sessions.append(
                make_session(task_id, days, hour, "Morning", et, focus, dur)
            )

        # ── AFTERNOON (focus 3–4) ────────────────────────────────────────
        afternoon = [
            (t4.id, 1, 13, 3, 25.0, SessionEndType.COMPLETED),
            (t8.id, 2, 14, 4, 25.0, SessionEndType.COMPLETED),
            (t7.id, 3, 13, 3, 18.0, SessionEndType.STOPPED),
            (t6.id, 4, 15, 3, 25.0, SessionEndType.COMPLETED),
            (t9.id, 5, 14, 3, 25.0, SessionEndType.COMPLETED),
            (t8.id, 7, 13, 4, 25.0, SessionEndType.COMPLETED),
            (t4.id, 9, 14, 3, 25.0, SessionEndType.COMPLETED),
        ]
        for task_id, days, hour, focus, dur, et in afternoon:
            sessions.append(
                make_session(task_id, days, hour, "Afternoon", et, focus, dur)
            )

        # ── EVENING (focus 2–3, some abandoned) ──────────────────────────
        evening = [
            (t10.id, 1, 20, 2, 15.0, SessionEndType.STOPPED),
            (t7.id, 2, 21, 3, 25.0, SessionEndType.COMPLETED),
            (t11.id, 3, 19, 2, 8.0, SessionEndType.ABORTED),
            (t12.id, 4, 20, 2, 12.0, SessionEndType.STOPPED),
            (t8.id, 5, 21, 3, 25.0, SessionEndType.COMPLETED),
            (t6.id, 6, 19, 2, 20.0, SessionEndType.STOPPED),
            (t3.id, 7, 20, 3, 25.0, SessionEndType.COMPLETED),
            (t10.id, 9, 21, 2, 15.0, SessionEndType.STOPPED),
            (t12.id, 11, 20, 2, 10.0, SessionEndType.ABORTED),
            (t7.id, 13, 19, 3, 25.0, SessionEndType.COMPLETED),
            (t9.id, 14, 20, 2, 25.0, SessionEndType.COMPLETED),
        ]
        for task_id, days, hour, focus, dur, et in evening:
            sessions.append(
                make_session(task_id, days, hour, "Evening", et, focus, dur)
            )

        db.add_all(sessions)
        db.commit()

        # ── SUMMARY ──────────────────────────────────────────────────────
        morning_ct = len(morning)
        afternoon_ct = len(afternoon)
        evening_ct = len(evening)

        print("\n✅  Seed complete!")
        print(f"   Modules:          4")
        print(f"   Exams:            4  →  2d / 5d / 12d / 20d")
        print(f"   Tasks:           12  →  4 HIGH · 5 MEDIUM · 3 LOW")
        print(f"                         4 IN_PROGRESS · 8 PENDING")
        print(
            f"   Slot prefs:       3  →  Morning=0.82★ · Afternoon=0.61 · Evening=0.42"
        )
        print(
            f"   Weekly routine:  {len(weekly):>2}  →  7 Sleep · 3 Gym · 5 Class lectures/labs"
        )
        print(
            f"   Sessions:        {len(sessions):>2}  →  {morning_ct} Morning · {afternoon_ct} Afternoon · {evening_ct} Evening"
        )
        print()
        print("Post-class fatigue will fire on:")
        print("  Monday    → after 08:00–10:00 ML Lecture   (intensity 1.0, 2hr)")
        print("  Tuesday   → after 09:00–10:30 DB Lecture   (intensity 1.0, 1.5hr)")
        print(
            "  Wednesday → after 13:00–16:00 SE Lab       (intensity 1.0, 3hr)  ← HEAVIEST"
        )
        print("  Thursday  → after 09:00–10:30 DB Lecture   (intensity 1.0, 1.5hr)")
        print("  Friday    → after 10:00–11:00 TW Lecture   (intensity 1.0, 1hr)")
        print()
        print("Expected RL slot assignments:")
        print("  Morning   → HIGH priority + urgent exam tasks (energy 0.82)")
        print("  Afternoon → MEDIUM coding / writing tasks     (energy 0.61)")
        print("  Evening   → LOW priority / memorisation       (energy 0.42)")

    except Exception as e:
        db.rollback()
        print(f"\n❌  Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
