"""
Domain enumerations.

Stored in the database as short VARCHARs guarded by CHECK constraints (not
native Postgres ENUM types). Reason: adding a value later is a one-line
constraint swap in a migration, whereas `ALTER TYPE ... ADD VALUE` cannot run
inside a transaction on older Postgres versions and can never remove a value.

The string *values* are what is stored and what the API will expose.
"""
import enum


class _StrEnum(str, enum.Enum):
    def __str__(self) -> str:  # pragma: no cover - cosmetic
        return self.value


class UserRole(_StrEnum):
    USER = "user"              # student / seeker — the default
    ORGANIZER = "organizer"    # can post opportunities for their organization
    MODERATOR = "moderator"    # reviews postings, verification, reports
    ADMIN = "admin"            # everything


class OrganizationType(_StrEnum):
    COMPANY = "company"
    UNIVERSITY = "university"
    NONPROFIT = "nonprofit"
    GOVERNMENT = "government"
    COMMUNITY = "community"
    OTHER = "other"


class OpportunityType(_StrEnum):
    INTERNSHIP = "internship"
    JOB = "job"
    FELLOWSHIP = "fellowship"
    SCHOLARSHIP = "scholarship"
    GRANT = "grant"
    HACKATHON = "hackathon"
    COMPETITION = "competition"
    PROGRAM = "program"
    EVENT = "event"
    OTHER = "other"


class OpportunityStatus(_StrEnum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    PUBLISHED = "published"
    CLOSED = "closed"          # deadline passed / organizer closed it
    ARCHIVED = "archived"
    REJECTED = "rejected"      # moderator rejected the posting


class LocationType(_StrEnum):
    REMOTE = "remote"
    ONSITE = "onsite"
    HYBRID = "hybrid"


class CompensationType(_StrEnum):
    PAID = "paid"
    UNPAID = "unpaid"
    STIPEND = "stipend"
    FUNDED = "funded"          # scholarships / grants / fully-funded programs
    PRIZE = "prize"            # hackathons / competitions
    UNSPECIFIED = "unspecified"


class VerificationStatus(_StrEnum):
    """Denormalized trust state shown on organizations and opportunities."""
    UNVERIFIED = "unverified"
    PENDING = "pending"
    VERIFIED = "verified"
    FLAGGED = "flagged"        # community reports / failed checks
    REJECTED = "rejected"


class ApplicationStatus(_StrEnum):
    INTERESTED = "interested"
    PREPARING = "preparing"
    APPLIED = "applied"
    UNDER_REVIEW = "under_review"
    INTERVIEWING = "interviewing"
    OFFERED = "offered"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class ApplicationEventType(_StrEnum):
    STATUS_CHANGE = "status_change"
    NOTE = "note"
    INTERVIEW = "interview"
    FOLLOW_UP = "follow_up"
    OTHER = "other"


class VerificationRequestStatus(_StrEnum):
    PENDING = "pending"
    IN_REVIEW = "in_review"
    NEEDS_INFO = "needs_info"
    APPROVED = "approved"
    REJECTED = "rejected"


class VerificationCheckType(_StrEnum):
    DOMAIN_MATCH = "domain_match"                # posting link domain == org domain
    WEBSITE_REACHABLE = "website_reachable"
    CONTACT_EMAIL = "contact_email"              # org email on org domain
    ORGANIZATION_REGISTRY = "organization_registry"
    SOCIAL_PRESENCE = "social_presence"
    DUPLICATE_SCAN = "duplicate_scan"
    COMMUNITY_SIGNAL = "community_signal"
    MANUAL_REVIEW = "manual_review"


class VerificationCheckResult(_StrEnum):
    PASSED = "passed"
    FAILED = "failed"
    INCONCLUSIVE = "inconclusive"
    SKIPPED = "skipped"


class ReportReason(_StrEnum):
    SCAM = "scam"
    EXPIRED = "expired"
    MISLEADING = "misleading"
    DUPLICATE = "duplicate"
    INAPPROPRIATE = "inappropriate"
    OTHER = "other"


class ReportStatus(_StrEnum):
    OPEN = "open"
    REVIEWING = "reviewing"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class NotificationType(_StrEnum):
    DEADLINE_REMINDER = "deadline_reminder"
    APPLICATION_UPDATE = "application_update"
    VERIFICATION_UPDATE = "verification_update"
    NEW_MATCH = "new_match"
    SYSTEM = "system"
