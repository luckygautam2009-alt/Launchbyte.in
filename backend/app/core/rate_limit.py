"""
Rate limiting utility with in-memory sliding window.
Returns 429 with Retry-After header and consistent error response when rate limit is exceeded.
Configurable via app settings.
"""
import time
from collections import defaultdict
from typing import Callable

from fastapi import HTTPException, Request, status

from app.core.config import get_settings


_MAX_BUCKETS = 10_000


def get_client_ip(request: Request) -> str:
    settings = get_settings()
    if settings.TRUST_PROXY_HEADERS:
        forwarded = request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
        if forwarded:
            return forwarded
    return request.client.host if request.client else "127.0.0.1"


class InMemoryRateLimiter:
    def __init__(self):
        # key -> list of float timestamps
        self._records: dict[str, list[float]] = defaultdict(list)

    def reset(self):
        """Reset all rate limit counters (useful in tests)."""
        self._records.clear()

    def _prune_stale(self, now: float, window_seconds: int) -> None:
        if len(self._records) <= _MAX_BUCKETS:
            return
        cutoff = now - max(window_seconds, 60)
        stale_keys = [k for k, ts in self._records.items() if not ts or ts[-1] <= cutoff]
        for k in stale_keys:
            self._records.pop(k, None)

    def check(self, key: str, max_requests: int, window_seconds: int = 60) -> tuple[bool, int]:
        """
        Check if a request is allowed.
        Returns (is_allowed, retry_after_seconds).
        """
        now = time.time()
        window_start = now - window_seconds
        self._prune_stale(now, window_seconds)

        # Prune old records
        records = [t for t in self._records[key] if t > window_start]
        if records:
            self._records[key] = records
        else:
            self._records.pop(key, None)

        if len(records) >= max_requests:
            oldest = records[0]
            retry_after = max(1, int(oldest + window_seconds - now))
            return False, retry_after

        self._records[key].append(now)
        return True, 0

    def check_rate_limit(
        self,
        request: Request,
        key: str,
        max_requests: int | None = None,
        window_seconds: int = 60,
    ) -> None:
        settings = get_settings()
        if not settings.RATE_LIMIT_ENABLED:
            return
        if max_requests is None:
            max_requests = settings.RATE_LIMIT_PER_MINUTE
        allowed, retry_after = self.check(key, max_requests=max_requests, window_seconds=window_seconds)
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Retry after {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)},
            )


limiter = InMemoryRateLimiter()


def rate_limit(
    max_requests: int | None = None,
    window_seconds: int = 60,
    key_func: Callable[[Request], str] | None = None,
):
    """
    FastAPI dependency for rate limiting.
    If max_requests is None, uses settings.RATE_LIMIT_PER_MINUTE.
    """
    async def dependency(request: Request):
        settings = get_settings()
        if not settings.RATE_LIMIT_ENABLED:
            return

        limit = max_requests if max_requests is not None else settings.RATE_LIMIT_PER_MINUTE

        # Extract identifier
        if key_func is not None:
            ident = key_func(request)
        else:
            ident = get_client_ip(request)

        key = f"{request.url.path}:{ident}"
        allowed, retry_after = limiter.check(key, max_requests=limit, window_seconds=window_seconds)

        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Try again in {retry_after} seconds.",
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Reset": str(retry_after),
                },
            )

    return dependency
