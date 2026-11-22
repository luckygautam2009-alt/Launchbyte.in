import io
import uuid
from typing import Optional

from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel

from app.dependencies.auth import CurrentUser, OptionalUser
from app.dependencies.db import DBSession
from app.models.profiles import UserProfile
from app.schemas.profiles import MyProfileRead, ProfileUpdate, PublicProfileRead
from app.schemas.teams import TeammateCandidateRead
from app.services.storage import get_storage_backend
from app.services.users.profile import (
    ProfileError,
    discover_teammates,
    get_my_profile,
    get_public_profile,
    update_my_profile,
)

router = APIRouter(tags=["profiles"])

MAX_AVATAR_SIZE = 5 * 1024 * 1024  # 5 MB
MAX_DIMENSION = 2048


class AvatarUploadResponse(BaseModel):
    avatar_url: str


def _detect_image_mime_and_ext(header: bytes) -> tuple[str, str] | None:
    stripped = header.lstrip().lower()
    if stripped.startswith(b"<svg") or stripped.startswith(b"<?xml") or b"<svg" in stripped[:256]:
        return None
    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png", "png"
    if header.startswith(b"\xff\xd8\xff"):
        return "image/jpeg", "jpg"
    if len(header) >= 12 and header[:4] == b"RIFF" and header[8:12] == b"WEBP":
        return "image/webp", "webp"
    return None


@router.get("/me/profile", response_model=MyProfileRead)
def read_my_profile(
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        return get_my_profile(db, current_user)
    except ProfileError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.put("/me/profile", response_model=MyProfileRead)
def modify_my_profile(
    data: ProfileUpdate,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        return update_my_profile(db, current_user, data)
    except ProfileError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.post("/me/profile/avatar", response_model=AvatarUploadResponse, status_code=status.HTTP_200_OK)
async def upload_avatar(
    db: DBSession,
    current_user: CurrentUser,
    file: UploadFile = File(...),
):
    content = await file.read()
    if len(content) > MAX_AVATAR_SIZE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": {"code": "FILE_TOO_LARGE", "message": f"Avatar exceeds max size of 5 MB ({len(content)} bytes)."}},
        )

    mime_ext = _detect_image_mime_and_ext(content[:64])
    if mime_ext is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": {"code": "INVALID_IMAGE_FORMAT", "message": "Only PNG, JPEG, and WebP are allowed."}},
        )

    content_type, ext = mime_ext

    try:
        raw_img = Image.open(io.BytesIO(content))
        raw_img.verify()
        img = Image.open(io.BytesIO(content))
        width, height = img.size
        if width > MAX_DIMENSION or height > MAX_DIMENSION:
            img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.Resampling.LANCZOS)

        out_buf = io.BytesIO()
        if ext == "png":
            img.save(out_buf, format="PNG", optimize=True)
        elif ext == "webp":
            img.save(out_buf, format="WEBP", quality=90)
        else:
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            img.save(out_buf, format="JPEG", quality=90)

        clean_bytes = out_buf.getvalue()
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": {"code": "CORRUPT_IMAGE", "message": f"Cannot process image: {exc}"}},
        )

    filename = f"avatar-{current_user.id.hex}-{uuid.uuid4().hex[:8]}.{ext}"
    storage = get_storage_backend()
    url = storage.save(clean_bytes, filename, content_type)

    prof = db.get(UserProfile, current_user.id)
    if not prof:
        prof = UserProfile(user_id=current_user.id, avatar_url=url)
        db.add(prof)
    else:
        prof.avatar_url = url
    db.commit()

    return AvatarUploadResponse(avatar_url=url)


@router.get("/profiles/{handle}", response_model=PublicProfileRead)
def read_public_profile(
    handle: str,
    db: DBSession,
    viewer: OptionalUser = None,
):
    try:
        return get_public_profile(db, handle, viewer)
    except ProfileError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.get("/people/discover", response_model=list[TeammateCandidateRead])
def search_teammates(
    db: DBSession,
    viewer: OptionalUser = None,
    event_id: Optional[uuid.UUID] = Query(None),
    skills: Optional[list[str]] = Query(None),
    q: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
):
    try:
        return discover_teammates(
            db=db,
            current_user=viewer,
            event_id=event_id,
            skills=skills,
            q=q,
            limit=limit,
        )
    except ProfileError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )
