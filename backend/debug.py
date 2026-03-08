"""
debug_rl.py — drop this in your project root and run:
    python debug_rl.py

It will tell you exactly why slots are empty.
"""

import sys, os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.rl_engine.analytics import UserAnalyticsService
from app.rl_engine.predictor import RLScheduler
from app.models.task import Task, TaskStatus

USER_ID = 1

db = SessionLocal()

print("=" * 60)
print("STEP 1 — Model status")
brain = RLScheduler()
print(f"  model_loaded : {brain.model_loaded}")
if brain.model:
    try:
        obs_space = brain.model.observation_space
        print(f"  model input shape : {obs_space.shape}")
    except:
        print("  could not read model obs space")

print()
print("STEP 2 — Task count in DB")
tasks = (
    db.query(Task)
    .filter(
        Task.user_id == USER_ID,
        Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]),
    )
    .all()
)
print(f"  PENDING/IN_PROGRESS tasks : {len(tasks)}")
for t in tasks:
    print(f"    id={t.id} name={t.name[:30]} priority={t.priority} status={t.status}")

print()
print("STEP 3 — Analytics context")
analytics = UserAnalyticsService(db, USER_ID)
user_context = analytics.build_rl_context()
print(f"  work_intensity : {user_context['work_intensity']:.3f}")
print(f"  energy_map     : {user_context['energy_map']}")
print(f"  capacity_map   : {user_context['capacity_map']}")

print()
print("STEP 4 — Raw predictor output (before dedup)")
if brain.model_loaded and tasks:
    from app.rl_engine.enviroment import StudentSchedulingEnv
    import numpy as np

    env = StudentSchedulingEnv(user_context, tasks)
    obs, _ = env.reset()
    print(f"  obs shape : {obs.shape}")
    print(f"  todays_capacity : {env.todays_capacity}")

    raw_actions = []
    done = False
    step = 0
    while not done and step < 30:
        action, _ = brain.model.predict(obs, deterministic=True)
        obs, reward, done, _, info = env.step(action)
        raw_actions.append(
            {
                "step": step,
                "task_idx": int(action[0]),
                "slot_idx": int(action[1]),
                "slot": ["Morning", "Afternoon", "Evening"][int(action[1])],
                "valid": info.get("valid"),
                "reward": round(reward, 2),
            }
        )
        step += 1

    print(f"  Total steps: {step}")
    for a in raw_actions:
        print(
            f"    step={a['step']} task={a['task_idx']} slot={a['slot']} valid={a['valid']} reward={a['reward']}"
        )
else:
    print("  Skipped — model not loaded or no tasks")

db.close()
