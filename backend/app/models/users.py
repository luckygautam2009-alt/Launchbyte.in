import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, String, false, func, text
from sqlalchemy import Uuid as SAUuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import UserRole
from app.models.types import enum_type

if TYPE_CHECKING:
    from app.models.applications import Application
    from app.models.notifications import Notification
    from app.models.opportunities import SavedOpportunity
    from app.models.profiles import UserProfile


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # --- added after the initial users migration ---
    role: Mapped[UserRole] = mapped_column(
        enum_type(UserRole, "role"),
        default=UserRole.USER,
        server_default=text("'user'"),
        nullable=False,
        index=True,
    )
    is_email_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=false(), nullable=False
    )
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # --- relationships (children are removed with the user; the DB enforces
    # this with ON DELETE CASCADE, `passive_deletes` lets it do the work) ---
    profile: Mapped["UserProfile | None"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan", passive_deletes=True
    )
    applications: Mapped[list["Application"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )
    saved_opportunities: Mapped[list["SavedOpportunity"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )
    notifications: Mapped[list["Notification"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )

    @property
    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN

    @property
    def is_staff(self) -> bool:
        return self.role in (UserRole.MODERATOR, UserRole.ADMIN)
