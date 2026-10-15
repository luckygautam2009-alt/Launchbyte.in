import uuid
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, SmallInteger, String, Text
from sqlalchemy import Uuid as SAUuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.types import JSONType, TimestampMixin

if TYPE_CHECKING:
    from app.models.users import User


class UserProfile(TimestampMixin, Base):
    """
    Optional seeker details, 1:1 with users. Split out of `users` so the auth
    table stays small and hot, and so profile fields can grow freely.
    """

    __tablename__ = "user_profiles"
    __table_args__ = (
        CheckConstraint(
            "graduation_year IS NULL OR (graduation_year BETWEEN 1950 AND 2100)",
            name="graduation_year_range",
        ),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    headline: Mapped[str | None] = mapped_column(String(160))
    bio: Mapped[str | None] = mapped_column(Text)
    location: Mapped[str | None] = mapped_column(String(255))
    country_code: Mapped[str | None] = mapped_column(String(2))  # ISO 3166-1 alpha-2

    institution: Mapped[str | None] = mapped_column(String(255))
    field_of_study: Mapped[str | None] = mapped_column(String(255))
    graduation_year: Mapped[int | None] = mapped_column(SmallInteger)

    skills: Mapped[list | None] = mapped_column(JSONType)                 # ["python", "sql"]
    interests: Mapped[list | None] = mapped_column(JSONType)              # ["ai", "climate"]
    preferred_opportunity_types: Mapped[list | None] = mapped_column(JSONType)  # OpportunityType values

    linkedin_url: Mapped[str | None] = mapped_column(String(500))
    github_url: Mapped[str | None] = mapped_column(String(500))
    portfolio_url: Mapped[str | None] = mapped_column(String(500))
    resume_url: Mapped[str | None] = mapped_column(String(1000))

    user: Mapped["User"] = relationship(back_populates="profile")
