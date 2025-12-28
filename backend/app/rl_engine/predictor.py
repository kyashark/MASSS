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

        # 1. Spin up a simulation for this user
        env = StudentSchedulingEnv(user_profile, tasks)
        obs, _ = env.reset()
        
        schedule = []
        done = False
        
        # 2. Run the Episode
        while not done:
            action, _ = self.model.predict(obs, deterministic=True)
            obs, reward, done, _, _ = env.step(action)
            
            # 3. Decode Action
            task_idx, slot_idx = action
            if task_idx > 0: # Not No-Op
                real_idx = task_idx - 1
                if real_idx < len(tasks):
                    task = tasks[real_idx]
                    slot_name = ["Morning", "Afternoon", "Evening"][slot_idx]
                    
                    # Handle both Dict and Object for ID/Name
                    t_id = task.get('id') if isinstance(task, dict) else task.id
                    t_name = task.get('name') if isinstance(task, dict) else task.name

                    schedule.append({
                        "task_id": t_id,
                        "task_name": t_name,
                        "slot": slot_name,
                        "action_type": "RL_DECISION"
                    })
        return schedule