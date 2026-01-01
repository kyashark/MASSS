# rl_engine/predictor.py
import os
import glob
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
        """Finds the most recently created .zip file in the models folder"""
        try:
            # 1. Get all .zip files
            list_of_files = glob.glob(os.path.join(MODEL_DIR, "*.zip"))
            
            if not list_of_files:
                print("⚠️ No RL models found in /models folder. Using Heuristic.")
                return

            # 2. Find the newest one
            latest_file = max(list_of_files, key=os.path.getctime)
            print(f"🧠 Loading latest RL Brain: {latest_file}")
            
            # 3. Load it
            self.model = PPO.load(latest_file)
            self.model_loaded = True
            
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            self.model_loaded = False

    def predict(self, user_profile, tasks):
        if not self.model_loaded: return []

        env = StudentSchedulingEnv(user_profile, tasks)
        obs, _ = env.reset()
        
        schedule = []
        done = False
        
        while not done:
            action, _ = self.model.predict(obs, deterministic=True)
            
            # Get the 'info' dictionary to see if move was valid
            obs, reward, done, _, info = env.step(action)
            
            # --- FIX: CHECK VALIDITY ---
            # If the environment said "Invalid" or "Full", don't add to list.
            if not info.get("valid", False):
                continue 

            task_idx, slot_idx = action
            if task_idx > 0: 
                real_idx = task_idx - 1
                if real_idx < len(tasks):
                    task = tasks[real_idx]
                    slot_name = ["Morning", "Afternoon", "Evening"][slot_idx]
                    
                    t_id = task.get('id') if isinstance(task, dict) else task.id
                    t_name = task.get('name') if isinstance(task, dict) else task.name

                    schedule.append({
                        "task_id": t_id,
                        "task_name": t_name,
                        "slot": slot_name,
                        "action_type": "RL_DECISION"
                    })
        return schedule