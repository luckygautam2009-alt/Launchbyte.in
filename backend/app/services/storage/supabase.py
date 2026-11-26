import logging
import httpx

from app.core.config import get_settings
from app.services.storage.base import StorageBackend

logger = logging.getLogger(__name__)


class SupabaseStorageBackend(StorageBackend):
    def __init__(self):
        settings = get_settings()
        self.supabase_url = settings.SUPABASE_URL.strip().rstrip("/")
        self.service_key = settings.SUPABASE_SERVICE_ROLE_KEY.strip()
        self.bucket = (settings.SUPABASE_STORAGE_BUCKET or "media").strip()

    def save(self, content: bytes, filename: str, content_type: str) -> str:
        if not self.supabase_url or not self.service_key:
            raise RuntimeError("Supabase storage is not configured (missing SUPABASE_URL or key).")

        url = f"{self.supabase_url}/storage/v1/object/{self.bucket}/{filename}"
        headers = {
            "apikey": self.service_key,
            "Content-Type": content_type,
            "x-upsert": "true",
        }
        # New Supabase secret keys (sb_secret_*) are opaque keys, not JWTs.
        # Sending them in Authorization: Bearer triggers 403 Invalid Compact JWS.
        # Legacy service_role JWT keys (eyJ...) still require Authorization: Bearer.
        if not self.service_key.startswith("sb_secret_"):
            headers["Authorization"] = f"Bearer {self.service_key}"
        try:
            with httpx.Client(timeout=30.0) as client:
                resp = client.post(url, content=content, headers=headers)
        except httpx.HTTPError as exc:
            logger.error("Supabase storage network error: %s", exc)
            raise RuntimeError(f"Storage upload request failed: {exc}") from exc

        if resp.status_code not in (200, 201):
            logger.error("Supabase storage error: %s - %s", resp.status_code, resp.text)
            raise RuntimeError(
                f"Storage upload failed with status {resp.status_code}: {resp.text[:300]}"
            )

        public_url = f"{self.supabase_url}/storage/v1/object/public/{self.bucket}/{filename}"
        try:
            with httpx.Client(timeout=10.0) as client:
                head_resp = client.head(public_url, follow_redirects=True)
        except httpx.HTTPError as exc:
            logger.error("Supabase storage public URL HEAD failed for %s: %s", public_url, exc)
            raise RuntimeError(
                f"Supabase bucket '{self.bucket}' is not public or URL unreachable ({exc})"
            ) from exc

        if head_resp.status_code != 200:
            logger.error(
                "Supabase public URL %s unreachable (status %s)",
                public_url,
                head_resp.status_code,
            )
            raise RuntimeError(
                f"Supabase bucket '{self.bucket}' is not public or URL unreachable (status {head_resp.status_code})"
            )

        return public_url
