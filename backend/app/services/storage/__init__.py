from app.core.config import get_settings
from app.services.storage.base import StorageBackend
from app.services.storage.local import LocalDiskBackend
from app.services.storage.supabase import SupabaseStorageBackend


def get_storage_backend() -> StorageBackend:
    settings = get_settings()
    if settings.STORAGE_BACKEND.lower() == "supabase":
        return SupabaseStorageBackend()
    return LocalDiskBackend()
