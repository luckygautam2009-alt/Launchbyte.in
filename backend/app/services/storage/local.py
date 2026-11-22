import os
from pathlib import Path

from app.core.config import get_settings
from app.services.storage.base import StorageBackend


class LocalDiskBackend(StorageBackend):
    def __init__(self):
        settings = get_settings()
        self.upload_dir = Path(settings.STORAGE_LOCAL_DIR).resolve()
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def save(self, content: bytes, filename: str, content_type: str) -> str:
        filepath = self.upload_dir / filename
        with open(filepath, "wb") as f:
            f.write(content)
        # Return URL relative or absolute according to dev settings
        return f"/uploads/{filename}"
