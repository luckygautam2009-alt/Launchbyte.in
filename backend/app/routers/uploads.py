import io
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel

from app.core.rate_limit import rate_limit
from app.dependencies.auth import OrganizerUser
from app.dependencies.db import DBSession
from app.models.media import MediaAsset
from app.services.storage import get_storage_backend

router = APIRouter(prefix="/uploads", tags=["uploads"])

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
MAX_DIMENSION = 4096
Image.MAX_IMAGE_PIXELS = 25_000_000  # Mitigate decompression image bombs


async def read_bounded_upload(file: UploadFile, max_bytes: int = MAX_FILE_SIZE) -> bytes:
    """Read upload in bounded chunks to prevent large payload memory exhaustion."""
    chunks: list[bytes] = []
    total = 0
    while True:
        chunk = await file.read(256 * 1024)
        if not chunk:
            break
        total += len(chunk)
        if total > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"File exceeds maximum size of {max_bytes // (1024 * 1024)} MB.",
            )
        chunks.append(chunk)
    return b"".join(chunks)


class ImageUploadResponse(BaseModel):
    url: str
    width: int
    height: int


def _detect_mime_and_ext(header: bytes) -> tuple[str, str] | None:
    """Detect allowed image type by magic bytes. Rejects SVG and all other formats."""
    # Reject SVGs explicitly
    stripped = header.lstrip().lower()
    if (
        stripped.startswith(b"<svg")
        or stripped.startswith(b"<?xml")
        or b"<svg" in stripped[:256]
    ):
        return None

    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png", "png"
    if header.startswith(b"\xff\xd8\xff"):
        return "image/jpeg", "jpg"
    if len(header) >= 12 and header[:4] == b"RIFF" and header[8:12] == b"WEBP":
        return "image/webp", "webp"
    return None


@router.post(
    "/images",
    response_model=ImageUploadResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit(max_requests=20, window_seconds=60))],
)
async def upload_image(
    db: DBSession,
    user: OrganizerUser,
    file: UploadFile = File(...),
) -> ImageUploadResponse:
    content = await read_bounded_upload(file, MAX_FILE_SIZE)

    mime_ext = _detect_mime_and_ext(content[:64])
    if mime_ext is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid image format. Only PNG, JPEG, and WebP images are allowed (SVG and non-images are rejected).",
        )

    content_type, ext = mime_ext

    try:
        raw_img = Image.open(io.BytesIO(content))
        raw_img.verify()

        # Re-open for transformation (verify invalidates the stream)
        img = Image.open(io.BytesIO(content))
        width, height = img.size

        if width > MAX_DIMENSION or height > MAX_DIMENSION:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Image dimensions ({width}x{height}) exceed maximum allowed of {MAX_DIMENSION}x{MAX_DIMENSION}.",
            )

        # Re-encode image from pixel buffer to strip EXIF and embedded payloads
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
            detail=f"Corrupt or unparseable image file: {exc}",
        ) from exc

    random_filename = f"{uuid.uuid4().hex}.{ext}"
    storage = get_storage_backend()
    try:
        file_url = storage.save(clean_bytes, random_filename, content_type)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error": {"code": "STORAGE_UPLOAD_FAILED", "message": str(exc) or "Failed to upload image to storage."}},
        ) from exc

    asset = MediaAsset(
        uploaded_by_id=user.id,
        url=file_url,
        kind="image",
        width=width,
        height=height,
        size_bytes=len(clean_bytes),
    )
    db.add(asset)
    db.commit()

    return ImageUploadResponse(url=file_url, width=width, height=height)
