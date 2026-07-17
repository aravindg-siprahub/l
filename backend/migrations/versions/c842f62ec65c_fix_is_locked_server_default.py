"""fix_is_locked_server_default

Revision ID: c842f62ec65c
Revises: 7fabb0cd96e5
Create Date: 2026-07-18 00:14:42.078767

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c842f62ec65c'
down_revision: Union[str, None] = '7fabb0cd96e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Add a server-side default (false) to the is_locked column on the timesheet table.

    Background:
    - The is_locked column was added in revision bf756b67245d without a server_default.
    - nullable=False without server_default is only safe on empty tables.
    - This migration makes the column safe for non-empty tables by ensuring PostgreSQL
      always has a default value to fall back on during ALTER operations.
    - Existing rows: PostgreSQL will SET DEFAULT false immediately (no data rewrite).
    - New rows: will receive false automatically when is_locked is not supplied.
    """
    op.alter_column(
        'timesheet',
        'is_locked',
        server_default=sa.false(),
        existing_type=sa.Boolean(),
        existing_nullable=False,
    )


def downgrade() -> None:
    """Remove server_default from is_locked (reverting to no default)."""
    op.alter_column(
        'timesheet',
        'is_locked',
        server_default=None,
        existing_type=sa.Boolean(),
        existing_nullable=False,
    )
