from abc import ABC, abstractmethod


class StorageBackend(ABC):
    @abstractmethod
    def save(self, content: bytes, filename: str, content_type: str) -> str:
        """
        Persist bytes and return the public URL of the saved file.
        """
        pass
