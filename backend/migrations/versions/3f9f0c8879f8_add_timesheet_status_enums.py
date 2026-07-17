"""add_timesheet_status_enums

Revision ID: 3f9f0c8879f8
Revises: 974ee1ae369d
Create Date: 2026-07-17 23:29:06.408541

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3f9f0c8879f8'
down_revision: Union[str, None] = '974ee1ae369d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # PostgreSQL ENUMs require ALTER TYPE to add new values
    op.execute("ALTER TYPE timesheetstatus ADD VALUE IF NOT EXISTS 'client_approved'")
    op.execute("ALTER TYPE timesheetstatus ADD VALUE IF NOT EXISTS 'client_rejected'")
    op.execute("ALTER TYPE timesheetstatus ADD VALUE IF NOT EXISTS 'finance_approved'")
    op.execute("ALTER TYPE timesheetstatus ADD VALUE IF NOT EXISTS 'finance_rejected'")
    #
    # ── Enum History Documentation (Priority 3) ───────────────────────────────
    #
    # The timesheetstatus PostgreSQL ENUM was originally created in revision
    # 8146a4d2305d with values: draft, submitted, approved, rejected
    #
    # DEPRECATED values still present in the PostgreSQL type (cannot be removed):
    #   - 'approved'  → replaced by 'client_approved' and 'finance_approved'
    #   - 'rejected'  → replaced by 'client_rejected' and 'finance_rejected'
    #
    # Root cause: PostgreSQL does not support ALTER TYPE ... DROP VALUE.
    # The only safe path to clean up orphaned enum values is to:
    #   1. Create a new enum type with the correct values
    #   2. ALTER the column to use the new type
    #   3. Drop the old type
    # This is a breaking DDL operation requiring a maintenance window.
    #
    # Current state: The Python TimesheetStatus enum (models.py) does NOT include
    # 'approved' or 'rejected'. Application code MUST NEVER write these values.
    # They are permanently orphaned in the DB type and will be cleaned up in a
    # future dedicated migration when a maintenance window is available.
    #
    # Future migration plan (when scheduled):
    #   alembic revision -m replace_timesheetstatus_enum_clean
    #   - CREATE TYPE timesheetstatus_new AS ENUM(...)
    #   - ALTER TABLE timesheet ALTER COLUMN status TYPE timesheetstatus_new USING ...
    #   - DROP TYPE timesheetstatus
    #   - ALTER TYPE timesheetstatus_new RENAME TO timesheetstatus
    # ─────────────────────────────────────────────────────────────────────────


def downgrade() -> None:
    pass
