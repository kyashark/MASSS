import os
from datetime import datetime
from stable_baselines3 import PPO
from pathlib import Path
from app.engine.environment import StudentSchedulingEnv


from app.core.config import settings

MODEL_DIR = Path(settings.MODEL_DIR)


def train_agent(profiles: list = None):
    import random

    # Full task pool — 15 tasks
    all_dummy_tasks = []
    for i in range(15):
        if i < 4:
            prio, diff, days, pomo, cat = "high", 4, 2, 2, "math_logic"
        elif i < 8:
            prio, diff, days, pomo, cat = "medium", 3, 7, 2, "coding"
        elif i < 12:
            prio, diff, days, pomo, cat = "low", 2, 20, 2, "memorization"
        else:
            prio, diff, days, pomo, cat = "medium", 2, 14, 2, "language"

        all_dummy_tasks.append(
            {
                "id": i,
                "name": f"Task {i}",
                "priority": prio,
                "difficulty": diff,
                "category": cat,
                "estimated_pomodoros": pomo,
                "sessions_count": 0,
                "days_until": days,
                "status": "pending",
            }
        )

    if profiles is None:
        profiles = [
            {
                "work_intensity": 0.9,
                "energy_map": {"morning": 4.5, "afternoon": 3.0, "evening": 2.0},
                "recent_ratings": [4, 5, 4, 3, 4],
            },
            {
                "work_intensity": 0.5,
                "energy_map": {"morning": 2.5, "afternoon": 4.5, "evening": 3.0},
                "recent_ratings": [3, 3, 4, 4, 3],
            },
            {
                "work_intensity": 0.3,
                "energy_map": {"morning": 2.0, "afternoon": 3.0, "evening": 4.5},
                "recent_ratings": [2, 3, 3, 4, 5],
            },
        ]

    # ── Expand profiles to include small task count variants ──────────────────
    # For each profile, also train with 1, 2, 3, 5 task subsets
    # This teaches the model that valid indices can be small numbers
    expanded_profiles = []
    task_counts = [1, 2, 3, 5, 8, 15]

    for profile in profiles:
        for count in task_counts:
            subset = random.sample(all_dummy_tasks, min(count, len(all_dummy_tasks)))
            expanded_profiles.append(
                {
                    **profile,
                    "_task_subset": subset,
                }
            )

    for idx, profile in enumerate(expanded_profiles):
        task_subset = profile.pop("_task_subset", all_dummy_tasks)

        print(f"\n{'=' * 50}")
        print(
            f"Training profile {idx + 1}/{len(expanded_profiles)}: "
            f"tasks={len(task_subset)}, "
            f"best_slot={max(profile['energy_map'], key=profile['energy_map'].get)}"
        )

        env = StudentSchedulingEnv(profile, task_subset)

        if idx == 0:
            model = PPO(
                "MlpPolicy",
                env,
                verbose=1,
                learning_rate=0.0003,
                ent_coef=0.01,
                tensorboard_log="./rl_logs/",
            )
        else:
            model.set_env(env)

        model.learn(total_timesteps=50000, reset_num_timesteps=(idx == 0))

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    save_path = os.path.join(MODEL_DIR, f"ppo_scheduler_{timestamp}")
    model.save(save_path)
    print(f"\nModel saved: {save_path}")


if __name__ == "__main__":
    train_agent()
