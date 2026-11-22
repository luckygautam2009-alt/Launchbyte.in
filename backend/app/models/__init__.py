"""
Importing this package registers every model on `Base.metadata`.

`alembic/env.py` and `tests/conftest.py` both do `import app.models`, so a new
model module only has to be added HERE to be picked up by migrations and tests.
"""
from app.models.applications import Application, ApplicationEvent
from app.models.audit import AuditLog
from app.models.auth_tokens import EmailVerificationToken, PasswordResetToken
from app.models.events import CheckInLog, CheckInResult, Event, EventMode, EventRegistration, EventStaff, EventStaffRole, EventStatus, RegistrationStatus
from app.models.media import MediaAsset
from app.models.networking import (
    CollabRequestStatus,
    Connection,
    ConnectionStatus,
    Conversation,
    ConversationParticipant,
    ConversationType,
    Message,
    MessageReport,
    Project,
    ProjectCollabRequest,
    ProjectMember,
    ProjectMemberRole,
    ProjectStatus,
    ProjectVisibility,
    ReportStatus,
    Team,
    TeamInvite,
    TeamInviteStatus,
    TeamJoinRequest,
    TeamJoinRequestStatus,
    TeamMember,
    TeamMemberRole,
    TeamStatus,
    TeamVisibility,
    UserBlock,
)
from app.models.notifications import Notification
from app.models.opportunities import Opportunity, SavedOpportunity, Tag, opportunity_tags
from app.models.organizations import Organization, OrganizationMember
from app.models.profiles import UserProfile
from app.models.team import SiteTeamMember
from app.models.users import User
from app.models.verification import OpportunityReport, VerificationCheck, VerificationRequest

__all__ = [
    "Application",
    "ApplicationEvent",
    "AuditLog",
    "CheckInLog",
    "CheckInResult",
    "EmailVerificationToken",
    "Event",
    "EventMode",
    "EventRegistration",
    "EventStaff",
    "EventStaffRole",
    "EventStatus",
    "MediaAsset",
    "Notification",
    "Opportunity",
    "OpportunityReport",
    "Organization",
    "OrganizationMember",
    "PasswordResetToken",
    "RegistrationStatus",
    "SavedOpportunity",
    "SiteTeamMember",
    "Tag",
    "Team",
    "TeamInvite",
    "TeamInviteStatus",
    "TeamJoinRequest",
    "TeamJoinRequestStatus",
    "TeamMember",
    "TeamMemberRole",
    "TeamStatus",
    "TeamVisibility",
    "User",
    "UserProfile",
    "VerificationCheck",
    "VerificationRequest",
    "opportunity_tags",
]
