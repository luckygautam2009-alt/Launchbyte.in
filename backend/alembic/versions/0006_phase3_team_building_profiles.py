"""phase3_team_building_profiles

Revision ID: 0006
Revises: 0005
Create Date: 2026-11-22 14:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0006'
down_revision: Union[str, None] = '0005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users: handle_updated_at
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('handle_updated_at', sa.DateTime(timezone=True), nullable=True))

    # 2. user_profiles: avatar, open_to_teams, looking_for_roles, availability_note, is_public, privacy
    with op.batch_alter_table('user_profiles', schema=None) as batch_op:
        batch_op.add_column(sa.Column('avatar_url', sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column('open_to_teams', sa.Boolean(), server_default=sa.text('false'), nullable=False))
        batch_op.add_column(
            sa.Column('looking_for_roles', sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'), nullable=True)
        )
        batch_op.add_column(sa.Column('availability_note', sa.String(length=280), nullable=True))
        batch_op.add_column(sa.Column('is_public', sa.Boolean(), server_default=sa.text('true'), nullable=False))
        batch_op.add_column(sa.Column('show_linkedin', sa.Boolean(), server_default=sa.text('true'), nullable=False))
        batch_op.add_column(sa.Column('show_github', sa.Boolean(), server_default=sa.text('true'), nullable=False))

    # 3. teams: event_id, owner_id, visibility, accepting_requests, max_size, looking_for_skills, status, is_locked, deleted_at
    with op.batch_alter_table('teams', schema=None) as batch_op:
        batch_op.add_column(sa.Column('event_id', sa.Uuid(), nullable=True))
        batch_op.add_column(sa.Column('owner_id', sa.Uuid(), nullable=True))
        batch_op.add_column(
            sa.Column(
                'visibility',
                sa.Enum('public', 'private', name='team_visibility', native_enum=False, create_constraint=True, length=32),
                server_default=sa.text("'public'"),
                nullable=False
            )
        )
        batch_op.add_column(sa.Column('accepting_requests', sa.Boolean(), server_default=sa.text('true'), nullable=False))
        batch_op.add_column(sa.Column('max_size', sa.Integer(), server_default=sa.text('4'), nullable=False))
        batch_op.add_column(
            sa.Column('looking_for_skills', sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'), nullable=True)
        )
        batch_op.add_column(
            sa.Column(
                'status',
                sa.Enum('active', 'disbanded', name='team_status', native_enum=False, create_constraint=True, length=32),
                server_default=sa.text("'active'"),
                nullable=False
            )
        )
        batch_op.add_column(sa.Column('is_locked', sa.Boolean(), server_default=sa.text('false'), nullable=False))
        batch_op.add_column(sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))

        batch_op.create_foreign_key('fk_teams_event_id_events', 'events', ['event_id'], ['id'], ondelete='SET NULL')
        batch_op.create_foreign_key('fk_teams_owner_id_users', 'users', ['owner_id'], ['id'], ondelete='CASCADE')
        batch_op.create_index(batch_op.f('ix_teams_event_id'), ['event_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_teams_owner_id'), ['owner_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_teams_status'), ['status'], unique=False)

    # 4. team_members: event_id & partial unique index
    with op.batch_alter_table('team_members', schema=None) as batch_op:
        batch_op.add_column(sa.Column('event_id', sa.Uuid(), nullable=True))
        batch_op.create_foreign_key('fk_team_members_event_id_events', 'events', ['event_id'], ['id'], ondelete='SET NULL')
        batch_op.create_index(batch_op.f('ix_team_members_event_id'), ['event_id'], unique=False)
        batch_op.create_index(
            'uq_team_members_event_user',
            ['event_id', 'user_id'],
            unique=True,
            postgresql_where=sa.text('event_id IS NOT NULL'),
            sqlite_where=sa.text('event_id IS NOT NULL')
        )

    # 5. team_invites table
    op.create_table(
        'team_invites',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('team_id', sa.Uuid(), nullable=False),
        sa.Column('invited_user_id', sa.Uuid(), nullable=True),
        sa.Column('invited_email', sa.String(length=255), nullable=True),
        sa.Column('invited_by_id', sa.Uuid(), nullable=False),
        sa.Column('token', sa.String(length=255), nullable=True),
        sa.Column('message', sa.String(length=280), nullable=True),
        sa.Column(
            'status',
            sa.Enum('pending', 'accepted', 'declined', 'revoked', 'expired', name='team_invite_status', native_enum=False, create_constraint=True, length=32),
            server_default=sa.text("'pending'"),
            nullable=False
        ),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['invited_by_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['invited_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('team_invites', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_team_invites_team_id'), ['team_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_team_invites_invited_user_id'), ['invited_user_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_team_invites_status'), ['status'], unique=False)
        batch_op.create_index(
            'uq_team_invite_pending',
            ['team_id', 'invited_user_id'],
            unique=True,
            postgresql_where=sa.text("status = 'pending' AND invited_user_id IS NOT NULL"),
            sqlite_where=sa.text("status = 'pending' AND invited_user_id IS NOT NULL")
        )

    # 6. team_join_requests table
    op.create_table(
        'team_join_requests',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('team_id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('message', sa.String(length=280), nullable=True),
        sa.Column(
            'status',
            sa.Enum('pending', 'accepted', 'rejected', 'withdrawn', name='team_join_request_status', native_enum=False, create_constraint=True, length=32),
            server_default=sa.text("'pending'"),
            nullable=False
        ),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('team_join_requests', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_team_join_requests_team_id'), ['team_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_team_join_requests_user_id'), ['user_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_team_join_requests_status'), ['status'], unique=False)
        batch_op.create_index(
            'uq_team_join_request_pending',
            ['team_id', 'user_id'],
            unique=True,
            postgresql_where=sa.text("status = 'pending'"),
            sqlite_where=sa.text("status = 'pending'")
        )


def downgrade() -> None:
    op.drop_table('team_join_requests')
    op.drop_table('team_invites')

    bind = op.get_bind()
    if bind.dialect.name == "sqlite":
        with op.batch_alter_table('team_members', schema=None) as batch_op:
            batch_op.drop_index('uq_team_members_event_user')
            batch_op.drop_index(batch_op.f('ix_team_members_event_id'))
            batch_op.drop_column('event_id')

        op.execute("""
            CREATE TABLE teams_dg (
                id CHAR(32) NOT NULL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                slug VARCHAR(120) NOT NULL,
                description TEXT,
                avatar_url VARCHAR(500),
                created_by_id CHAR(32) REFERENCES users(id) ON DELETE SET NULL,
                created_at DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                updated_at DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP)
            )
        """)
        op.execute("INSERT INTO teams_dg SELECT id, name, slug, description, avatar_url, created_by_id, created_at, updated_at FROM teams")
        op.execute("DROP TABLE teams")
        op.execute("ALTER TABLE teams_dg RENAME TO teams")
        op.execute("CREATE UNIQUE INDEX ix_teams_slug ON teams(slug)")

        with op.batch_alter_table('user_profiles', schema=None) as batch_op:
            batch_op.drop_column('show_github')
            batch_op.drop_column('show_linkedin')
            batch_op.drop_column('is_public')
            batch_op.drop_column('availability_note')
            batch_op.drop_column('looking_for_roles')
            batch_op.drop_column('open_to_teams')
            batch_op.drop_column('avatar_url')

        with op.batch_alter_table('users', schema=None) as batch_op:
            batch_op.drop_column('handle_updated_at')
    else:
        with op.batch_alter_table('team_members', schema=None) as batch_op:
            batch_op.drop_index('uq_team_members_event_user')
            batch_op.drop_index(batch_op.f('ix_team_members_event_id'))
            batch_op.drop_constraint('fk_team_members_event_id_events', type_='foreignkey')
            batch_op.drop_column('event_id')

        with op.batch_alter_table('teams', schema=None) as batch_op:
            batch_op.drop_index(batch_op.f('ix_teams_status'))
            batch_op.drop_index(batch_op.f('ix_teams_owner_id'))
            batch_op.drop_index(batch_op.f('ix_teams_event_id'))
            batch_op.drop_constraint('fk_teams_owner_id_users', type_='foreignkey')
            batch_op.drop_constraint('fk_teams_event_id_events', type_='foreignkey')
            batch_op.drop_column('deleted_at')
            batch_op.drop_column('is_locked')
            batch_op.drop_column('status')
            batch_op.drop_column('looking_for_skills')
            batch_op.drop_column('max_size')
            batch_op.drop_column('accepting_requests')
            batch_op.drop_column('visibility')
            batch_op.drop_column('owner_id')
            batch_op.drop_column('event_id')

        with op.batch_alter_table('user_profiles', schema=None) as batch_op:
            batch_op.drop_column('show_github')
            batch_op.drop_column('show_linkedin')
            batch_op.drop_column('is_public')
            batch_op.drop_column('availability_note')
            batch_op.drop_column('looking_for_roles')
            batch_op.drop_column('open_to_teams')
            batch_op.drop_column('avatar_url')

        with op.batch_alter_table('users', schema=None) as batch_op:
            batch_op.drop_column('handle_updated_at')
