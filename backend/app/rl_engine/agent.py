
"""
RL agent / trainer.

Implements a standard Proximal Policy Optimization (PPO) algorithm.

"""
import os
from datetime import datetime
from stable_baselines3 import PPO
from pathlib import Path
from app.rl_engine.enviroment import StudentSchedulingEnv

# Define where models live
# MODEL_DIR = "/rl_models" # Adjust path if your structure is different


# --- PATH SETUP ---
# 1. Get location of this file (backend/app/rl_engine/agent.py)
current_file = Path(__file__).resolve()

# 2. Go up 3 levels to reach 'backend'
#    .parent (rl_engine) -> .parent (app) -> .parent (backend)
PROJECT_ROOT = current_file.parent.parent.parent

# 3. Define the sibling folder
MODEL_DIR = PROJECT_ROOT / "rl_models"

# 4. Auto-create directory if missing
os.makedirs(MODEL_DIR, exist_ok=True)



def train_agent():
    # 1. Create Dummy Data (Use your Mock DB logic here)
    dummy_tasks = [
        {'id': i, 'priority': 'HIGH', 'difficulty': 5, 'category': 'Math'} 
        for i in range(10)
    ]
    dummy_profile = {}

    # 2. Init Environment
    env = StudentSchedulingEnv(dummy_profile, dummy_tasks)
    
    # 3. Create Model
    model = PPO("MlpPolicy", env, verbose=1, learning_rate=0.0003,tensorboard_log="./rl_logs/")
    
    # 4. Train
    print("Training RL Agent...")
    model.learn(total_timesteps=50000)

    # 4. SAVE WITH TIMESTAMP
    # Format: ppo_scheduler_YYYYMMDD_HHMMSS
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    save_path = os.path.join(MODEL_DIR, f"ppo_scheduler_{timestamp}")
    
    # 5. Save
    model.save(save_path)
    print("Model Saved!")

if __name__ == "__main__":
    train_agent()