"""


This is a debug/test file to verify that your environment works.

Typical workflow: before plugging your environment into PPO, you want to make sure:

reset() works
step() works
Action space and observation shapes are correct
Rewards are reasonable

This is exactly what this file does.


For testing/debugging your environment

"""

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