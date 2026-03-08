import os
from datetime import datetime
from stable_baselines3 import PPO
from pathlib import Path
from app.rl_engine.enviroment import StudentSchedulingEnv

current_file = Path(__file__).resolve()
PROJECT_ROOT = current_file.parent.parent.parent
MODEL_DIR = PROJECT_ROOT / "rl_models"
os.makedirs(MODEL_DIR, exist_ok=True)


def train_agent():
    dummy_tasks = []
    for i in range(15):
        if i < 4:
            prio, diff, days, pomo, cat = "HIGH", 4, 2, 2, "Math/Logic"
        elif i < 8:
            prio, diff, days, pomo, cat = "MEDIUM", 3, 7, 2, "Coding"
        elif i < 12:
            prio, diff, days, pomo, cat = "LOW", 2, 20, 2, "Memorization"
        else:
            prio, diff, days, pomo, cat = "MEDIUM", 2, 14, 2, "Language"

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
                "status": "PENDING",
            }
        )

    profiles = [
        {  # Morning person
            "work_intensity": 0.9,
            "energy_map": {"Morning": 4.5, "Afternoon": 3.0, "Evening": 2.0},
            "recent_ratings": [4, 5, 4, 3, 4],
        },
        {  # Afternoon person
            "work_intensity": 0.5,
            "energy_map": {"Morning": 2.5, "Afternoon": 4.5, "Evening": 3.0},
            "recent_ratings": [3, 3, 4, 4, 3],
        },
        {  # Evening person
            "work_intensity": 0.3,
            "energy_map": {"Morning": 2.0, "Afternoon": 3.0, "Evening": 4.5},
            "recent_ratings": [2, 3, 3, 4, 5],
        },
    ]

    for idx, profile in enumerate(profiles):
        print(f"\n{'=' * 50}")
        print(
            f"Training profile {idx + 1}/3: best_slot={max(profile['energy_map'], key=profile['energy_map'].get)}"
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
