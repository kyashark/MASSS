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
rl_agent/
├── routers/
│   └── schedule.py             # API endpoints for scheduling requests
│
├── schemas/
│   └── schedule.py             # Data validation and Pydantic models
│
├── rl_engine/
│   ├── agent.py                # RL agent interaction logic
│   ├── analytics.py            # Performance logging and metrics
│   ├── config.py               # Hyperparameters and settings
│   ├── environment.py          # Simulation environment definition
│   ├── predictor.py            # Neural network architecture
│   ├── reward.py               # Reward calculation logic
│   └── state_builder.py        # Feature extraction and state prep
│
├── services/
│   ├── heuristic.py            # Rule-based baseline algorithm
│   └── scheduling.py           # Main scheduling orchestrator
│
├── reports/
│   └── report.txt              # Generated summary reports of scheduling tasks
│
├── scripts/
│   └── test_comparision.py     # Script to compare RL vs. Heuristic performance
│
├── rl_models/                  # Directory for saving trained model weights
└── rl_log/                     # Directory for training logs and history

```
## 📊 How to Test (The *Pepsi Challenge*)  
Once the server is running, you can compare the two scheduling strategie
#### **1. Get Heuristic Schedule**
```bash
  GET /api/schedule/heuristic
```
- *Result*: Strict ordering by Deadline. Efficient but rigid

#### **3. Get AI Schedule**
```bash
GET /api/schedule/rl
```
- *Result*: The AI dynamically orders tasks by priority and energy, focusing on high-value work even when deadlines are not immediate to improve long-term productivity



