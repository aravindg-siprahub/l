"""add_timesheet_sharing_fields

Revision ID: a1b2c3d4e5f6
Revises: c842f62ec65c
Create Date: 2026-07-18 05:30:00.000000

Adds three nullable columns to the timesheet table to support the
Phase 1 Candidate → Manager Sharing feature.

Design notes:
  - All three columns are nullable — existing rows will read as NULL.
  - No enum change is required. The existing approval workflow is unaffected.
  - A timesheet is considered "shared" in application code when shared_at IS NOT NULL.
  - The timesheetstatus PostgreSQL enum is NOT touched in this migration.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'c842f62ec65c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add sharing metadata columns — all nullable, additive, backward compatible.
    op.add_column(
        'timesheet',
        sa.Column('manager_email', sa.String(255), nullable=True),
    )
    op.add_column(
        'timesheet',
        sa.Column('manager_name', sa.String(255), nullable=True),
    )
    op.add_column(
        'timesheet',
        sa.Column('shared_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    # Safe to drop — nullable columns; no data loss for rows that have never been shared.
    op.drop_column('timesheet', 'shared_at')
    op.drop_column('timesheet', 'manager_name')
    op.drop_column('timesheet', 'manager_email')
