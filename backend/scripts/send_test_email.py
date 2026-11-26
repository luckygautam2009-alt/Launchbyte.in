"""Send a test transactional email to ADMIN_INBOX_EMAIL using the configured email backend."""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import get_settings
from app.services.email.dispatcher import send_admin_notification


def main() -> int:
    settings = get_settings()
    print(f"Using EMAIL_BACKEND={settings.EMAIL_BACKEND} -> target={settings.ADMIN_INBOX_EMAIL}")
    res = send_admin_notification(
        subject="[LaunchByte] Test Email Delivery Check",
        message="This is a test email from LaunchByte backend/scripts/send_test_email.py.",
    )
    if res.sent:
        print("SUCCESS: Test email sent.")
        return 0
    print(f"FAILED: {res.error}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
