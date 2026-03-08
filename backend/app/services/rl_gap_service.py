"""
app/services/rl_gap_service.py
------------------------------------
Card 6: Say vs Do Gap

The central research card. Answers:
  "Does the student follow the AI's recommendation —
   and when they don't, are they better or worse off?"

APPROACH — Retroactive Alignment Scoring
-----------------------------------------
We cannot store what was recommended at the exact moment each past session
was started (no recommendation log table). Instead we use retroactive
alignment: for each recent session we ask "was the task the student chose
within the agent's current top-N recommendations for that slot?"

This is scientifically valid because we're measuring behavioural alignment
between student choices and agent policy — not a temporal causal claim.

For the research narrative this answers:
  "Students who chose tasks aligned with the agent's recommendations
   received X% higher reward on average than students who overrode it."

THREE OUTPUTS:
1. alignment_history  — per-session record: followed | override + reward
2. gap_stats          — aggregate: follow rate, avg reward delta, top ignored tasks
3. reward_comparison  — side-by-side avg reward breakdown: followed vs override
"""

from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta
from math import exp

from app.models.session import PomodoroSession, SessionEndType
from app.models.task import Task
from app.rl_engine.analytics import (
    UserAnalyticsService,
    get_effective_days_until,
    get_effective_deadline,
)
from app.rl_engine.config import RLConfig

SLOT_HOURS = {
    "Morning": (6, 12),
    "Afternoon": (12, 18),
    "Evening": (18, 24),
}

# A session is "followed" if the student's task is in top-N agent recommendations
FOLLOW_TOP_N = 3
HISTORY_LIMIT = 20  # look at last 20 sessions


class RLGapService:
    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id
        self.cfg = RLConfig()
        self.analytics = UserAnalyticsService(db, user_id)
        self.now = datetime.now()

    # ─────────────────────────────────────────────────────────────────────────
    # PUBLIC
    # ─────────────────────────────────────────────────────────────────────────

    def get_gap_analysis(self, active_slot: str = "Morning") -> dict:
        sessions = self._fetch_recent_sessions()
        if not sessions:
            return self._empty_response()

        # Current top recommendations per slot (used for alignment check)
        rec_map = self._build_recommendation_map()

        history = self._build_alignment_history(sessions, rec_map)
        gap_stats = self._compute_gap_stats(history)
        comparison = self._compute_reward_comparison(history)

        return {
            "alignment_history": history,
            "gap_stats": gap_stats,
            "reward_comparison": comparison,
            "active_slot": active_slot,
            "total_sessions": len(history),
            "generated_at": self.now.isoformat(),
        }

    # ─────────────────────────────────────────────────────────────────────────
    # STEP 1 — build recommendation map (top-N task IDs per slot)
    # ─────────────────────────────────────────────────────────────────────────

    def _build_recommendation_map(self) -> dict[str, list[int]]:
        """
        Returns {slot_name: [top_N task_ids]} for each slot.
        Calls RLActionService — same source as Card 2.
        """
        from app.services.rl_action_service import RLActionService

        svc = RLActionService(self.db, self.user_id)
        result = {}
        for slot in SLOT_HOURS:
            try:
                dist = svc.get_action_distribution(slot)
                actions = dist.get("actions", [])
                result[slot] = [a["task_id"] for a in actions[:FOLLOW_TOP_N]]
            except Exception:
                result[slot] = []
        return result

    # ─────────────────────────────────────────────────────────────────────────
    # STEP 2 — build per-session alignment + reward
    # ─────────────────────────────────────────────────────────────────────────

    def _build_alignment_history(self, sessions: list, rec_map: dict) -> list[dict]:
        history = []
        for s in sessions:
            if not s.task or not s.end_time:
                continue

            slot = self._resolve_slot(s)
            top_ids = rec_map.get(slot, [])
            is_followed = s.task_id in top_ids

            # Rank of student's actual choice in the recommendation list
            rank = None
            if s.task_id in top_ids:
                rank = top_ids.index(s.task_id) + 1  # 1-indexed

            reward = self._compute_session_reward(s)
            end_type = (
                s.end_type.value if hasattr(s.end_type, "value") else str(s.end_type)
            )
            priority = self._priority_str(s.task)

            history.append(
                {
                    "session_id": s.id,
                    "task_id": s.task_id,
                    "task_name": s.task.name,
                    "slot": slot,
                    "started_at": s.start_time.isoformat() if s.start_time else None,
                    "end_type": end_type,
                    "focus_rating": s.focus_rating,
                    "duration_minutes": s.duration_minutes or 0,
                    "priority": priority,
                    # Alignment
                    "alignment": "followed" if is_followed else "override",
                    "agent_rank": rank,  # None if not in top-N
                    # Reward
                    "total_reward": reward["total"],
                    "reward_breakdown": reward,
                }
            )

        return history

    # ─────────────────────────────────────────────────────────────────────────
    # STEP 3 — aggregate gap stats
    # ─────────────────────────────────────────────────────────────────────────

    def _compute_gap_stats(self, history: list) -> dict:
        followed = [h for h in history if h["alignment"] == "followed"]
        overrides = [h for h in history if h["alignment"] == "override"]

        follow_rate = round(len(followed) / len(history) * 100) if history else 0

        avg_reward_followed = self._avg_reward(followed)
        avg_reward_override = self._avg_reward(overrides)
        reward_delta = round(avg_reward_followed - avg_reward_override, 2)

        # Which tasks are consistently overridden (appear in override list most)
        override_counts: dict[str, int] = {}
        for h in overrides:
            key = h["task_name"]
            override_counts[key] = override_counts.get(key, 0) + 1
        top_ignored = sorted(override_counts.items(), key=lambda x: -x[1])[:3]

        # Focus quality comparison
        avg_focus_followed = self._avg_focus(followed)
        avg_focus_override = self._avg_focus(overrides)

        # Completion rate comparison
        completed_followed = sum(1 for h in followed if h["end_type"] == "COMPLETED")
        completed_override = sum(1 for h in overrides if h["end_type"] == "COMPLETED")
        completion_followed = (
            round(completed_followed / len(followed) * 100) if followed else 0
        )
        completion_override = (
            round(completed_override / len(overrides) * 100) if overrides else 0
        )

        return {
            "follow_count": len(followed),
            "override_count": len(overrides),
            "follow_rate": follow_rate,
            "avg_reward_followed": avg_reward_followed,
            "avg_reward_override": avg_reward_override,
            "reward_delta": reward_delta,
            "agent_advantage": reward_delta > 0,  # True = following agent pays off
            "avg_focus_followed": avg_focus_followed,
            "avg_focus_override": avg_focus_override,
            "completion_followed": completion_followed,
            "completion_override": completion_override,
            "top_ignored_tasks": [{"name": n, "count": c} for n, c in top_ignored],
        }

    # ─────────────────────────────────────────────────────────────────────────
    # STEP 4 — side-by-side reward breakdown comparison
    # ─────────────────────────────────────────────────────────────────────────

    def _compute_reward_comparison(self, history: list) -> dict:
        """
        Averages each reward component across followed vs override sessions.
        Lets the card show exactly WHERE the gap comes from.
        """
        followed = [h for h in history if h["alignment"] == "followed"]
        overrides = [h for h in history if h["alignment"] == "override"]

        components = [
            "slot_energy_bonus",
            "focus_reward",
            "fatigue_penalty",
            "completion_bonus",
            "deadline_bonus",
            "delay_penalty",
            "momentum_bonus",
        ]

        def avg_components(group):
            if not group:
                return {c: 0.0 for c in components}
            out = {}
            for c in components:
                vals = [h["reward_breakdown"].get(c, 0) for h in group]
                out[c] = round(sum(vals) / len(vals), 2)
            return out

        return {
            "followed": avg_components(followed),
            "override": avg_components(overrides),
            "components": components,
        }

    # ─────────────────────────────────────────────────────────────────────────
    # REWARD CALCULATOR — mirrors RLSessionService exactly
    # ─────────────────────────────────────────────────────────────────────────

    def _compute_session_reward(self, session) -> dict:
        task = session.task
        work_intensity = self.analytics._calculate_work_intensity()
        slot_name = self._resolve_slot(session)
        start, end = SLOT_HOURS.get(slot_name, (6, 12))
        slot_energy = self.analytics._calculate_slot_energy(
            slot_name, start, end, work_intensity
        )

        focus_rating = float(session.focus_rating) if session.focus_rating else 3.0
        is_crunch = work_intensity > 0.8
        urg_mult = self.cfg.REWARD_CRUNCH_MULTIPLIER if is_crunch else 1.0
        fat_red = self.cfg.FATIGUE_PENALTY_GRACE if is_crunch else 1.0
        days_until = get_effective_days_until(task)
        days_due = days_until if days_until is not None else 30

        slot_energy_bonus = round(((slot_energy - 1.0) / 4.0) * 1.5, 3)

        focus_reward = round(self.cfg.W_FOCUS * focus_rating, 3)
        if focus_rating < 3.0:
            focus_reward = round(focus_reward * fat_red, 3)

        difficulty = task.difficulty or 3
        fatigue_penalty = 0.0
        if difficulty >= 4 and focus_rating < 3.0 and not is_crunch:
            fatigue_penalty = round(self.cfg.PENALTY_FATIGUE_IGNORE * fat_red, 3)

        sessions_done = task.sessions_count or 0
        estimated = task.estimated_pomodoros or 1
        completion_bonus = 0.0
        if sessions_done + 1 >= estimated:
            completion_bonus = round(self.cfg.W_COMPLETION * urg_mult, 3)

        deadline_bonus = 0.0
        delay_penalty = 0.0
        if days_due < 0:
            delay_penalty = round(-self.cfg.W_DELAY * abs(days_due) * urg_mult, 3)
        elif days_due <= 1:
            deadline_bonus = round(5.0 * urg_mult, 3)

        status_val = (
            task.status.value if hasattr(task.status, "value") else str(task.status)
        )
        momentum_bonus = 5.0 if status_val == "IN_PROGRESS" else 0.0

        total = round(
            slot_energy_bonus
            + focus_reward
            + fatigue_penalty
            + completion_bonus
            + deadline_bonus
            + delay_penalty
            + momentum_bonus,
            3,
        )

        return {
            "slot_energy_bonus": slot_energy_bonus,
            "focus_reward": focus_reward,
            "fatigue_penalty": fatigue_penalty,
            "completion_bonus": completion_bonus,
            "deadline_bonus": deadline_bonus,
            "delay_penalty": delay_penalty,
            "momentum_bonus": momentum_bonus,
            "total": total,
        }

    # ─────────────────────────────────────────────────────────────────────────
    # HELPERS
    # ─────────────────────────────────────────────────────────────────────────

    def _fetch_recent_sessions(self) -> list:
        return (
            self.db.query(PomodoroSession)
            .options(
                joinedload(PomodoroSession.task).joinedload(Task.module),
                joinedload(PomodoroSession.task).joinedload(Task.exam),
            )
            .filter(
                PomodoroSession.user_id == self.user_id,
                PomodoroSession.end_time.isnot(None),  # only completed sessions
            )
            .order_by(PomodoroSession.start_time.desc())
            .limit(HISTORY_LIMIT)
            .all()
        )

    def _resolve_slot(self, session) -> str:
        slot_type = getattr(session, "slot_type", None)
        if slot_type:
            val = slot_type.value if hasattr(slot_type, "value") else str(slot_type)
            for key in SLOT_HOURS:
                if val.upper() == key.upper():
                    return key
        if session.start_time:
            h = session.start_time.hour
            if 6 <= h < 12:
                return "Morning"
            if 12 <= h < 18:
                return "Afternoon"
            return "Evening"
        return "Morning"

    def _avg_reward(self, group: list) -> float:
        if not group:
            return 0.0
        return round(sum(h["total_reward"] for h in group) / len(group), 2)

    def _avg_focus(self, group: list) -> float:
        rated = [h["focus_rating"] for h in group if h["focus_rating"] is not None]
        if not rated:
            return 0.0
        return round(sum(rated) / len(rated), 1)

    def _priority_str(self, task) -> str:
        p = getattr(task, "priority", None)
        if p is None:
            return "LOW"
        return (p.value if hasattr(p, "value") else str(p)).upper()

    def _empty_response(self) -> dict:
        return {
            "alignment_history": [],
            "gap_stats": {
                "follow_count": 0,
                "override_count": 0,
                "follow_rate": 0,
                "avg_reward_followed": 0.0,
                "avg_reward_override": 0.0,
                "reward_delta": 0.0,
                "agent_advantage": False,
                "avg_focus_followed": 0.0,
                "avg_focus_override": 0.0,
                "completion_followed": 0,
                "completion_override": 0,
                "top_ignored_tasks": [],
            },
            "reward_comparison": {"followed": {}, "override": {}, "components": []},
            "active_slot": "Morning",
            "total_sessions": 0,
            "generated_at": self.now.isoformat(),
        }
