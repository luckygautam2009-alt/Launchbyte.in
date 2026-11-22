"""
Health check route.

Used to verify the backend is running and can be reached — by CI, by the
frontend during local dev, and by any future deployment platform's health
probe.
"""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check() -> dict:
    return {"status": "ok"}
