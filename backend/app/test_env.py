# test_env.py
from app.rl_engine.enviroment import StudentSchedulingEnv

# Dummy Data
tasks = [{'id': 1, 'priority': 'HIGH', 'difficulty': 5}, {'id': 2, 'priority': 'LOW', 'difficulty': 1}]
profile = {}

# Init Environment
env = StudentSchedulingEnv(profile, tasks)

# Reset
obs, info = env.reset()
print("Initial Observation Shape:", obs.shape)

# Take a random action
action = env.action_space.sample()
print("Random Action:", action)

# Step
obs, reward, term, trunc, info = env.step(action)
print(f"Reward: {reward}, Terminated: {term}")