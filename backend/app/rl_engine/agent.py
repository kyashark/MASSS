import os
from datetime import datetime
from stable_baselines3 import PPO
from pathlib import Path
from app.rl_engine.enviroment import StudentSchedulingEnv

# --- PATH SETUP ---
current_file = Path(__file__).resolve()
PROJECT_ROOT = current_file.parent.parent.parent
MODEL_DIR = PROJECT_ROOT / "rl_models"
os.makedirs(MODEL_DIR, exist_ok=True)


def train_agent():
    # 1. UPDATED: Create Rich Dummy Data
    # To learn the "Crunch Logic," the agent needs to see intensity and energy in training
    dummy_tasks = [
        {
            "id": i,
            "title": f"Task {i}",
            "priority": "HIGH" if i < 3 else "LOW",
            "difficulty": 4 if i < 5 else 2,
            "category": "Math" if i < 5 else "Coding",
            "estimated_pomodoros": 4,
            "sessions_count": 0,
            "days_until": 2 if i < 3 else 14,  # Some urgent, some not
        }
        for i in range(10)
    ]

    # New: Add the Intensity and Energy Map to the profile
    dummy_profile = {
        "work_intensity": 0.9,  # Start training in "Crunch Mode" to teach urgency
        "energy_map": {"Morning": 4.0, "Afternoon": 3.0, "Evening": 2.5},
        "recent_ratings": [4, 3, 2, 3, 4],
    }

    # 2. Init Environment
    # The Env now automatically pulls 555 dimensions because of our StateBuilder update
    env = StudentSchedulingEnv(dummy_profile, dummy_tasks)

    # 3. Create Model
    # Policy: MlpPolicy (Multi-Layer Perceptron)
    # The model will automatically detect the 555-dim input from env.observation_space
    model = PPO(
        "MlpPolicy", env, verbose=1, learning_rate=0.0003, tensorboard_log="./rl_logs/"
    )

    # 4. Train
    print("Training RL Agent with 555-dimension state space...")
    print(f"Observation space: {env.observation_space.shape}")  # Should show (555,)

    # We use 50k timesteps to allow the agent to discover the intensity patterns
    model.learn(total_timesteps=50000)

    # 5. SAVE WITH TIMESTAMP
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    save_path = os.path.join(MODEL_DIR, f"ppo_scheduler_{timestamp}")

    model.save(save_path)
    print(f"Model Saved at: {save_path}")


if __name__ == "__main__":
    train_agent()
