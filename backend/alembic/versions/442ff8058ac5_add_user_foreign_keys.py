"""add_user_foreign_keys

Revision ID: 442ff8058ac5
Revises: 3713264155f0
Create Date: 2026-04-07 16:26:58.392729

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "442ff8058ac5"
down_revision: Union[str, Sequence[str], None] = "3713264155f0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add FK from modules.user_id → users.id
    op.create_foreign_key(
        "fk_modules_user_id",
        "modules",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )
    # Add FK from exams.user_id → users.id
    op.create_foreign_key(
        "fk_exams_user_id", "exams", "users", ["user_id"], ["id"], ondelete="CASCADE"
    )
    # Add FK from tasks.user_id → users.id
    op.create_foreign_key(
        "fk_tasks_user_id", "tasks", "users", ["user_id"], ["id"], ondelete="CASCADE"
    )
    # Add FK from pomodoro_sessions.user_id → users.id
    op.create_foreign_key(
        "fk_sessions_user_id",
        "pomodoro_sessions",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )
    # Add FK from weekly_routine.user_id → users.id
    op.create_foreign_key(
        "fk_routine_user_id",
        "weekly_routine",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )
    # Add FK from slot_preferences.user_id → users.id
    op.create_foreign_key(
        "fk_preferences_user_id",
        "slot_preferences",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )
    # Prevent duplicate slot entries per user
    op.create_unique_constraint(
        "uq_slot_preferences_user_slot", "slot_preferences", ["user_id", "slot_name"]
    )


def downgrade() -> None:
    op.drop_constraint("uq_slot_preferences_user_slot", "slot_preferences")
    op.drop_constraint("fk_preferences_user_id", "slot_preferences")
    op.drop_constraint("fk_routine_user_id", "weekly_routine")
    op.drop_constraint("fk_sessions_user_id", "pomodoro_sessions")
    op.drop_constraint("fk_tasks_user_id", "tasks")
    op.drop_constraint("fk_exams_user_id", "exams")
    op.drop_constraint("fk_modules_user_id", "modules")
