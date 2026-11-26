import logging
import httpx

from app.core.config import get_settings
from app.services.storage.base import StorageBackend

logger = logging.getLogger(__name__)


class SupabaseStorageBackend(StorageBackend):
    def __init__(self):
        settings = get_settings()
        self.supabase_url = settings.SUPABASE_URL.rstrip("/")
        self.service_key = settings.SUPABASE_SERVICE_ROLE_KEY
        self.bucket = settings.SUPABASE_STORAGE_BUCKET

    def save(self, content: bytes, filename: str, content_type: str) -> str:
        if not self.supabase_url or not self.service_key:
            raise RuntimeError("Supabase storage is not configured (missing SUPABASE_URL or key).")

        url = f"{self.supabase_url}/storage/v1/object/{self.bucket}/{filename}"
        headers = {
            "apikey": self.service_key,
            "Authorization": f"Bearer {self.service_key}",
            "Content-Type": content_type,
            "x-upsert": "true",
        }
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

        return f"{self.supabase_url}/storage/v1/object/public/{self.bucket}/{filename}"
