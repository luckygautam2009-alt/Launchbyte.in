"""phase4_networking_messaging_projects

Revision ID: 0005
Revises: 0004
Create Date: 2026-11-22 13:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0005'
down_revision: Union[str, None] = '0004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add handle column to users
    op.add_column('users', sa.Column('handle', sa.String(length=50), nullable=True))
    op.create_index(op.f('ix_users_handle'), 'users', ['handle'], unique=True)

    # 2. Connections
    op.create_table(
        'connections',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('requester_id', sa.Uuid(), nullable=False),
        sa.Column('addressee_id', sa.Uuid(), nullable=False),
        sa.Column(
            'status',
            sa.Enum('pending', 'accepted', 'declined', 'cancelled', name='connection_status', native_enum=False, create_constraint=True, length=32),
            server_default=sa.text("'pending'"),
            nullable=False
        ),
        sa.Column('message', sa.String(length=500), nullable=True),
        sa.Column('responded_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['addressee_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['requester_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('requester_id <> addressee_id', name='ck_connection_no_self')
    )
    op.create_index(op.f('ix_connections_requester_id'), 'connections', ['requester_id'], unique=False)
    op.create_index(op.f('ix_connections_addressee_id'), 'connections', ['addressee_id'], unique=False)
    op.create_index(op.f('ix_connections_status'), 'connections', ['status'], unique=False)
    op.create_index(
        'uq_connections_canonical_pair',
        'connections',
        [
            sa.text('((CASE WHEN requester_id < addressee_id THEN requester_id ELSE addressee_id END))'),
            sa.text('((CASE WHEN requester_id < addressee_id THEN addressee_id ELSE requester_id END))'),
        ],
        unique=True
    )

    # 3. User Blocks
    op.create_table(
        'user_blocks',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('blocker_id', sa.Uuid(), nullable=False),
        sa.Column('blocked_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['blocked_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['blocker_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('blocker_id <> blocked_id', name='ck_block_no_self'),
        sa.UniqueConstraint('blocker_id', 'blocked_id', name='uq_blocker_blocked')
    )
    op.create_index(op.f('ix_user_blocks_blocker_id'), 'user_blocks', ['blocker_id'], unique=False)
    op.create_index(op.f('ix_user_blocks_blocked_id'), 'user_blocks', ['blocked_id'], unique=False)

    # 4. Teams
    op.create_table(
        'teams',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('slug', sa.String(length=120), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('avatar_url', sa.String(length=500), nullable=True),
        sa.Column('created_by_id', sa.Uuid(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_teams_slug'), 'teams', ['slug'], unique=True)

    # 5. Team Members
    op.create_table(
        'team_members',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('team_id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column(
            'role',
            sa.Enum('leader', 'member', name='team_member_role', native_enum=False, create_constraint=True, length=32),
            server_default=sa.text("'member'"),
            nullable=False
        ),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('team_id', 'user_id', name='uq_team_user')
    )
    op.create_index(op.f('ix_team_members_team_id'), 'team_members', ['team_id'], unique=False)
    op.create_index(op.f('ix_team_members_user_id'), 'team_members', ['user_id'], unique=False)

    # 6. Conversations
    op.create_table(
        'conversations',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column(
            'type',
            sa.Enum('direct', 'team', name='conversation_type', native_enum=False, create_constraint=True, length=32),
            server_default=sa.text("'direct'"),
            nullable=False
        ),
        sa.Column('team_id', sa.Uuid(), nullable=True),
        sa.Column('user_a_id', sa.Uuid(), nullable=True),
        sa.Column('user_b_id', sa.Uuid(), nullable=True),
        sa.Column('title', sa.String(length=120), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_a_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_b_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('team_id', name='uq_conversations_team_id'),
        sa.UniqueConstraint('user_a_id', 'user_b_id', name='uq_direct_conversation_pair')
    )
    op.create_index(op.f('ix_conversations_type'), 'conversations', ['type'], unique=False)

    # 7. Conversation Participants
    op.create_table(
        'conversation_participants',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('conversation_id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('last_read_message_id', sa.Uuid(), nullable=True),
        sa.Column('muted', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('left_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('conversation_id', 'user_id', name='uq_conv_participant')
    )
    op.create_index(op.f('ix_conversation_participants_conversation_id'), 'conversation_participants', ['conversation_id'], unique=False)
    op.create_index(op.f('ix_conversation_participants_user_id'), 'conversation_participants', ['user_id'], unique=False)

    # 8. Messages
    op.create_table(
        'messages',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('conversation_id', sa.Uuid(), nullable=False),
        sa.Column('sender_id', sa.Uuid(), nullable=True),
        sa.Column('client_msg_id', sa.String(length=100), nullable=True),
        sa.Column('body', sa.String(length=2000), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('edited_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_messages_conversation_id'), 'messages', ['conversation_id'], unique=False)
    op.create_index(op.f('ix_messages_sender_id'), 'messages', ['sender_id'], unique=False)
    op.create_index(op.f('ix_messages_client_msg_id'), 'messages', ['client_msg_id'], unique=False)
    op.create_index(op.f('ix_messages_created_at'), 'messages', ['created_at'], unique=False)
    op.create_index('ix_messages_conv_created', 'messages', ['conversation_id', 'created_at'], unique=False)

    # 9. Message Reports
    op.create_table(
        'message_reports',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('message_id', sa.Uuid(), nullable=False),
        sa.Column('reporter_id', sa.Uuid(), nullable=False),
        sa.Column('reason', sa.String(length=500), nullable=False),
        sa.Column(
            'status',
            sa.Enum('pending', 'reviewed', 'dismissed', 'actioned', name='message_report_status', native_enum=False, create_constraint=True, length=32),
            server_default=sa.text("'pending'"),
            nullable=False
        ),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_by_id', sa.Uuid(), nullable=True),
        sa.ForeignKeyConstraint(['message_id'], ['messages.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reporter_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['resolved_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('message_id', 'reporter_id', name='uq_message_reporter')
    )
    op.create_index(op.f('ix_message_reports_message_id'), 'message_reports', ['message_id'], unique=False)
    op.create_index(op.f('ix_message_reports_reporter_id'), 'message_reports', ['reporter_id'], unique=False)
    op.create_index(op.f('ix_message_reports_status'), 'message_reports', ['status'], unique=False)

    # 10. Projects
    op.create_table(
        'projects',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('title', sa.String(length=120), nullable=False),
        sa.Column('slug', sa.String(length=140), nullable=False),
        sa.Column('summary', sa.String(length=255), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('repo_url', sa.String(length=500), nullable=True),
        sa.Column('demo_url', sa.String(length=500), nullable=True),
        sa.Column('tech_stack', sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'), nullable=True),
        sa.Column('looking_for', sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'), nullable=True),
        sa.Column(
            'status',
            sa.Enum('idea', 'building', 'shipped', 'archived', name='project_status', native_enum=False, create_constraint=True, length=32),
            server_default=sa.text("'idea'"),
            nullable=False
        ),
        sa.Column('owner_id', sa.Uuid(), nullable=False),
        sa.Column('team_id', sa.Uuid(), nullable=True),
        sa.Column(
            'visibility',
            sa.Enum('public', 'connections', 'private', name='project_visibility', native_enum=False, create_constraint=True, length=32),
            server_default=sa.text("'public'"),
            nullable=False
        ),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_projects_slug'), 'projects', ['slug'], unique=True)
    op.create_index(op.f('ix_projects_owner_id'), 'projects', ['owner_id'], unique=False)
    op.create_index(op.f('ix_projects_status'), 'projects', ['status'], unique=False)
    op.create_index(op.f('ix_projects_visibility'), 'projects', ['visibility'], unique=False)

    # 11. Project Members
    op.create_table(
        'project_members',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('project_id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column(
            'role',
            sa.Enum('owner', 'collaborator', name='project_member_role', native_enum=False, create_constraint=True, length=32),
            server_default=sa.text("'collaborator'"),
            nullable=False
        ),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('project_id', 'user_id', name='uq_project_user')
    )
    op.create_index(op.f('ix_project_members_project_id'), 'project_members', ['project_id'], unique=False)
    op.create_index(op.f('ix_project_members_user_id'), 'project_members', ['user_id'], unique=False)

    # 12. Project Collab Requests
    op.create_table(
        'project_collab_requests',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('project_id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('message', sa.String(length=500), nullable=True),
        sa.Column(
            'status',
            sa.Enum('pending', 'accepted', 'rejected', 'withdrawn', name='collab_request_status', native_enum=False, create_constraint=True, length=32),
            server_default=sa.text("'pending'"),
            nullable=False
        ),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('responded_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_project_collab_requests_project_id'), 'project_collab_requests', ['project_id'], unique=False)
    op.create_index(op.f('ix_project_collab_requests_user_id'), 'project_collab_requests', ['user_id'], unique=False)
    op.create_index(op.f('ix_project_collab_requests_status'), 'project_collab_requests', ['status'], unique=False)
    op.create_index(
        'uq_pending_collab_request',
        'project_collab_requests',
        ['project_id', 'user_id'],
        unique=True,
        sqlite_where=sa.column('status') == 'pending',
        postgresql_where=sa.text("status = 'pending'")
    )


def downgrade() -> None:
    op.drop_table('project_collab_requests')
    op.drop_table('project_members')
    op.drop_table('projects')
    op.drop_table('message_reports')
    op.drop_table('messages')
    op.drop_table('conversation_participants')
    op.drop_table('conversations')
    op.drop_table('team_members')
    op.drop_table('teams')
    op.drop_table('user_blocks')
    op.drop_table('connections')
    op.drop_index(op.f('ix_users_handle'), table_name='users')
    op.drop_column('users', 'handle')
