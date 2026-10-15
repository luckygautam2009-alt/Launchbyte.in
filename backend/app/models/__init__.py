"""
Importing this package registers every model on `Base.metadata`.

`alembic/env.py` and `tests/conftest.py` both do `import app.models`, so a new
model module only has to be added HERE to be picked up by migrations and tests.
"""
from app.models.applications import Application, ApplicationEvent
from app.models.audit import AuditLog
from app.models.notifications import Notification
from app.models.opportunities import Opportunity, SavedOpportunity, Tag, opportunity_tags
from app.models.organizations import Organization
from app.models.profiles import UserProfile
from app.models.users import User
from app.models.verification import OpportunityReport, VerificationCheck, VerificationRequest

__all__ = [
    "Application",
    "ApplicationEvent",
    "AuditLog",
    "Notification",
    "Opportunity",
    "OpportunityReport",
    "Organization",
    "SavedOpportunity",
    "Tag",
    "User",
    "UserProfile",
    "VerificationCheck",
    "VerificationRequest",
    "opportunity_tags",
]
