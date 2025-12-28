# rl_engine/predictor.py
from stable_baselines3 import PPO
from app.rl_engine.enviroment import StudentSchedulingEnv

class RLScheduler:
    def __init__(self, model_path="ppo_scheduler_v2"):
        self.model_loaded = False
        try:
            # We assume the file is ppo_scheduler_v2.zip
            self.model = PPO.load(model_path)
            self.model_loaded = True
            print("✅ RL Model Loaded Successfully")
        except Exception as e:
            print(f"⚠️ RL Model not found: {e}. Using Heuristic Fallback.")

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