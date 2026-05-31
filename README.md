# MASSS — Multi-Agent Adaptive Study Scheduling System

An adaptive study scheduling system that applies **Proximal Policy Optimization (PPO)** 
reinforcement learning to generate personalized daily study plans for university students.

## 🧠 What It Does

MASSS models daily academic scheduling as a Markov Decision Process (MDP), learning 
to assign study tasks to optimal time slots based on each student's chronotype, 
cognitive fatigue, and deadline urgency. Instead of static planners or rule-based 
schedulers, MASSS continuously learns from student behavior and adapts recommendations 
over time.

## 🔬 Why It's Novel

This is the **first known system** to apply reinforcement learning specifically to 
academic **time-slot allocation** — deciding *when* to study, not just *what* to study 
— while integrating:
- **Chronotype-based energy modelling** — aligning cognitively demanding tasks with 
each student's natural peak performance windows
- **Real-time cognitive fatigue estimation** — derived from Pomodoro session feedback 
without wearables
- **Confidence-weighted cold-start strategy** — providing useful schedules from day 
one before sufficient user history is accumulated

This research gap was formally identified across a systematic review of 184 
peer-reviewed publications (Riedmann et al., 2025).

## 📊 Key Results

| Metric | RL Agent | Heuristic Baseline |
|--------|----------|-------------------|
| Chronotype Alignment | **78%** | 34% |
| Urgency Compliance | **91%** | 88% |
| Scheduling Validity | **100%** | — |
| Explained Variance | **0.9793** | — |
| Mean Episode Reward | **148.69** | ~15-22% lower |

Training: 900,000 timesteps across 18 synthetic environments

## 🏗️ System Architecture

Three-layer microservice architecture:
Layer 1 — React Frontend
Dashboard | Schedule | Focus Timer | Insights
Layer 2 — Main Backend
FastAPI + PostgreSQL | Auth | Tasks | Sessions
Layer 3 — RL Microservice (internal only)
PPO Agent | StudentSchedulingEnv | State Builder | Analytics | Retraining

## 🛠️ Tech Stack

- **RL** — Proximal Policy Optimization (PPO), Stable-Baselines3, Gymnasium
- **Backend** — Python, FastAPI, PostgreSQL, SQLAlchemy
- **Queue** — Redis (async training sample buffer)
- **Frontend** — React 18, TanStack Query, Zustand, Recharts
- **ML** — 605-dimensional MDP state space, MultiDiscrete action space

## 🔑 Key Features

- 605-dimensional state space encoding up to 50 concurrent tasks
- 12-component reward function encoding chronobiology and scheduling theory
- 3-phase training pipeline — synthetic bootstrap → real data collection → online retraining
- Confidence-weighted cold-start blending (heuristic → RL over 10 sessions)
- 7-day model rollback window for safe deployment
- Dual backend support — FastAPI/PostgreSQL and Node.js/Express/MongoDB

## 📚 Research Background

Based on undergraduate dissertation:
**"Adaptive Study Scheduling via Proximal Policy Optimization: Integrating 
Chronotype and Cognitive Fatigue for University Students"**
S.N. Ilukwaththage — SLIIT, May 2026


