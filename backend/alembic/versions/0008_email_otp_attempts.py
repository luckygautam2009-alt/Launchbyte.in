"""add attempts column to email_verification_tokens for 6-digit OTP

Revision ID: 0008
Revises: 0007
Create Date: 2026-11-26 15:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0008"
down_revision: Union[str, None] = "0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("email_verification_tokens", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("attempts", sa.Integer(), server_default=sa.text("0"), nullable=False)
        )


def downgrade() -> None:
    with op.batch_alter_table("email_verification_tokens", schema=None) as batch_op:
        batch_op.drop_column("attempts")
