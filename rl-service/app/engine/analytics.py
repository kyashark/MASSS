"""
analytics.py — Stateless version for the RL microservice.

The original analytics.py queried the database directly.
This version receives all data as plain Python objects.
No SQLAlchemy. No database connection. No side effects.

The caller (main backend) is responsible for fetching
the data and sending it in the request body.
"""

from datetime import datetime, timedelta
from math import exp
from typing import List, Optional, Dict

from app.engine.config import RLConfig


# ─── Shared Helpers ───────────────────────────────────────────────────────────


def get_effective_deadline(task: dict) -> Optional[datetime]:
    """
    Resolves the most relevant deadline for a task dict.
    Task dicts have days_until_deadline as an integer.
    Convert back to datetime for compatibility with existing engine code.
    """
    days = task.get("days_until_deadline")
    if days is None:
        return None
    return datetime.now() + timedelta(days=days)


def get_effective_days_until(task: dict) -> Optional[int]:
    """Returns days until deadline or None if no deadline."""
    return task.get("days_until_deadline")


# ─── Analytics Service ────────────────────────────────────────────────────────


class UserAnalyticsService:
    """
    Stateless analytics service.
    All data is passed in — no database queries.
    """

    TIME_DECAY_RATE = 0.5
    LOOKBACK_DAYS = 14
    RECENT_HISTORY_LIMIT = 5
    W_BEHAVIOR = 0.70
    W_CONTEXT = 0.30

    def __init__(
        self,
        session_history: List[dict],
        slot_preferences: List[dict],
        weekly_routine: List[dict],
        tasks: List[dict] = None,
    ):
        self.session_history = session_history
        self.slot_preferences = slot_preferences
        self.weekly_routine = weekly_routine
        self.tasks = tasks or []
        self.today = datetime.now()
        self.cfg = RLConfig()

    def build_rl_context(self) -> dict:
        """Builds the context dict the RL predictor needs."""
        work_intensity = self._calculate_work_intensity()

        # Build capacity map from slot preferences
        capacity_map = {"Morning": 4, "Afternoon": 4, "Evening": 4}
        for pref in self.slot_preferences:
            capacity_map[pref["slot_name"]] = pref["max_pomodoros"]

        # Build energy map per slot
        energy_map = {
            slot: self._calculate_slot_energy(slot, start, end, work_intensity)
            for slot, start, end in [
                ("Morning", 6, 12),
                ("Afternoon", 12, 18),
                ("Evening", 18, 24),
            ]
        }

        return {
            "work_intensity": work_intensity,
            "energy_map": energy_map,
            "capacity_map": capacity_map,
            "recent_ratings": self._get_recent_performance_history(),
            "category_bias": self._calculate_category_bias(),
            "post_class_fatigue": self._calculate_post_class_fatigue(),
        }

    # ── Work Intensity ────────────────────────────────────────────────────────

    def _calculate_work_intensity(self) -> float:
        urgency = self._calculate_deadline_urgency()
        density = self._calculate_workload_density()
        difficulty = self._calculate_difficulty_mix()
        intensity = (0.40 * urgency) + (0.40 * density) + (0.20 * difficulty)
        return max(0.0, min(1.0, intensity))

    def _calculate_deadline_urgency(self) -> float:
        if not self.tasks:
            return 0.0

        score = 0.0
        for task in self.tasks:
            days = task.get("days_until_deadline")
            if days is None:
                continue
            if days <= 0:
                weight = 1.0
            elif days <= 1:
                weight = 0.8
            elif days <= 3:
                weight = 0.5
            elif days <= 7:
                weight = 0.2
            else:
                weight = 0.1
            score += weight

        return min(1.0, score / 5.0)

    def _calculate_workload_density(self) -> float:
        if not self.tasks:
            return 0.0
        remaining = sum(
            max(0, t.get("estimated_pomodoros", 1) - t.get("sessions_count", 0))
            for t in self.tasks
        )
        remaining_hours = remaining * 0.5
        # Based on RLConfig — use 25 hours as a realistic weekly study cap
        available_hours = 25.0
        return min(1.0, remaining_hours / available_hours)

    def _calculate_difficulty_mix(self) -> float:
        if not self.tasks:
            return 0.5
        diffs = [t.get("difficulty", 3) for t in self.tasks if t.get("difficulty")]
        if not diffs:
            return 0.5
        return (sum(diffs) / len(diffs)) / 5.0

    # ── Slot Energy ───────────────────────────────────────────────────────────

    def _calculate_slot_energy(
        self, slot_name: str, start: int, end: int, intensity: float
    ) -> float:
        # Filter session history to this slot's hours
        slot_sessions = [
            s for s in self.session_history if self._session_in_slot(s, start, end)
        ]

        context_energy = 5.0 - (intensity * 4.0)

        # Reduce if a class runs in this slot today
        slot_class_load = self._calculate_slot_class_load(start, end)
        context_energy = context_energy * (1.0 - slot_class_load * 0.5)

        if not slot_sessions:
            return max(1.0, min(5.0, context_energy))

        behavior_score = self._compute_behavioral_score(slot_sessions)
        final_energy = (self.W_BEHAVIOR * behavior_score) + (
            self.W_CONTEXT * context_energy
        )

        return max(1.0, min(5.0, final_energy))

    def _session_in_slot(self, session: dict, start: int, end: int) -> bool:
        """Check if a session's started_at falls within the slot hours."""
        try:
            started = datetime.fromisoformat(session["started_at"])
            cutoff = self.today - timedelta(days=self.LOOKBACK_DAYS)
            return started >= cutoff and start <= started.hour < end
        except (KeyError, ValueError):
            return False

    def _calculate_slot_class_load(self, slot_start: int, slot_end: int) -> float:
        """Returns 0.0-1.0 representing how much of the slot is taken by classes today."""
        today_name = self.today.strftime("%A")
        slot_mins = (slot_end - slot_start) * 60

        today_events = [
            e
            for e in self.weekly_routine
            if e["day_of_week"] == today_name
            and e["activity_type"] in ("Class", "Work")
        ]

        if not today_events:
            return 0.0

        overlap_mins = 0
        for event in today_events:
            try:
                e_start_h, e_start_m = map(int, event["start_time"].split(":"))
                e_end_h, e_end_m = map(int, event["end_time"].split(":"))
                e_start = e_start_h * 60 + e_start_m
                e_end = e_end_h * 60 + e_end_m
                s_start = slot_start * 60
                s_end = slot_end * 60
                overlap = max(0, min(e_end, s_end) - max(e_start, s_start))
                overlap_mins += overlap
            except (ValueError, KeyError):
                continue

        return round(min(overlap_mins / slot_mins, 1.0), 3)

    # ── Behavioral Score ──────────────────────────────────────────────────────

    def _compute_behavioral_score(self, sessions: List[dict]) -> float:
        signals = [
            (0.40, self._signal_completion_rate(sessions)),
            (0.30, self._signal_duration_quality(sessions)),
            (0.15, self._signal_session_streaks(sessions)),
            (0.15, self._signal_explicit_ratings(sessions)),
        ]
        return sum(w * s for w, s in signals)

    def _apply_time_decay(self, session: dict, value: float):
        try:
            started = datetime.fromisoformat(session["started_at"])
            age = (self.today - started).days
        except (KeyError, ValueError):
            age = 7
        weight = exp(-self.TIME_DECAY_RATE * age)
        return value * weight, weight

    def _signal_completion_rate(self, sessions: List[dict]) -> float:
        num, den = 0.0, 0.0
        for s in sessions:
            val = 1.0 if s.get("end_type") == "COMPLETED" else 0.0
            score, weight = self._apply_time_decay(s, val)
            num += score
            den += weight
        return 1.0 + ((num / den) * 4.0) if den > 0 else 3.0

    def _signal_duration_quality(self, sessions: List[dict]) -> float:
        num, den = 0.0, 0.0
        for s in sessions:
            duration = s.get("duration_minutes", 0)
            if not duration:
                continue
            ratio = min(duration / 25.0, 1.0)
            score, weight = self._apply_time_decay(s, ratio)
            num += score
            den += weight
        return 1.0 + ((num / den) * 4.0) if den > 0 else 3.0

    def _signal_session_streaks(self, sessions: List[dict]) -> float:
        if len(sessions) < 2:
            return 3.0
        try:
            sorted_s = sorted(
                sessions, key=lambda x: datetime.fromisoformat(x["started_at"])
            )
        except (KeyError, ValueError):
            return 3.0

        max_s, curr_s = 1, 1
        for i in range(len(sorted_s) - 1):
            try:
                t1 = datetime.fromisoformat(sorted_s[i]["started_at"])
                t2 = datetime.fromisoformat(sorted_s[i + 1]["started_at"])
                gap = (t2 - t1).total_seconds() / 60
                if gap < 15:
                    curr_s += 1
                    max_s = max(max_s, curr_s)
                else:
                    curr_s = 1
            except (KeyError, ValueError):
                continue

        return 1.0 + (min(max_s / 5.0, 1.0) * 4.0)

    def _signal_explicit_ratings(self, sessions: List[dict]) -> float:
        num, den = 0.0, 0.0
        for s in sessions:
            rating = s.get("focus_rating")
            if rating is None:
                continue
            score, weight = self._apply_time_decay(s, float(rating))
            num += score
            den += weight
        return num / den if den > 0 else 3.0

    # ── Recent Performance ────────────────────────────────────────────────────

    def _get_recent_performance_history(self) -> List[float]:
        recent = sorted(
            self.session_history, key=lambda s: s.get("started_at", ""), reverse=True
        )[: self.RECENT_HISTORY_LIMIT]

        history = []
        for s in recent:
            rating = s.get("focus_rating")
            if rating is not None:
                history.append(float(rating))
            else:
                history.append(self._infer_session_quality(s))

        return history if history else [3.0]

    def _infer_session_quality(self, session: dict) -> float:
        end_type = session.get("end_type", "ABORTED")
        if end_type == "COMPLETED":
            score = 4.5
        elif end_type == "STOPPED":
            score = 3.0
        else:
            score = 1.5

        duration = session.get("duration_minutes", 0)
        if duration:
            ratio = duration / 25.0
            if ratio >= 0.9:
                score += 0.5
            elif ratio < 0.3:
                score -= 1.0

        return max(1.0, min(5.0, score))

    # ── Category Bias ─────────────────────────────────────────────────────────

    def _calculate_category_bias(self) -> Dict[str, float]:
        """
        Calculate completion rate per category from session history.
        Session history items include category via task lookup.
        Since we do not have module data here, return neutral defaults.
        The main backend can optionally enrich sessions with category.
        """
        # Default neutral bias for all known categories
        defaults = {
            "Coding": 0.5,
            "Math/Logic": 0.5,
            "Language": 0.5,
            "Creative Design": 0.5,
            "Memorization": 0.5,
            "Other": 0.5,
        }
        return defaults

    # ── Post-Class Fatigue ────────────────────────────────────────────────────

    def _calculate_post_class_fatigue(self) -> float:
        """
        Reads today's routine events and calculates fatigue boost
        from recently ended classes.
        """
        now = datetime.now()
        today_name = now.strftime("%A")

        today_events = [
            e
            for e in self.weekly_routine
            if e["day_of_week"] == today_name and e["activity_type"] != "Sleep"
        ]

        if not today_events:
            return 0.0

        INTENSITY_MAP = {"Class": 1.0, "Work": 0.7, "Habit": 0.3}
        total_boost = 0.0

        for event in today_events:
            try:
                end_h, end_m = map(int, event["end_time"].split(":"))
                start_h, start_m = map(int, event["start_time"].split(":"))
            except (ValueError, KeyError):
                continue

            end_dt = now.replace(hour=end_h, minute=end_m, second=0)
            start_dt = now.replace(hour=start_h, minute=start_m, second=0)

            if end_dt > now:
                continue

            hours_ago = (now - end_dt).total_seconds() / 3600
            window = self.cfg.CLASS_FATIGUE_WINDOW_HRS
            if hours_ago > window:
                continue

            duration_hrs = (end_dt - start_dt).total_seconds() / 3600
            duration_w = min(duration_hrs / 3.0, 1.0)
            decay = exp(-self.cfg.CLASS_FATIGUE_DECAY_RATE * hours_ago)
            intensity_w = INTENSITY_MAP.get(event.get("activity_type", "Habit"), 0.5)

            total_boost += decay * duration_w * intensity_w

        return round(min(total_boost, 1.0), 3)

    def _get_most_recent_class_name(self) -> Optional[str]:
        now = datetime.now()
        today_name = now.strftime("%A")

        class_events = [
            e
            for e in self.weekly_routine
            if e["day_of_week"] == today_name and e["activity_type"] == "Class"
        ]

        ended = []
        for e in class_events:
            try:
                end_h, end_m = map(int, e["end_time"].split(":"))
                end_dt = now.replace(hour=end_h, minute=end_m, second=0)
                if end_dt <= now:
                    ended.append((end_dt, e["name"]))
            except (ValueError, KeyError):
                continue

        if not ended:
            return None

        return max(ended, key=lambda x: x[0])[1]

    # ── Cognitive Fatigue ─────────────────────────────────────────────────────

    def _calculate_slot_cognitive_fatigue(
        self, slot_name: str, start: int, end: int
    ) -> float:
        slot_sessions = [
            s for s in self.session_history if self._session_in_slot(s, start, end)
        ][: self.RECENT_HISTORY_LIMIT]

        if not slot_sessions:
            return self._calculate_global_cognitive_fatigue()

        num, den = 0.0, 0.0
        for s in slot_sessions:
            rating = s.get("focus_rating")
            if rating is None:
                rating = self._infer_session_quality(s)
            _, weight = self._apply_time_decay(s, float(rating))
            num += float(rating) * weight
            den += weight

        fatigue_raw = num / den if den > 0 else 3.0
        normalized = (fatigue_raw - 1.0) / 4.0
        dim_554 = 1.0 - normalized

        post_class = self._calculate_post_class_fatigue()
        merged = min(1.0, dim_554 + (post_class * self.cfg.POST_CLASS_FATIGUE_WEIGHT))
        return round(max(0.0, min(1.0, merged)), 3)

    def _calculate_global_cognitive_fatigue(self) -> float:
        recent = sorted(
            self.session_history, key=lambda s: s.get("started_at", ""), reverse=True
        )[: self.RECENT_HISTORY_LIMIT]

        if not recent:
            return 0.30

        num, den = 0.0, 0.0
        for s in recent:
            rating = s.get("focus_rating")
            if rating is None:
                rating = self._infer_session_quality(s)
            _, weight = self._apply_time_decay(s, float(rating))
            num += float(rating) * weight
            den += weight

        fatigue_raw = num / den if den > 0 else 3.0
        normalized = (fatigue_raw - 1.0) / 4.0
        dim_554 = 1.0 - normalized

        post_class = self._calculate_post_class_fatigue()
        merged = min(1.0, dim_554 + (post_class * self.cfg.POST_CLASS_FATIGUE_WEIGHT))
        return round(max(0.0, min(1.0, merged)), 3)
