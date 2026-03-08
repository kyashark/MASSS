from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import datetime, timedelta
from math import exp

from app.models.session import PomodoroSession, SessionEndType
from app.models.task import Task
from app.models.module import Module
from app.models.profile import SlotPreference


# ═══════════════════════════════════════════════════════════════
# SHARED HELPER — used by analytics, state_builder, reward, card
# ═══════════════════════════════════════════════════════════════


def get_effective_deadline(task) -> datetime | None:
    """
    Resolves the most relevant deadline for a task.

    Priority:
      1. task.deadline        — task has its own explicit deadline
      2. task.exam.due_date   — task is linked to an exam (Date → DateTime)
      3. None                 — truly no deadline anywhere

    This ensures exam-linked tasks are treated as urgent even when
    the task itself has no direct deadline set.

    Used by:
      analytics.py  → _calculate_deadline_urgency()
      state_builder → build_state() dim[i,3]
      reward.py     → _get_days_until()
      rl_action_service → _urgency_score()
    """
    # 1. Task's own deadline (DateTime)
    if getattr(task, "deadline", None):
        return task.deadline

    # 2. Linked exam's due_date (Date → convert to DateTime)
    exam = getattr(task, "exam", None)
    if exam:
        due = getattr(exam, "due_date", None)
        if due:
            # due_date is a Date object — combine with midnight for DateTime
            if hasattr(due, "year") and not hasattr(due, "hour"):
                return datetime.combine(due, datetime.min.time())
            return due  # already DateTime

    return None


def get_effective_days_until(task) -> int | None:
    """
    Returns days until effective deadline, or None if no deadline exists.
    Negative = overdue.
    """
    deadline = get_effective_deadline(task)
    if deadline is None:
        return None
    return (deadline - datetime.now()).days


class UserAnalyticsService:
    """
    Advanced analytics service bridging User Profiles and the RL Engine.
    Ensures that "Slot Capacities" and "Energy Signals" are dynamic.

    FIXED: All deadline calculations now use get_effective_deadline()
    which checks task.deadline first, then task.exam.due_date.
    Tasks linked to exams are now correctly treated as urgent.
    """

    TIME_DECAY_RATE = 0.5
    LOOKBACK_DAYS = 14
    RECENT_HISTORY_LIMIT = 5

    W_BEHAVIOR = 0.70
    W_CONTEXT = 0.30

    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id
        self.today = datetime.now()

    def build_rl_context(self):
        """Builds the RL agent context (feeds state_builder.py)."""
        work_intensity = self._calculate_work_intensity()

        prefs = (
            self.db.query(SlotPreference)
            .filter(SlotPreference.user_id == self.user_id)
            .all()
        )
        capacity_map = (
            {
                (
                    p.slot_name.value
                    if hasattr(p.slot_name, "value")
                    else str(p.slot_name)
                ): p.max_pomodoros
                for p in prefs
            }
            if prefs
            else {"Morning": 4, "Afternoon": 4, "Evening": 4}
        )

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
        }

    # ═══════════════════════════════════════════════════════════
    # LAYER 1: WORK INTENSITY
    # ═══════════════════════════════════════════════════════════

    def _calculate_work_intensity(self):
        urgency = self._calculate_deadline_urgency()
        density = self._calculate_workload_density()
        difficulty = self._calculate_difficulty_mix()
        intensity = (0.40 * urgency) + (0.40 * density) + (0.20 * difficulty)
        return max(0.0, min(1.0, intensity))

    def _calculate_deadline_urgency(self):
        """
        FIXED: now includes tasks with NO direct deadline but linked to an exam.

        Before: filtered Task.deadline.isnot(None) → exam-linked tasks excluded.
        After:  loads ALL non-completed tasks with joins, uses get_effective_deadline()
                so exam due_date is used as fallback.
        """
        tasks = (
            self.db.query(Task)
            .outerjoin(Task.exam)  # LEFT JOIN so tasks without exam still load
            .filter(
                Task.user_id == self.user_id,
                Task.status != "COMPLETED",
            )
            .all()
        )

        if not tasks:
            return 0.0

        score = 0.0
        for task in tasks:
            days = get_effective_days_until(task)

            # No deadline anywhere — skip this task for urgency
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

    def _calculate_workload_density(self):
        remaining_pomo = (
            self.db.query(func.sum(Task.estimated_pomodoros - Task.sessions_count))
            .filter(Task.user_id == self.user_id, Task.status != "COMPLETED")
            .scalar()
            or 0
        )
        remaining_hours = remaining_pomo * 0.5
        available_hours = 40.0
        return min(1.0, remaining_hours / available_hours)

    def _calculate_difficulty_mix(self):
        diffs = (
            self.db.query(Task.difficulty)
            .filter(Task.user_id == self.user_id, Task.status != "COMPLETED")
            .all()
        )
        if not diffs:
            return 0.0
        values = [d[0] for d in diffs if d[0] is not None]
        return (sum(values) / len(values)) / 5.0 if values else 0.5

    # ═══════════════════════════════════════════════════════════
    # LAYER 2: BEHAVIORAL ENERGY
    # ═══════════════════════════════════════════════════════════

    def _calculate_slot_energy(self, slot_name, start, end, intensity):
        cutoff = self.today - timedelta(days=self.LOOKBACK_DAYS)
        sessions = (
            self.db.query(PomodoroSession)
            .filter(
                PomodoroSession.user_id == self.user_id,
                PomodoroSession.start_time >= cutoff,
                func.extract("hour", PomodoroSession.start_time).between(
                    start, end - 1
                ),
            )
            .all()
        )

        context_energy = 5.0 - (intensity * 4.0)

        if not sessions:
            final_energy = max(1.0, min(5.0, context_energy))
        else:
            behavior_score = self._compute_behavioral_score(sessions)
            final_energy = (self.W_BEHAVIOR * behavior_score) + (
                self.W_CONTEXT * context_energy
            )

        pref = (
            self.db.query(SlotPreference)
            .filter(
                SlotPreference.user_id == self.user_id,
                SlotPreference.slot_name
                == slot_name,  # SQLAlchemy coerces string to enum
            )
            .first()
        )
        if pref:
            pref.inferred_energy_score = (final_energy - 1.0) / 4.0
            self.db.commit()

        return final_energy

    def _compute_behavioral_score(self, sessions):
        signals = [
            (0.40, self._signal_completion_rate(sessions)),
            (0.30, self._signal_duration_quality(sessions)),
            (0.15, self._signal_session_streaks(sessions)),
            (0.15, self._signal_explicit_ratings(sessions)),
        ]
        return sum(w * s for w, s in signals)

    def _apply_time_decay(self, session, value):
        age = (self.today - session.start_time).days
        weight = exp(-self.TIME_DECAY_RATE * age)
        return value * weight, weight

    def _signal_completion_rate(self, sessions):
        num, den = 0, 0
        for s in sessions:
            val = 1.0 if s.end_type == SessionEndType.COMPLETED else 0.0
            score, weight = self._apply_time_decay(s, val)
            num += score
            den += weight
        return 1.0 + ((num / den) * 4.0) if den > 0 else 3.0

    def _signal_duration_quality(self, sessions):
        num, den = 0, 0
        for s in sessions:
            if not s.duration_minutes:
                continue
            ratio = min(s.duration_minutes / 25.0, 1.0)
            score, weight = self._apply_time_decay(s, ratio)
            num += score
            den += weight
        return 1.0 + ((num / den) * 4.0) if den > 0 else 3.0

    def _signal_session_streaks(self, sessions):
        if len(sessions) < 2:
            return 3.0
        sorted_s = sorted(sessions, key=lambda x: x.start_time)
        max_s, curr_s = 1, 1
        for i in range(len(sorted_s) - 1):
            if not sorted_s[i].end_time:
                continue
            gap = (
                sorted_s[i + 1].start_time - sorted_s[i].end_time
            ).total_seconds() / 60
            if gap < 15:
                curr_s += 1
                max_s = max(max_s, curr_s)
            else:
                curr_s = 1
        return 1.0 + (min(max_s / 5.0, 1.0) * 4.0)

    def _signal_explicit_ratings(self, sessions):
        num, den = 0, 0
        for s in sessions:
            if s.focus_rating is None:
                continue
            score, weight = self._apply_time_decay(s, s.focus_rating)
            num += score
            den += weight
        return num / den if den > 0 else 3.0

    # ═══════════════════════════════════════════════════════════
    # LAYER 3: RECENT PERFORMANCE HISTORY
    # ═══════════════════════════════════════════════════════════

    def _get_recent_performance_history(self):
        sessions = (
            self.db.query(PomodoroSession)
            .filter(PomodoroSession.user_id == self.user_id)
            .order_by(PomodoroSession.start_time.desc())
            .limit(self.RECENT_HISTORY_LIMIT)
            .all()
        )
        history = []
        for s in sessions:
            if s.focus_rating is not None:
                history.append(float(s.focus_rating))
            else:
                history.append(self._infer_session_quality(s))
        return history if history else [3.0]

    def _infer_session_quality(self, s):
        if s.end_type == SessionEndType.COMPLETED:
            score = 4.5
        elif s.end_type == SessionEndType.STOPPED:
            score = 3.0
        else:
            score = 1.5
        if s.duration_minutes:
            ratio = s.duration_minutes / 25.0
            if ratio >= 0.9:
                score += 0.5
            elif ratio < 0.3:
                score -= 1.0
        return max(1.0, min(5.0, score))

    def _calculate_category_bias(self):
        stats = (
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
            .filter(PomodoroSession.user_id == self.user_id)
            .group_by(Module.category)
            .all()
        )
        return {r.category: (r.wins / r.total) if r.total > 0 else 0.5 for r in stats}

    def _calculate_slot_cognitive_fatigue(
        self, slot_name: str, start: int, end: int
    ) -> float:
        cutoff = self.today - timedelta(days=self.LOOKBACK_DAYS)
        sessions = (
            self.db.query(PomodoroSession)
            .filter(
                PomodoroSession.user_id == self.user_id,
                PomodoroSession.start_time >= cutoff,
                func.extract("hour", PomodoroSession.start_time).between(
                    start, end - 1
                ),
            )
            .order_by(PomodoroSession.start_time.desc())
            .limit(self.RECENT_HISTORY_LIMIT)
            .all()
        )

        if not sessions:
            return self._calculate_global_cognitive_fatigue()

        numerator, denominator = 0.0, 0.0
        for s in sessions:
            rating = (
                float(s.focus_rating)
                if s.focus_rating is not None
                else self._infer_session_quality(s)
            )
            _, weight = self._apply_time_decay(s, rating)
            numerator += rating * weight
            denominator += weight

        fatigue_raw = numerator / denominator
        normalized = (fatigue_raw - 1.0) / 4.0
        dim_554 = 1.0 - normalized
        return round(max(0.0, min(1.0, dim_554)), 3)

    def _calculate_global_cognitive_fatigue(self) -> float:
        sessions = (
            self.db.query(PomodoroSession)
            .filter(PomodoroSession.user_id == self.user_id)
            .order_by(PomodoroSession.start_time.desc())
            .limit(self.RECENT_HISTORY_LIMIT)
            .all()
        )
        if not sessions:
            return 0.30

        numerator, denominator = 0.0, 0.0
        for s in sessions:
            rating = (
                float(s.focus_rating)
                if s.focus_rating is not None
                else self._infer_session_quality(s)
            )
            _, weight = self._apply_time_decay(s, rating)
            numerator += rating * weight
            denominator += weight

        fatigue_raw = numerator / denominator
        normalized = (fatigue_raw - 1.0) / 4.0
        dim_554 = 1.0 - normalized
        return round(max(0.0, min(1.0, dim_554)), 3)

    def _calculate_slot_energy_raw(self, slot_name, start, end, intensity):
        """Returns raw 1-5 score without writing to DB. Used by dashboard services."""
        return self._calculate_slot_energy(slot_name, start, end, intensity)
