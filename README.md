# Adaptive Student Task Scheduler using Reinforcement Learning
An intelligent, personalized study planner that fights procrastination by learning your energy patterns

## 📖 Project Overview
Traditional to-do lists are static. They don't care if you are tired, overwhelmed, or biased against Math. This project is a **Next-Generation Student Scheduler** that uses **Reinforcement Learning (RL)** to dynamically generate daily study plans.

Unlike standard planners that use fixed rules, this system **learns from the student**. By tracking Pomodoro sessions, focus ratings, and completion rates, the RL agent discovers
- *Is this student a Morning person or a Night owl?*
- *Do they underestimate how long Coding assignments take?*
- *Are they too fatigued to handle a Difficulty-5 Physics task right now?*

The system features a **Hybrid Architecture** that runs a **Greedy Heuristic** baseline alongside a **PPO Agent**, allowing for direct performance comparison (The **Pepsi Challenge**)


## 🚩 Key Features

### 1. AI Scheduler (RL Agent)
- Uses PPO reinforcement learning for personalized daily scheduling
- Adapts to fatigue and subject difficulty using recent focus data
- Learns subject-level strengths and weaknesses
- Avoids inefficient scheduling behaviors (reward hacking)

### 2. The Heuristic Baseline
- Priority + deadline–based greedy algorithm
- Efficiently fills time slots based on user capacity
- Serves as a baseline for performance comparison to demonstrate the AI scheduler’s improvement (Pepsi Challenge)

### 3. Smart Task Management
- Tasks are divided into 25-minute Pomodoro sessions
- In-progress tasks stay prioritized to maintain momentum
- Exam-linked tasks get higher urgency, while respecting sleep and class schedules


## 🏗️ Project Structure
```bash
project_root/
├── routers/
│   └── schedule.py             # API endpoints handling scheduling requests
│
├── schemas/
│   └── schedule.py             # Pydantic models for request/response validation
│
├── rl_engine/
│   ├── agent.py                # Main reinforcement learning agent logic
│   ├── analytics.py            # Tools for logging and visualizing performance
│   ├── config.py               # Hyperparameters and configuration settings
│   ├── environment.py          # Simulation environment for training
│   ├── predictor.py            # Neural network model architecture
│   ├── reward.py               # Logic for calculating agent rewards
│   └── state_builder.py        # Preprocesses raw data into state vectors
│
└── services/
    ├── heuristic.py            # Fallback rule-based scheduling algorithm
    └── scheduling.py           # Orchestrator integrating RL and heuristic methods
```
## 📊 How to Test (The **Pepsi Challenge*)  
