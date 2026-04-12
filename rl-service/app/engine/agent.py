import os
from datetime import datetime
from stable_baselines3 import PPO
from pathlib import Path
from app.engine.environment import StudentSchedulingEnv


from app.core.config import settings

MODEL_DIR = Path(settings.MODEL_DIR)


def train_agent(profiles: list = None):
    dummy_tasks = []
    for i in range(15):
        if i < 4:
            prio, diff, days, pomo, cat = "high", 4, 2, 2, "math_logic"  # ← lowercase
        elif i < 8:
            prio, diff, days, pomo, cat = "medium", 3, 7, 2, "coding"
        elif i < 12:
            prio, diff, days, pomo, cat = "low", 2, 20, 2, "memorization"
        else:
            prio, diff, days, pomo, cat = "medium", 2, 14, 2, "language"

        dummy_tasks.append(
            {
                "id": i,
                "name": f"Task {i}",
                "priority": prio,
                "difficulty": diff,
                "category": cat,
                "estimated_pomodoros": pomo,
                "sessions_count": 0,
                "days_until": days,
                "status": "pending",  # ← lowercase
            }
        )

    if profiles is None:
        profiles = [
            {
                "work_intensity": 0.9,
                "energy_map": {
                    "morning": 4.5,
                    "afternoon": 3.0,
                    "evening": 2.0,
                },  # ← lowercase
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

    for idx, profile in enumerate(profiles):
        print(f"\n{'=' * 50}")
        print(
            f"Training profile {idx + 1}/{len(profiles)}: best_slot={max(profile['energy_map'], key=profile['energy_map'].get)}"
        )

        env = StudentSchedulingEnv(profile, dummy_tasks)
        print(f"Observation space: {env.observation_space.shape}")

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

        model.learn(total_timesteps=100000, reset_num_timesteps=(idx == 0))

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    save_path = os.path.join(MODEL_DIR, f"ppo_scheduler_{timestamp}")
    model.save(save_path)
    print(f"\nModel saved: {save_path}")


if __name__ == "__main__":
    train_agent()
