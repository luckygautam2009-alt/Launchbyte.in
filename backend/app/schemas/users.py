import uuid

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from app.models.enums import UserRole


class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = None
    handle: str | None = None


class UserCreate(UserBase):
    # bcrypt only uses the first 72 bytes; cap length to keep hashing cheap to abuse-proof.
    password: str = Field(min_length=8, max_length=128)
    handle: str | None = Field(default=None, min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9_]+$")


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    is_active: bool
    role: UserRole
    is_email_verified: bool
    handle: str | None = None
    avatar_url: str | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str | None = None
    role: str | None = None
    token_version: int | None = None


class EmailVerificationConfirm(BaseModel):
    code: str | None = Field(default=None, min_length=6, max_length=6, pattern=r"^\d{6}$")
    token: str | None = Field(default=None, min_length=1)

    @model_validator(mode="after")
    def _require_code_or_token(self) -> "EmailVerificationConfirm":
        if not self.code and not self.token:
            raise ValueError("Either a 6-digit 'code' or 'token' is required.")
        return self


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)


class MessageResponse(BaseModel):
    message: str
