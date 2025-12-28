
"""
RL agent / trainer.

Implements a standard Proximal Policy Optimization (PPO) algorithm.

"""

from stable_baselines3 import PPO
from rl_engine.enviroment import StudentSchedulingEnv

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
    model = PPO("MlpPolicy", env, verbose=1, learning_rate=0.0003)
    
    # 4. Train
    print("Training RL Agent...")
    model.learn(total_timesteps=50000)
    
    # 5. Save
    model.save("ppo_scheduler_v2")
    print("Model Saved!")

if __name__ == "__main__":
    train_agent()