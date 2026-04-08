from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class ScheduledTaskOutput(BaseModel):
    task_id: int
    task_name: str
    slot: str
    allocation_type: str  # RL_DECISION or STICKY_RULE
    days_until_deadline: Optional[int] = None
    deadline_source: Optional[str] = None


class ScheduleResponse(BaseModel):
    Morning: List[ScheduledTaskOutput] = []
    Afternoon: List[ScheduledTaskOutput] = []
    Evening: List[ScheduledTaskOutput] = []
    strategy_used: str  # RL_PPO or HEURISTIC_FALLBACK
    work_intensity: float


class SignalBreakdown(BaseModel):
    completion_proximity: float
    slot_bias: float
    momentum: float
    urgency: float
    category_bias: float


class RecommendedTask(BaseModel):
    task_id: int
    task_name: str
    category: str
    priority: str
    difficulty: int
    probability: int
    signals: SignalBreakdown
    sessions_count: int
    estimated_pomodoros: int
    days_until_deadline: Optional[int] = None
    deadline_source: Optional[str] = None
    slot: str
    is_crunch: bool
    work_intensity: float
    cognitive_fatigue: float


class RecommendResponse(BaseModel):
    recommendation: Optional[RecommendedTask] = None
    error: Optional[str] = None


class EnergySlot(BaseModel):
    score: float
    label: str  # HIGH, MEDIUM, or LOW


class StateResponse(BaseModel):
    cognitive_fatigue: float
    cognitive_label: str  # FRESH, FATIGUING, or BURNOUT RISK
    is_live_slot: bool
    live_slot_name: str
    slot_fatigue: Dict[str, float]
    workload_intensity: float
    focus_history: List[float]
    energy_battery: Dict[str, EnergySlot]
    category_strengths: Dict[str, float]
    trend: str  # Positive, Declining, or Neutral
    active_slot: str
    post_class_fatigue: float
    class_event_name: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_name: Optional[str] = None
