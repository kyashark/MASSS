# app/rl_engine/predictor.py

import os
import glob
from stable_baselines3 import PPO
from pathlib import Path
from app.engine.environment import StudentSchedulingEnv


from app.core.config import settings

MODEL_DIR = Path(settings.MODEL_DIR)


class RLScheduler:
    def __init__(self):
        self.model_loaded = False
        self.model = None
        self._load_latest_model()

    def _load_latest_model(self):
        """Finds and loads the newest trained PPO model."""
        try:
            list_of_files = glob.glob(os.path.join(MODEL_DIR, "*.zip"))
            if not list_of_files:
                print(
                    "⚠️ No RL models found. Scheduler will return empty until trained."
                )
                return

            latest_file = max(list_of_files, key=os.path.getctime)
            print(f"🧠 Loading latest Context-Aware Brain: {latest_file}")

            self.model = PPO.load(latest_file)
            self.model_loaded = True
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            self.model_loaded = False

    def predict(self, user_profile, tasks):
        """
        Generates a schedule by running a full day simulation.
        State space: 605 dimensions (50 tasks × 12 features + 5 env signals)
        """
        if not self.model_loaded:
            print("⚠️ Model not loaded. Returning empty schedule.")
            return []

        # 1. Initialize environment with real-time context
        env = StudentSchedulingEnv(user_profile, tasks)
        obs, _ = env.reset()
        done = False
        raw_schedule = []

        # 2. Decision Loop (Agent simulates the day)
        while not done:
            # deterministic=True ensures the AI makes the highest-probability choice
            action, _ = self.model.predict(obs, deterministic=True)
            obs, reward, done, _, info = env.step(action)

            # Only record if the action was valid (slot not full, task exists)
            if not info.get("valid", False):
                continue

            task_idx, slot_idx = action

            # task_idx 0 is reserved for "No-Op", so 1-50 are real tasks
            if task_idx > 0:
                real_idx = task_idx - 1
                if real_idx < len(tasks):
                    task = tasks[real_idx]
                    slot_name = ["Morning", "Afternoon", "Evening"][slot_idx]

                    # Resolve ID and Name safely
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

                    raw_schedule.append(
                        {
                            "task_id": t_id,
                            "task_name": t_name,
                            "slot": slot_name,
                            "action_type": "RL_DECISION",
                            "intensity_context": user_profile.get(
                                "work_intensity", 0.0
                            ),
                        }
                    )

        # 3. --- THE ALIGNMENT FIX: DEDUPLICATION ---
        # This ensures each task appears only ONCE per day in the total schedule.
        # This forces the agent to show the NEXT best tasks (aligning with your Action Card).
        seen = set()
        schedule = []
        for item in raw_schedule:
            if item["task_id"] not in seen:
                seen.add(item["task_id"])
                schedule.append(item)

        return schedule
