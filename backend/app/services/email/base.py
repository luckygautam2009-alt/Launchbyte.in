from abc import ABC, abstractmethod
import uuid


class EmailBackend(ABC):
    @abstractmethod
    def send_verification_email(self, email: str, token: str, user_id: uuid.UUID) -> None:
        """Send an email with the verification link/token."""
        pass

    @abstractmethod
    def send_password_reset_email(self, email: str, token: str, user_id: uuid.UUID) -> None:
        """Send an email with the password reset link/token."""
        pass

    @abstractmethod
    def send_notification_email(self, email: str, subject: str, message: str) -> None:
        """Send an event or general notification email."""
        pass
