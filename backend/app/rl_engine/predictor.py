import os
import glob

# import numpy as np
from stable_baselines3 import PPO
from pathlib import Path
from app.rl_engine.enviroment import StudentSchedulingEnv

# --- PATH SETUP ---
current_file = Path(__file__).resolve()
PROJECT_ROOT = current_file.parent.parent.parent
MODEL_DIR = PROJECT_ROOT / "rl_models"


class RLScheduler:
    def __init__(self):
        self.model_loaded = False
        self.model = None
        self._load_latest_model()

    def _load_latest_model(self):
        """Finds and loads the newest PPO model."""
        try:
            list_of_files = glob.glob(os.path.join(MODEL_DIR, "*.zip"))

            if not list_of_files:
                print(
                    "⚠️ No RL models found. Scheduler will return empty until trained."
                )
                return

            latest_file = max(list_of_files, key=os.path.getctime)
            print(f"🧠 Loading latest Context-Aware Brain: {latest_file}")

            # Load the model
            self.model = PPO.load(latest_file)
            self.model_loaded = True

        except Exception as e:
            print(f"❌ Error loading model: {e}")
            self.model_loaded = False

    def predict(self, user_profile, tasks):
        """
        Generates a schedule by running a full day simulation.
        The AI now sees 'work_intensity' via the environment reset.
        """
        if not self.model_loaded:
            print("⚠️ Model not loaded. Returning empty schedule.")
            return []

        # 1. Init environment with the fresh user profile (Intensity + Energy)
        env = StudentSchedulingEnv(user_profile, tasks)

        # 2. Reset (This triggers the 555-dimension observation)
        obs, _ = env.reset()

        schedule = []
        done = False

        # 3. Decision Loop (The AI "plays" the day)
        while not done:
            # Deterministic=True ensures the AI makes the "best" choice
            action, _ = self.model.predict(obs, deterministic=True)

            # obs now contains the 555-dimension state including Intensity
            obs, reward, done, _, info = env.step(action)

            # Check validity (don't schedule if slot is full or task is done)
            if not info.get("valid", False):
                continue

            task_idx, slot_idx = action

            # task_idx 0 is "No-Op", so we only add 1-50
            if task_idx > 0:
                real_idx = task_idx - 1
                if real_idx < len(tasks):
                    task = tasks[real_idx]
                    slot_name = ["Morning", "Afternoon", "Evening"][slot_idx]

                    t_id = (
                        task.get("id")
                        if isinstance(task, dict)
                        else getattr(task, "id", None)
                    )
                    t_name = (
                        task.get("name")
                        if isinstance(task, dict)
                        else getattr(task, "name", "Unnamed Task")
                    )

                    schedule.append(
                        {
                            "task_id": t_id,
                            "task_name": t_name,
                            "slot": slot_name,
                            "action_type": "RL_DECISION",
                            "intensity_context": user_profile.get(
                                "work_intensity", 0.0
                            ),  # For UI feedback
                        }
                    )

        return schedule
