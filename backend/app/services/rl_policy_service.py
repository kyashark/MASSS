"""
app/services/rl_policy_service.py
------------------------------------
Card 5: Policy Analytics

Answers the research question:
  "Did the RL policy actually adapt to this student's behaviour, or stay static?"

Three signals computed:

1. SLOT SCORE DRIFT
   Recomputes slot energy scores in cumulative time windows over the last 28 days.
   Each window includes all sessions up to that point → shows the learning curve.
   If Morning score rises over time, the agent learned this student does better then.

2. POLICY CONFIDENCE
   Gap between rank-1 and rank-2 task probability in the current action distribution.
   Rising gap = agent becoming more decisive = convergence.
   Flat/falling gap = agent is uncertain = still exploring.

3. CATEGORY PREFERENCE DRIFT
   Per-category completion rate computed in rolling 7-day windows.
   Shows which subject types the agent has learned to score higher.

All sparklines are computed from real session history — no fake data.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import datetime, timedelta
from math import exp

from app.models.session import PomodoroSession, SessionEndType
from app.models.task import Task
from app.models.module import Module
from app.rl_engine.analytics import UserAnalyticsService

SLOTS = [
    ("Morning", 6, 12),
    ("Afternoon", 12, 18),
    ("Evening", 18, 24),
]

SLOT_COLORS = {
    "Morning": "#f59e0b",
    "Afternoon": "#38bdf8",
    "Evening": "#a78bfa",
}


class RLPolicyService:
    """
    Derives policy learning signals from the student's session history.
    Uses the same behavioral scoring logic as UserAnalyticsService
    so the card reflects exactly what the RL engine measures.
    """

    LOOKBACK_DAYS = 28  # 4 weeks of data
    NUM_BUCKETS = 7  # 7 checkpoints along the timeline (every 4 days)
    TIME_DECAY = 0.5  # matches analytics.py TIME_DECAY_RATE
    W_BEHAVIOR = 0.70  # matches analytics.py
    W_CONTEXT = 0.30

    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id
        self.now = datetime.now()
        self.analytics = UserAnalyticsService(db, user_id)

    # ─────────────────────────────────────────────────────────────────────────
    # PUBLIC — main payload
    # ─────────────────────────────────────────────────────────────────────────

    def get_policy_analytics(self, active_slot: str = "Morning") -> dict:
        all_sessions = self._fetch_all_sessions()
        slot_drift = self._compute_slot_drift(all_sessions)
        confidence = self._compute_policy_confidence(active_slot)
        cat_drift = self._compute_category_drift()
        summary = self._compute_summary(all_sessions, slot_drift, confidence)

        return {
            "slot_drift": slot_drift,
            "policy_confidence": confidence,
            "category_drift": cat_drift,
            "summary": summary,
            "slot_colors": SLOT_COLORS,
            "generated_at": self.now.isoformat(),
        }

    # ─────────────────────────────────────────────────────────────────────────
    # SIGNAL 1 — Slot Score Drift
    # ─────────────────────────────────────────────────────────────────────────

    def _compute_slot_drift(self, all_sessions: list) -> dict:
        """
        Builds 7 cumulative checkpoints over 28 days.
        At each checkpoint, computes what the slot energy score would be
        using only sessions observed up to that point.

        Returns per-slot array of {label, score, bucket_idx} dicts.
        """
        bucket_days = self.LOOKBACK_DAYS / self.NUM_BUCKETS  # 4 days each
        cutoff_start = self.now - timedelta(days=self.LOOKBACK_DAYS)
        intensity = self.analytics._calculate_work_intensity()

        result = {}

        for slot_name, hour_start, hour_end in SLOTS:
            slot_sessions = [
                s
                for s in all_sessions
                if s.start_time and self._in_slot_hours(s, hour_start, hour_end)
            ]

            checkpoints = []
            for bucket in range(1, self.NUM_BUCKETS + 1):
                window_end = cutoff_start + timedelta(days=bucket * bucket_days)
                # Cumulative: all slot sessions up to this checkpoint
                subset = [s for s in slot_sessions if s.start_time <= window_end]

                score = self._slot_energy_from_subset(subset, intensity)
                # Normalise to 0–1 for sparkline rendering
                normalised = round((score - 1.0) / 4.0, 3)

                checkpoints.append(
                    {
                        "bucket": bucket,
                        "label": self._bucket_label(cutoff_start, bucket, bucket_days),
                        "score_raw": round(score, 2),  # 1–5 scale
                        "score": normalised,  # 0–1 scale for sparkline
                        "n_sessions": len(subset),
                    }
                )

            result[slot_name] = {
                "checkpoints": checkpoints,
                "current": checkpoints[-1]["score_raw"] if checkpoints else 3.0,
                "trend": self._trend(checkpoints),
                "color": SLOT_COLORS[slot_name],
            }

        return result

    def _slot_energy_from_subset(self, sessions: list, intensity: float) -> float:
        """Mirrors UserAnalyticsService._calculate_slot_energy without DB write."""
        context_energy = 5.0 - (intensity * 4.0)
        if not sessions:
            return max(1.0, min(5.0, context_energy))
        behavior_score = self._behavioral_score(sessions)
        return (self.W_BEHAVIOR * behavior_score) + (self.W_CONTEXT * context_energy)

    def _behavioral_score(self, sessions: list) -> float:
        """Mirrors UserAnalyticsService._compute_behavioral_score."""
        return (
            0.40 * self._signal_completion(sessions)
            + 0.30 * self._signal_duration(sessions)
            + 0.15 * self._signal_streaks(sessions)
            + 0.15 * self._signal_ratings(sessions)
        )

    def _signal_completion(self, sessions):
        num, den = 0.0, 0.0
        for s in sessions:
            val = 1.0 if s.end_type == SessionEndType.COMPLETED else 0.0
            w = self._decay(s)
            num += val * w
            den += w
        return 1.0 + ((num / den) * 4.0) if den > 0 else 3.0

    def _signal_duration(self, sessions):
        num, den = 0.0, 0.0
        for s in sessions:
            if not s.duration_minutes:
                continue
            ratio = min(s.duration_minutes / 25.0, 1.0)
            w = self._decay(s)
            num += ratio * w
            den += w
        return 1.0 + ((num / den) * 4.0) if den > 0 else 3.0

    def _signal_streaks(self, sessions):
        if len(sessions) < 2:
            return 3.0
        ss = sorted(sessions, key=lambda x: x.start_time)
        max_s = curr_s = 1
        for i in range(len(ss) - 1):
            if not ss[i].end_time:
                continue
            gap = (ss[i + 1].start_time - ss[i].end_time).total_seconds() / 60
            if gap < 15:
                curr_s += 1
                max_s = max(max_s, curr_s)
            else:
                curr_s = 1
        return 1.0 + (min(max_s / 5.0, 1.0) * 4.0)

    def _signal_ratings(self, sessions):
        num, den = 0.0, 0.0
        for s in sessions:
            if s.focus_rating is None:
                continue
            w = self._decay(s)
            num += s.focus_rating * w
            den += w
        return num / den if den > 0 else 3.0

    def _decay(self, session) -> float:
        age = max(0, (self.now - session.start_time).days)
        return exp(-self.TIME_DECAY * age)

    # ─────────────────────────────────────────────────────────────────────────
    # SIGNAL 2 — Policy Confidence
    # ─────────────────────────────────────────────────────────────────────────

    def _compute_policy_confidence(self, active_slot: str) -> dict:
        """
        Confidence = gap between rank-1 and rank-2 task probability.
        High gap → agent is decisive about what to recommend.
        Low gap  → agent is uncertain, still exploring.
        """
        try:
            from app.services.rl_action_service import RLActionService

            dist = RLActionService(self.db, self.user_id).get_action_distribution(
                active_slot
            )
            tasks = dist.get("actions", [])  # ← was "tasks" — key is "actions"
        except Exception as e:
            return {
                "gap": 0,
                "rank1_prob": 0,
                "rank2_prob": 0,
                "verdict": "unavailable",
                "tasks_ranked": [],
                "debug_error": str(e),
            }

        if len(tasks) < 2:
            return {
                "gap": 0,
                "rank1_prob": 0,
                "rank2_prob": 0,
                "verdict": "insufficient_tasks",
                "tasks_ranked": tasks,
            }

        sorted_tasks = sorted(
            tasks, key=lambda t: t.get("probability", 0), reverse=True
        )
        r1 = sorted_tasks[0].get("probability", 0)
        r2 = sorted_tasks[1].get("probability", 0)
        gap = round(r1 - r2, 1)

        if gap >= 20:
            verdict = "decisive"  # agent strongly prefers one task
        elif gap >= 10:
            verdict = "moderate"  # reasonable confidence
        else:
            verdict = "uncertain"  # nearly uniform — still exploring

        return {
            "gap": gap,
            "rank1_prob": r1,
            "rank2_prob": r2,
            "rank1_name": sorted_tasks[0].get("task_name", "—"),
            "rank2_name": sorted_tasks[1].get("task_name", "—"),
            "verdict": verdict,
            "tasks_ranked": sorted_tasks[:5],  # top 5 for mini probability bar
        }

    # ─────────────────────────────────────────────────────────────────────────
    # SIGNAL 3 — Category Preference Drift
    # ─────────────────────────────────────────────────────────────────────────

    def _compute_category_drift(self) -> list:
        """
        Computes per-category completion rate in two windows:
          - Early  (days 28–14)
          - Recent (days 14–0)
        Delta shows which categories the agent has learned to score higher/lower.
        """
        windows = [
            ("early", 28, 14),
            ("recent", 14, 0),
        ]
        per_window = {}

        for label, days_ago_start, days_ago_end in windows:
            start = self.now - timedelta(days=days_ago_start)
            end = self.now - timedelta(days=days_ago_end)

            rows = (
                self.db.query(
                    Module.category,
                    func.count(PomodoroSession.id).label("total"),
                    func.sum(
                        case(
                            (PomodoroSession.end_type == SessionEndType.COMPLETED, 1),
                            else_=0,
                        )
                    ).label("wins"),
                )
                .select_from(PomodoroSession)
                .join(Task, PomodoroSession.task_id == Task.id)
                .join(Module, Task.module_id == Module.id)
                .filter(
                    PomodoroSession.user_id == self.user_id,
                    PomodoroSession.start_time >= start,
                    PomodoroSession.start_time < end,
                )
                .group_by(Module.category)
                .all()
            )
            per_window[label] = {
                (
                    r.category.value
                    if hasattr(r.category, "value")
                    else str(r.category)
                ): round(r.wins / r.total, 3) if r.total > 0 else None
                for r in rows
            }

        # merge both windows into a per-category result
        all_cats = set(per_window["early"]) | set(per_window["recent"])
        result = []

        for cat in sorted(all_cats):
            early = per_window["early"].get(cat)
            recent = per_window["recent"].get(cat)

            if recent is None and early is None:
                continue

            delta = None
            if recent is not None and early is not None:
                delta = round(recent - early, 3)

            result.append(
                {
                    "category": cat,
                    "early": early,
                    "recent": recent,
                    "delta": delta,
                    "trend": (
                        "up"
                        if delta and delta > 0.05
                        else "down"
                        if delta and delta < -0.05
                        else "flat"
                    ),
                }
            )

        return sorted(result, key=lambda x: -(x["recent"] or 0))

    # ─────────────────────────────────────────────────────────────────────────
    # SUMMARY — headline stats for top of card
    # ─────────────────────────────────────────────────────────────────────────

    def _compute_summary(self, sessions, slot_drift, confidence) -> dict:
        if not sessions:
            return {
                "total_sessions": 0,
                "learning_signal": "insufficient_data",
                "best_slot": None,
                "worst_slot": None,
            }

        # Which slot has highest current energy score?
        slot_scores = {s: slot_drift[s]["current"] for s in slot_drift}
        best_slot = max(slot_scores, key=slot_scores.get)
        worst_slot = min(slot_scores, key=slot_scores.get)

        # Count slots with positive trend
        improving = sum(1 for s in slot_drift if slot_drift[s]["trend"] == "up")

        if improving >= 2 and confidence.get("verdict") == "decisive":
            signal = "strong_learning"
        elif improving >= 1:
            signal = "adapting"
        else:
            signal = "early_stage"

        return {
            "total_sessions": len(sessions),
            "learning_signal": signal,
            "best_slot": best_slot,
            "worst_slot": worst_slot,
            "improving_slots": improving,
            "confidence_gap": confidence.get("gap", 0),
        }

    # ─────────────────────────────────────────────────────────────────────────
    # HELPERS
    # ─────────────────────────────────────────────────────────────────────────

    def _fetch_all_sessions(self) -> list:
        cutoff = self.now - timedelta(days=self.LOOKBACK_DAYS)
        return (
            self.db.query(PomodoroSession)
            .filter(
                PomodoroSession.user_id == self.user_id,
                PomodoroSession.start_time >= cutoff,
            )
            .order_by(PomodoroSession.start_time.asc())
            .all()
        )

    def _in_slot_hours(self, session, start: int, end: int) -> bool:
        if not session.start_time:
            return False
        h = session.start_time.hour
        return start <= h < end

    def _trend(self, checkpoints: list) -> str:
        """Linear trend over checkpoints: 'up', 'down', or 'flat'."""
        scores = [c["score"] for c in checkpoints if c["n_sessions"] > 0]
        if len(scores) < 3:
            return "flat"
        first_half = sum(scores[: len(scores) // 2]) / max(len(scores) // 2, 1)
        second_half = sum(scores[len(scores) // 2 :]) / max(
            len(scores) - len(scores) // 2, 1
        )
        diff = second_half - first_half
        if diff > 0.05:
            return "up"
        if diff < -0.05:
            return "down"
        return "flat"

    def _bucket_label(
        self, cutoff_start: datetime, bucket: int, bucket_days: float
    ) -> str:
        dt = cutoff_start + timedelta(days=bucket * bucket_days)
        return f"{dt.day} {dt.strftime('%b')}"
