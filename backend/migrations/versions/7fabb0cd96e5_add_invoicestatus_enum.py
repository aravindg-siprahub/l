"""add_invoicestatus_enum

Revision ID: 7fabb0cd96e5
Revises: bf756b67245d
Create Date: 2026-07-17 23:56:49.345287

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7fabb0cd96e5'
down_revision: Union[str, None] = 'bf756b67245d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # The invoicestatus ENUM was created inline with the invoice table in the
    # previous revision. This migration is intentionally empty and serves as a
    # documentation checkpoint for the enum addition.
    pass


def downgrade() -> None:
    pass
