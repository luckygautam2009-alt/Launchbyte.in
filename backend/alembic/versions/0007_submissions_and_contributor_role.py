"""submissions_and_contributor_role

Revision ID: 0007
Revises: 0006
Create Date: 2026-11-25 22:26:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Update users.role CHECK constraint / enum to include 'contributor'
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.alter_column(
            "role",
            existing_type=sa.Enum(
                "user",
                "organizer",
                "moderator",
                "admin",
                name="role",
                native_enum=False,
                create_constraint=True,
                length=32,
            ),
            type_=sa.Enum(
                "user",
                "contributor",
                "organizer",
                "moderator",
                "admin",
                name="role",
                native_enum=False,
                create_constraint=True,
                length=32,
            ),
            existing_nullable=False,
            existing_server_default=sa.text("'user'"),
        )

    # 2. Additive columns on opportunities
    with op.batch_alter_table("opportunities", schema=None) as batch_op:
        batch_op.add_column(sa.Column("thumbnail_url", sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column("official_website", sa.String(length=1000), nullable=True))
        batch_op.add_column(sa.Column("source_url", sa.String(length=1000), nullable=True))
        batch_op.add_column(sa.Column("organizer_contact_url", sa.String(length=1000), nullable=True))
        batch_op.add_column(sa.Column("organizer_name_override", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("registration_opens_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("team_size", sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column("tracks", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("benefits", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("additional_instructions", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("approved_by_id", sa.Uuid(), nullable=True))
        batch_op.add_column(sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("rejection_reason", sa.Text(), nullable=True))
        batch_op.create_foreign_key(
            "fk_opportunities_approved_by_id_users",
            "users",
            ["approved_by_id"],
            ["id"],
            ondelete="SET NULL",
        )

    # 3. Create contributor_access_requests table
    op.create_table(
        "contributor_access_requests",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("team_role", sa.String(length=120), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=32), server_default="pending", nullable=False),
        sa.Column("reviewed_by_id", sa.Uuid(), nullable=True),
        sa.Column("review_note", sa.Text(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reviewed_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_contributor_access_requests_user_id", "contributor_access_requests", ["user_id"])
    op.create_index("ix_contributor_access_requests_email", "contributor_access_requests", ["email"])
    op.create_index("ix_contributor_access_requests_status", "contributor_access_requests", ["status"])

    # 4. Create public_event_submissions table
    op.create_table(
        "public_event_submissions",
        sa.Column("submitted_by_user_id", sa.Uuid(), nullable=True),
        sa.Column("event_name", sa.String(length=255), nullable=False),
        sa.Column("organizer_name", sa.String(length=255), nullable=False),
        sa.Column("organizer_email", sa.String(length=255), nullable=False),
        sa.Column("organizer_organization", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column("event_format", sa.String(length=32), nullable=False),
        sa.Column("venue_location", sa.String(length=300), nullable=True),
        sa.Column("event_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("registration_deadline", sa.DateTime(timezone=True), nullable=True),
        sa.Column("registration_url", sa.String(length=1000), nullable=False),
        sa.Column("official_website", sa.String(length=1000), nullable=True),
        sa.Column("thumbnail_url", sa.String(length=500), nullable=True),
        sa.Column("expected_audience", sa.String(length=200), nullable=True),
        sa.Column("contact_info", sa.String(length=300), nullable=False),
        sa.Column("additional_details", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), server_default="pending", nullable=False),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column("reviewed_by_id", sa.Uuid(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("published_event_id", sa.Uuid(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["submitted_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["reviewed_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["published_event_id"], ["events.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_public_event_submissions_submitted_by_user_id", "public_event_submissions", ["submitted_by_user_id"])
    op.create_index("ix_public_event_submissions_organizer_email", "public_event_submissions", ["organizer_email"])
    op.create_index("ix_public_event_submissions_status", "public_event_submissions", ["status"])

    # 5. Create contact_inquiries table
    op.create_table(
        "contact_inquiries",
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("organization", sa.String(length=255), nullable=True),
        sa.Column("inquiry_type", sa.String(length=64), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("email_sent", sa.Boolean(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_contact_inquiries_email", "contact_inquiries", ["email"])


def downgrade() -> None:
    op.drop_index("ix_contact_inquiries_email", table_name="contact_inquiries")
    op.drop_table("contact_inquiries")

    op.drop_index("ix_public_event_submissions_status", table_name="public_event_submissions")
    op.drop_index("ix_public_event_submissions_organizer_email", table_name="public_event_submissions")
    op.drop_index("ix_public_event_submissions_submitted_by_user_id", table_name="public_event_submissions")
    op.drop_table("public_event_submissions")

    op.drop_index("ix_contributor_access_requests_status", table_name="contributor_access_requests")
    op.drop_index("ix_contributor_access_requests_email", table_name="contributor_access_requests")
    op.drop_index("ix_contributor_access_requests_user_id", table_name="contributor_access_requests")
    op.drop_table("contributor_access_requests")

    with op.batch_alter_table("opportunities", schema=None) as batch_op:
        batch_op.drop_constraint("fk_opportunities_approved_by_id_users", type_="foreignkey")
        batch_op.drop_column("rejection_reason")
        batch_op.drop_column("approved_at")
        batch_op.drop_column("approved_by_id")
        batch_op.drop_column("additional_instructions")
        batch_op.drop_column("benefits")
        batch_op.drop_column("tracks")
        batch_op.drop_column("team_size")
        batch_op.drop_column("registration_opens_at")
        batch_op.drop_column("organizer_name_override")
        batch_op.drop_column("organizer_contact_url")
        batch_op.drop_column("source_url")
        batch_op.drop_column("official_website")
        batch_op.drop_column("thumbnail_url")

    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.alter_column(
            "role",
            existing_type=sa.Enum(
                "user",
                "contributor",
                "organizer",
                "moderator",
                "admin",
                name="role",
                native_enum=False,
                create_constraint=True,
                length=32,
            ),
            type_=sa.Enum(
                "user",
                "organizer",
                "moderator",
                "admin",
                name="role",
                native_enum=False,
                create_constraint=True,
                length=32,
            ),
            existing_nullable=False,
            existing_server_default=sa.text("'user'"),
        )
