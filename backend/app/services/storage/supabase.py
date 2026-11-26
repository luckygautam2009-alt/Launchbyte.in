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

        # 1. Verify if the public URL is directly accessible
        try:
            with httpx.Client(timeout=10.0) as verify_client:
                v_resp = verify_client.get(public_url)
                if v_resp.status_code == 200:
                    return public_url
                logger.warning(
                    "Public storage URL %s returned status %s: %s",
                    public_url,
                    v_resp.status_code,
                    v_resp.text[:200],
                )
        except Exception as v_err:
            logger.warning("Could not verify public storage URL %s: %s", public_url, v_err)

        # 2. If public access failed (e.g. private bucket), attempt long-lived signed URL
        sign_url = f"{self.supabase_url}/storage/v1/object/sign/{self.bucket}/{filename}"
        sign_headers = {
            "apikey": self.service_key,
            "Content-Type": "application/json",
        }
        if not self.service_key.startswith("sb_secret_"):
            sign_headers["Authorization"] = f"Bearer {self.service_key}"

        try:
            with httpx.Client(timeout=10.0) as sign_client:
                s_resp = sign_client.post(
                    sign_url,
                    json={"expiresIn": 315360000},  # 10 years
                    headers=sign_headers,
                )
                if s_resp.status_code in (200, 201):
                    s_data = s_resp.json()
                    signed_path = s_data.get("signedURL")
                    if signed_path:
                        if not signed_path.startswith("http"):
                            return f"{self.supabase_url}{signed_path}"
                        return signed_path
                logger.warning(
                    "Supabase signed URL generation returned status %s: %s",
                    s_resp.status_code,
                    s_resp.text[:200],
                )
        except Exception as s_err:
            logger.warning("Failed to generate Supabase signed URL: %s", s_err)

        # 3. If both public URL and signed URL failed, fail cleanly with a helpful error
        raise RuntimeError(
            f"Uploaded object to bucket '{self.bucket}', but the public URL is inaccessible ({public_url}) "
            f"and signed URL generation failed. Please verify that bucket '{self.bucket}' exists and has Public access enabled in Supabase Storage."
        )
