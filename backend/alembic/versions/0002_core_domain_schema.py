"""core domain schema

Adds the whole product data model on top of the initial `users` table:

  profiles        user_profiles
  organizations   organizations
  opportunities   opportunities, tags, opportunity_tags, saved_opportunities
  applications    applications, application_events
  trust layer     verification_requests, verification_checks, opportunity_reports
  platform        notifications, audit_logs
  users           + role, is_email_verified, last_login_at, updated_at

Enum columns are VARCHAR + named CHECK constraint (see app/models/enums.py).
To add an enum value later: drop and recreate that one CHECK in a new migration.

Revision ID: 0002
Revises: 1ed4211f50f2
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0002'
down_revision: Union[str, None] = '1ed4211f50f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('tags',
    sa.Column('name', sa.String(length=64), nullable=False),
    sa.Column('slug', sa.String(length=64), nullable=False),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_tags')),
    sa.UniqueConstraint('name', name=op.f('uq_tags_name')),
    sa.UniqueConstraint('slug', name=op.f('uq_tags_slug'))
    )
    op.create_table('audit_logs',
    sa.Column('actor_id', sa.Uuid(), nullable=True),
    sa.Column('action', sa.String(length=100), nullable=False),
    sa.Column('entity_type', sa.String(length=64), nullable=False),
    sa.Column('entity_id', sa.String(length=64), nullable=True),
    sa.Column('changes', sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'), nullable=True),
    sa.Column('ip_address', sa.String(length=45), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.ForeignKeyConstraint(['actor_id'], ['users.id'], name=op.f('fk_audit_logs_actor_id_users'), ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_audit_logs'))
    )
    op.create_index('ix_audit_logs_actor_created', 'audit_logs', ['actor_id', 'created_at'], unique=False)
    op.create_index(op.f('ix_audit_logs_created_at'), 'audit_logs', ['created_at'], unique=False)
    op.create_index('ix_audit_logs_entity', 'audit_logs', ['entity_type', 'entity_id'], unique=False)
    op.create_table('notifications',
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('type', sa.Enum('deadline_reminder', 'application_update', 'verification_update', 'new_match', 'system', name='type', native_enum=False, create_constraint=True, length=32), server_default=sa.text("'system'"), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('body', sa.Text(), nullable=True),
    sa.Column('data', sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'), nullable=True),
    sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_notifications_user_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_notifications'))
    )
    op.create_index('ix_notifications_user_created', 'notifications', ['user_id', 'created_at'], unique=False)
    op.create_index('ix_notifications_user_read', 'notifications', ['user_id', 'read_at'], unique=False)
    op.create_table('organizations',
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('slug', sa.String(length=255), nullable=False),
    sa.Column('type', sa.Enum('company', 'university', 'nonprofit', 'government', 'community', 'other', name='type', native_enum=False, create_constraint=True, length=32), server_default=sa.text("'other'"), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('website_url', sa.String(length=500), nullable=True),
    sa.Column('domain', sa.String(length=255), nullable=True),
    sa.Column('logo_url', sa.String(length=1000), nullable=True),
    sa.Column('contact_email', sa.String(length=255), nullable=True),
    sa.Column('country_code', sa.String(length=2), nullable=True),
    sa.Column('location', sa.String(length=255), nullable=True),
    sa.Column('verification_status', sa.Enum('unverified', 'pending', 'verified', 'flagged', 'rejected', name='verification_status', native_enum=False, create_constraint=True, length=32), server_default=sa.text("'unverified'"), nullable=False),
    sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_by_id', sa.Uuid(), nullable=True),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], name=op.f('fk_organizations_created_by_id_users'), ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_organizations'))
    )
    op.create_index(op.f('ix_organizations_created_by_id'), 'organizations', ['created_by_id'], unique=False)
    op.create_index(op.f('ix_organizations_domain'), 'organizations', ['domain'], unique=False)
    op.create_index(op.f('ix_organizations_slug'), 'organizations', ['slug'], unique=True)
    op.create_index('ix_organizations_verification_status', 'organizations', ['verification_status'], unique=False)
    op.create_table('user_profiles',
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('headline', sa.String(length=160), nullable=True),
    sa.Column('bio', sa.Text(), nullable=True),
    sa.Column('location', sa.String(length=255), nullable=True),
    sa.Column('country_code', sa.String(length=2), nullable=True),
    sa.Column('institution', sa.String(length=255), nullable=True),
    sa.Column('field_of_study', sa.String(length=255), nullable=True),
    sa.Column('graduation_year', sa.SmallInteger(), nullable=True),
    sa.Column('skills', sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'), nullable=True),
    sa.Column('interests', sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'), nullable=True),
    sa.Column('preferred_opportunity_types', sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'), nullable=True),
    sa.Column('linkedin_url', sa.String(length=500), nullable=True),
    sa.Column('github_url', sa.String(length=500), nullable=True),
    sa.Column('portfolio_url', sa.String(length=500), nullable=True),
    sa.Column('resume_url', sa.String(length=1000), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.CheckConstraint('graduation_year IS NULL OR (graduation_year BETWEEN 1950 AND 2100)', name=op.f('ck_user_profiles_graduation_year_range')),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_user_profiles_user_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('user_id', name=op.f('pk_user_profiles'))
    )
    op.create_table('opportunities',
    sa.Column('organization_id', sa.Uuid(), nullable=False),
    sa.Column('posted_by_id', sa.Uuid(), nullable=True),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('slug', sa.String(length=300), nullable=False),
    sa.Column('summary', sa.String(length=500), nullable=True),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('eligibility', sa.Text(), nullable=True),
    sa.Column('requirements', sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'), nullable=True),
    sa.Column('type', sa.Enum('internship', 'job', 'fellowship', 'scholarship', 'grant', 'hackathon', 'competition', 'program', 'event', 'other', name='type', native_enum=False, create_constraint=True, length=32), nullable=False),
    sa.Column('status', sa.Enum('draft', 'pending_review', 'published', 'closed', 'archived', 'rejected', name='status', native_enum=False, create_constraint=True, length=32), server_default=sa.text("'draft'"), nullable=False),
    sa.Column('location_type', sa.Enum('remote', 'onsite', 'hybrid', name='location_type', native_enum=False, create_constraint=True, length=32), nullable=True),
    sa.Column('location_text', sa.String(length=255), nullable=True),
    sa.Column('country_code', sa.String(length=2), nullable=True),
    sa.Column('application_url', sa.String(length=1000), nullable=True),
    sa.Column('deadline_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('is_rolling', sa.Boolean(), server_default=sa.false(), nullable=False),
    sa.Column('starts_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('ends_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('compensation_type', sa.Enum('paid', 'unpaid', 'stipend', 'funded', 'prize', 'unspecified', name='compensation_type', native_enum=False, create_constraint=True, length=32), server_default=sa.text("'unspecified'"), nullable=False),
    sa.Column('compensation_min', sa.Numeric(precision=12, scale=2), nullable=True),
    sa.Column('compensation_max', sa.Numeric(precision=12, scale=2), nullable=True),
    sa.Column('compensation_currency', sa.String(length=3), nullable=True),
    sa.Column('compensation_note', sa.String(length=255), nullable=True),
    sa.Column('verification_status', sa.Enum('unverified', 'pending', 'verified', 'flagged', 'rejected', name='verification_status', native_enum=False, create_constraint=True, length=32), server_default=sa.text("'unverified'"), nullable=False),
    sa.Column('trust_score', sa.SmallInteger(), nullable=True),
    sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('is_featured', sa.Boolean(), server_default=sa.false(), nullable=False),
    sa.Column('view_count', sa.Integer(), server_default=sa.text('0'), nullable=False),
    sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    sa.CheckConstraint('compensation_min IS NULL OR compensation_max IS NULL OR compensation_min <= compensation_max', name=op.f('ck_opportunities_compensation_range')),
    sa.CheckConstraint('starts_at IS NULL OR ends_at IS NULL OR starts_at <= ends_at', name=op.f('ck_opportunities_date_range')),
    sa.CheckConstraint('trust_score IS NULL OR (trust_score BETWEEN 0 AND 100)', name=op.f('ck_opportunities_trust_score_range')),
    sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], name=op.f('fk_opportunities_organization_id_organizations'), ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['posted_by_id'], ['users.id'], name=op.f('fk_opportunities_posted_by_id_users'), ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_opportunities'))
    )
    op.create_index(op.f('ix_opportunities_country_code'), 'opportunities', ['country_code'], unique=False)
    op.create_index(op.f('ix_opportunities_organization_id'), 'opportunities', ['organization_id'], unique=False)
    op.create_index(op.f('ix_opportunities_posted_by_id'), 'opportunities', ['posted_by_id'], unique=False)
    op.create_index('ix_opportunities_published_at', 'opportunities', ['published_at'], unique=False)
    op.create_index(op.f('ix_opportunities_slug'), 'opportunities', ['slug'], unique=True)
    op.create_index('ix_opportunities_status_deadline', 'opportunities', ['status', 'deadline_at'], unique=False)
    op.create_index('ix_opportunities_type_status', 'opportunities', ['type', 'status'], unique=False)
    op.create_index('ix_opportunities_verification_status', 'opportunities', ['verification_status'], unique=False)
    op.create_table('applications',
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('opportunity_id', sa.Uuid(), nullable=True),
    sa.Column('custom_title', sa.String(length=255), nullable=True),
    sa.Column('custom_organization', sa.String(length=255), nullable=True),
    sa.Column('custom_url', sa.String(length=1000), nullable=True),
    sa.Column('status', sa.Enum('interested', 'preparing', 'applied', 'under_review', 'interviewing', 'offered', 'accepted', 'rejected', 'withdrawn', name='status', native_enum=False, create_constraint=True, length=32), server_default=sa.text("'interested'"), nullable=False),
    sa.Column('priority', sa.SmallInteger(), server_default=sa.text('2'), nullable=False),
    sa.Column('applied_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('deadline_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('reminder_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('decision_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('resume_url', sa.String(length=1000), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.CheckConstraint('opportunity_id IS NOT NULL OR custom_title IS NOT NULL', name=op.f('ck_applications_has_target')),
    sa.CheckConstraint('priority BETWEEN 1 AND 3', name=op.f('ck_applications_priority_range')),
    sa.ForeignKeyConstraint(['opportunity_id'], ['opportunities.id'], name=op.f('fk_applications_opportunity_id_opportunities'), ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_applications_user_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_applications')),
    sa.UniqueConstraint('user_id', 'opportunity_id', name='uq_applications_user_opportunity')
    )
    op.create_index(op.f('ix_applications_opportunity_id'), 'applications', ['opportunity_id'], unique=False)
    op.create_index(op.f('ix_applications_user_id'), 'applications', ['user_id'], unique=False)
    op.create_index('ix_applications_user_reminder', 'applications', ['user_id', 'reminder_at'], unique=False)
    op.create_index('ix_applications_user_status', 'applications', ['user_id', 'status'], unique=False)
    op.create_table('opportunity_reports',
    sa.Column('opportunity_id', sa.Uuid(), nullable=False),
    sa.Column('reporter_id', sa.Uuid(), nullable=True),
    sa.Column('reason', sa.Enum('scam', 'expired', 'misleading', 'duplicate', 'inappropriate', 'other', name='reason', native_enum=False, create_constraint=True, length=32), nullable=False),
    sa.Column('details', sa.Text(), nullable=True),
    sa.Column('status', sa.Enum('open', 'reviewing', 'resolved', 'dismissed', name='status', native_enum=False, create_constraint=True, length=32), server_default=sa.text("'open'"), nullable=False),
    sa.Column('resolved_by_id', sa.Uuid(), nullable=True),
    sa.Column('resolution_note', sa.Text(), nullable=True),
    sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.ForeignKeyConstraint(['opportunity_id'], ['opportunities.id'], name=op.f('fk_opportunity_reports_opportunity_id_opportunities'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['reporter_id'], ['users.id'], name=op.f('fk_opportunity_reports_reporter_id_users'), ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['resolved_by_id'], ['users.id'], name=op.f('fk_opportunity_reports_resolved_by_id_users'), ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_opportunity_reports')),
    sa.UniqueConstraint('opportunity_id', 'reporter_id', 'reason', name='uq_opportunity_reports_once')
    )
    op.create_index(op.f('ix_opportunity_reports_opportunity_id'), 'opportunity_reports', ['opportunity_id'], unique=False)
    op.create_index(op.f('ix_opportunity_reports_reporter_id'), 'opportunity_reports', ['reporter_id'], unique=False)
    op.create_index('ix_opportunity_reports_status', 'opportunity_reports', ['status'], unique=False)
    op.create_table('opportunity_tags',
    sa.Column('opportunity_id', sa.Uuid(), nullable=False),
    sa.Column('tag_id', sa.Uuid(), nullable=False),
    sa.ForeignKeyConstraint(['opportunity_id'], ['opportunities.id'], name=op.f('fk_opportunity_tags_opportunity_id_opportunities'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], name=op.f('fk_opportunity_tags_tag_id_tags'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('opportunity_id', 'tag_id', name=op.f('pk_opportunity_tags'))
    )
    op.create_index(op.f('ix_opportunity_tags_tag_id'), 'opportunity_tags', ['tag_id'], unique=False)
    op.create_table('saved_opportunities',
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('opportunity_id', sa.Uuid(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.ForeignKeyConstraint(['opportunity_id'], ['opportunities.id'], name=op.f('fk_saved_opportunities_opportunity_id_opportunities'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_saved_opportunities_user_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('user_id', 'opportunity_id', name=op.f('pk_saved_opportunities'))
    )
    op.create_index(op.f('ix_saved_opportunities_opportunity_id'), 'saved_opportunities', ['opportunity_id'], unique=False)
    op.create_table('verification_requests',
    sa.Column('opportunity_id', sa.Uuid(), nullable=True),
    sa.Column('organization_id', sa.Uuid(), nullable=True),
    sa.Column('requested_by_id', sa.Uuid(), nullable=True),
    sa.Column('reviewer_id', sa.Uuid(), nullable=True),
    sa.Column('status', sa.Enum('pending', 'in_review', 'needs_info', 'approved', 'rejected', name='status', native_enum=False, create_constraint=True, length=32), server_default=sa.text("'pending'"), nullable=False),
    sa.Column('evidence', sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'), nullable=True),
    sa.Column('submitter_notes', sa.Text(), nullable=True),
    sa.Column('reviewer_notes', sa.Text(), nullable=True),
    sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.CheckConstraint('(opportunity_id IS NOT NULL AND organization_id IS NULL) OR (opportunity_id IS NULL AND organization_id IS NOT NULL)', name=op.f('ck_verification_requests_exactly_one_subject')),
    sa.ForeignKeyConstraint(['opportunity_id'], ['opportunities.id'], name=op.f('fk_verification_requests_opportunity_id_opportunities'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], name=op.f('fk_verification_requests_organization_id_organizations'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['requested_by_id'], ['users.id'], name=op.f('fk_verification_requests_requested_by_id_users'), ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['reviewer_id'], ['users.id'], name=op.f('fk_verification_requests_reviewer_id_users'), ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_verification_requests'))
    )
    op.create_index(op.f('ix_verification_requests_opportunity_id'), 'verification_requests', ['opportunity_id'], unique=False)
    op.create_index(op.f('ix_verification_requests_organization_id'), 'verification_requests', ['organization_id'], unique=False)
    op.create_index(op.f('ix_verification_requests_requested_by_id'), 'verification_requests', ['requested_by_id'], unique=False)
    op.create_index(op.f('ix_verification_requests_reviewer_id'), 'verification_requests', ['reviewer_id'], unique=False)
    op.create_index('ix_verification_requests_status', 'verification_requests', ['status'], unique=False)
    op.create_table('application_events',
    sa.Column('application_id', sa.Uuid(), nullable=False),
    sa.Column('event_type', sa.Enum('status_change', 'note', 'interview', 'follow_up', 'other', name='event_type', native_enum=False, create_constraint=True, length=32), server_default=sa.text("'note'"), nullable=False),
    sa.Column('from_status', sa.Enum('interested', 'preparing', 'applied', 'under_review', 'interviewing', 'offered', 'accepted', 'rejected', 'withdrawn', name='from_status', native_enum=False, create_constraint=True, length=32), nullable=True),
    sa.Column('to_status', sa.Enum('interested', 'preparing', 'applied', 'under_review', 'interviewing', 'offered', 'accepted', 'rejected', 'withdrawn', name='to_status', native_enum=False, create_constraint=True, length=32), nullable=True),
    sa.Column('note', sa.Text(), nullable=True),
    sa.Column('occurred_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.ForeignKeyConstraint(['application_id'], ['applications.id'], name=op.f('fk_application_events_application_id_applications'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_application_events'))
    )
    op.create_index('ix_application_events_app_time', 'application_events', ['application_id', 'occurred_at'], unique=False)
    op.create_table('verification_checks',
    sa.Column('request_id', sa.Uuid(), nullable=False),
    sa.Column('check_type', sa.Enum('domain_match', 'website_reachable', 'contact_email', 'organization_registry', 'social_presence', 'duplicate_scan', 'community_signal', 'manual_review', name='check_type', native_enum=False, create_constraint=True, length=32), nullable=False),
    sa.Column('result', sa.Enum('passed', 'failed', 'inconclusive', 'skipped', name='result', native_enum=False, create_constraint=True, length=32), nullable=False),
    sa.Column('score', sa.SmallInteger(), nullable=True),
    sa.Column('details', sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'), nullable=True),
    sa.Column('performed_by_id', sa.Uuid(), nullable=True),
    sa.Column('checked_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.CheckConstraint('score IS NULL OR (score BETWEEN 0 AND 100)', name=op.f('ck_verification_checks_score_range')),
    sa.ForeignKeyConstraint(['performed_by_id'], ['users.id'], name=op.f('fk_verification_checks_performed_by_id_users'), ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['request_id'], ['verification_requests.id'], name=op.f('fk_verification_checks_request_id_verification_requests'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_verification_checks'))
    )
    op.create_index(op.f('ix_verification_checks_request_id'), 'verification_checks', ['request_id'], unique=False)
    # --- extend the existing users table (batch mode: also works on SQLite) ---
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(
            sa.Column("role", sa.String(length=32), server_default=sa.text("'user'"), nullable=False)
        )
        batch_op.add_column(
            sa.Column("is_email_verified", sa.Boolean(), server_default=sa.false(), nullable=False)
        )
        batch_op.add_column(sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(
            sa.Column(
                "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
            )
        )
        batch_op.create_check_constraint(
            op.f("ck_users_role"), "role IN ('user', 'organizer', 'moderator', 'admin')"
        )
        batch_op.create_index(op.f("ix_users_role"), ["role"], unique=False)

    # existing rows: "last updated" should start out as "created", not "now"
    op.execute("UPDATE users SET updated_at = created_at")


def downgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_index(op.f("ix_users_role"))
        batch_op.drop_constraint(op.f("ck_users_role"), type_="check")
        batch_op.drop_column("updated_at")
        batch_op.drop_column("last_login_at")
        batch_op.drop_column("is_email_verified")
        batch_op.drop_column("role")
    op.drop_index(op.f('ix_verification_checks_request_id'), table_name='verification_checks')
    op.drop_table('verification_checks')
    op.drop_index('ix_application_events_app_time', table_name='application_events')
    op.drop_table('application_events')
    op.drop_index('ix_verification_requests_status', table_name='verification_requests')
    op.drop_index(op.f('ix_verification_requests_reviewer_id'), table_name='verification_requests')
    op.drop_index(op.f('ix_verification_requests_requested_by_id'), table_name='verification_requests')
    op.drop_index(op.f('ix_verification_requests_organization_id'), table_name='verification_requests')
    op.drop_index(op.f('ix_verification_requests_opportunity_id'), table_name='verification_requests')
    op.drop_table('verification_requests')
    op.drop_index(op.f('ix_saved_opportunities_opportunity_id'), table_name='saved_opportunities')
    op.drop_table('saved_opportunities')
    op.drop_index(op.f('ix_opportunity_tags_tag_id'), table_name='opportunity_tags')
    op.drop_table('opportunity_tags')
    op.drop_index('ix_opportunity_reports_status', table_name='opportunity_reports')
    op.drop_index(op.f('ix_opportunity_reports_reporter_id'), table_name='opportunity_reports')
    op.drop_index(op.f('ix_opportunity_reports_opportunity_id'), table_name='opportunity_reports')
    op.drop_table('opportunity_reports')
    op.drop_index('ix_applications_user_status', table_name='applications')
    op.drop_index('ix_applications_user_reminder', table_name='applications')
    op.drop_index(op.f('ix_applications_user_id'), table_name='applications')
    op.drop_index(op.f('ix_applications_opportunity_id'), table_name='applications')
    op.drop_table('applications')
    op.drop_index('ix_opportunities_verification_status', table_name='opportunities')
    op.drop_index('ix_opportunities_type_status', table_name='opportunities')
    op.drop_index('ix_opportunities_status_deadline', table_name='opportunities')
    op.drop_index(op.f('ix_opportunities_slug'), table_name='opportunities')
    op.drop_index('ix_opportunities_published_at', table_name='opportunities')
    op.drop_index(op.f('ix_opportunities_posted_by_id'), table_name='opportunities')
    op.drop_index(op.f('ix_opportunities_organization_id'), table_name='opportunities')
    op.drop_index(op.f('ix_opportunities_country_code'), table_name='opportunities')
    op.drop_table('opportunities')
    op.drop_table('user_profiles')
    op.drop_index('ix_organizations_verification_status', table_name='organizations')
    op.drop_index(op.f('ix_organizations_slug'), table_name='organizations')
    op.drop_index(op.f('ix_organizations_domain'), table_name='organizations')
    op.drop_index(op.f('ix_organizations_created_by_id'), table_name='organizations')
    op.drop_table('organizations')
    op.drop_index('ix_notifications_user_read', table_name='notifications')
    op.drop_index('ix_notifications_user_created', table_name='notifications')
    op.drop_table('notifications')
    op.drop_index('ix_audit_logs_entity', table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_created_at'), table_name='audit_logs')
    op.drop_index('ix_audit_logs_actor_created', table_name='audit_logs')
    op.drop_table('audit_logs')
    op.drop_table('tags')
