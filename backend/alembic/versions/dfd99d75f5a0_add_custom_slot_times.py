"""add_custom_slot_times

Revision ID: dfd99d75f5a0
Revises: 51ce40659841
Create Date: 2026-04-13 16:36:58.554984

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "dfd99d75f5a0"
down_revision: Union[str, Sequence[str], None] = "51ce40659841"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Add custom slot columns to slot_preferences
    op.add_column(
        "slot_preferences", sa.Column("slot_label", sa.String(), nullable=True)
    )
    op.add_column("slot_preferences", sa.Column("start_time", sa.Time(), nullable=True))
    op.add_column("slot_preferences", sa.Column("end_time", sa.Time(), nullable=True))

    # Backfill existing rows with sensible defaults
    op.execute("""
        UPDATE slot_preferences SET
            slot_label = CASE slot_name::text
                WHEN 'morning'   THEN 'Morning'
                WHEN 'afternoon' THEN 'Afternoon'
                WHEN 'evening'   THEN 'Evening'
                ELSE initcap(slot_name::text)
            END,
            start_time = CASE slot_name::text
                WHEN 'morning'   THEN '06:00:00'::time
                WHEN 'afternoon' THEN '12:00:00'::time
                WHEN 'evening'   THEN '18:00:00'::time
                ELSE '08:00:00'::time
            END,
            end_time = CASE slot_name::text
                WHEN 'morning'   THEN '12:00:00'::time
                WHEN 'afternoon' THEN '18:00:00'::time
                WHEN 'evening'   THEN '23:59:00'::time
                ELSE '22:00:00'::time
            END
        WHERE slot_label IS NULL
    """)


def downgrade():
    op.drop_column("slot_preferences", "slot_label")
    op.drop_column("slot_preferences", "start_time")
    op.drop_column("slot_preferences", "end_time")
