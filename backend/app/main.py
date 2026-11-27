"""
App entry point. Run with:

    uvicorn app.main:app --reload
"""
import logging
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.gzip import GZipMiddleware

from app.core.config import get_settings
from app.core.logging import configure_logging
from app.routers import (
    admin_events,
    admin_moderation,
    admin_opportunities,
    applications,
    auth,
    connections,
    contributor_access,
    contributor_opportunities,
    conversations,
    events,
    health,
    me,
    notifications,
    opportunities,
    profiles,
    projects,
    public_submissions,
    team,
    teams,
    uploads,
    users,
)

configure_logging()
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    email_backend = settings.EMAIL_BACKEND.lower().strip()
    email_from = (settings.EMAIL_FROM or settings.SMTP_FROM or "").strip()
    logger.info(
        "%s starting up | ENV=%s | EMAIL_BACKEND=%s | EMAIL_FROM=%s | STORAGE_BACKEND=%s",
        settings.APP_NAME,
        settings.ENV,
        email_backend,
        email_from,
        settings.STORAGE_BACKEND,
    )
    if email_backend == "console":
        logger.warning("No real emails are sent; OTPs are only printed in this log.")
    if is_prod_like and settings.STORAGE_BACKEND.lower().strip() == "local":
        logger.warning(
            "STORAGE_BACKEND is 'local' in production. Uploads are stored on local ephemeral disk. "
            "To use persistent cloud storage, set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
        )
    yield
    logger.info("%s shutting down", settings.APP_NAME)


is_prod_like = settings.ENV.lower() not in {"local", "test"}

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    lifespan=lifespan,
    docs_url=None if is_prod_like else "/docs",
    redoc_url=None if is_prod_like else "/redoc",
    openapi_url=None if is_prod_like else "/openapi.json",
)

# --- Middlewares ---

app.add_middleware(GZipMiddleware, minimum_size=1000)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https://launchbyte(-[a-zA-Z0-9_-]+)?\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID", "Accept"],
)


@app.middleware("http")
async def security_and_request_id_middleware(request: Request, call_next):
    start_time = time.perf_counter()
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    response = await call_next(request)
    process_time = time.perf_counter() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    if process_time > 0.5:
        logger.warning(
            "Slow request: %s %s took %.3fs",
            request.method,
            request.url.path,
            process_time,
        )
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(self), microphone=(), geolocation=()"
    if "Content-Security-Policy" in response.headers:
        pass  # route set its own CSP (e.g. the email one-click review page)
    elif request.url.path.startswith("/uploads"):
        response.headers["Content-Security-Policy"] = "sandbox; default-src 'none'"
    else:
        response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none'"
    if settings.ENV.lower() not in {"local", "test"}:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# --- Exception Handlers for Consistent Error Responses ---

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    code_map = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        409: "CONFLICT",
        422: "UNPROCESSABLE_ENTITY",
        429: "TOO_MANY_REQUESTS",
    }
    code = exc.headers.get("X-Error-Code") if exc.headers else None
    message = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        err = exc.detail["error"]
        if isinstance(err, dict):
            code = err.get("code") or code
            message = err.get("message") or message

    if not code:
        code = code_map.get(exc.status_code, "ERROR")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "error": {
                "code": code,
                "message": message,
            },
        },
        headers=exc.headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    msg = errors[0].get("msg", "Validation error") if errors else "Validation error"
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": jsonable_encoder(errors),
            "error": {
                "code": "VALIDATION_ERROR",
                "message": msg,
            },
        },
    )


# --- Static files for local image uploads ---
upload_path = Path(settings.STORAGE_LOCAL_DIR).resolve()
upload_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_path)), name="uploads")


# --- Route Modules ---
app.include_router(health.router)
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(users.router, prefix=settings.API_V1_PREFIX)
app.include_router(opportunities.router, prefix=settings.API_V1_PREFIX)
app.include_router(admin_opportunities.router, prefix=settings.API_V1_PREFIX)
app.include_router(contributor_access.router, prefix=settings.API_V1_PREFIX)
app.include_router(contributor_opportunities.router, prefix=settings.API_V1_PREFIX)
app.include_router(public_submissions.router, prefix=settings.API_V1_PREFIX)
app.include_router(events.router, prefix=settings.API_V1_PREFIX)
app.include_router(admin_events.router, prefix=settings.API_V1_PREFIX)
app.include_router(applications.router, prefix=settings.API_V1_PREFIX)
app.include_router(me.router, prefix=settings.API_V1_PREFIX)
app.include_router(notifications.router, prefix=settings.API_V1_PREFIX)
app.include_router(uploads.router, prefix=settings.API_V1_PREFIX)
app.include_router(team.router, prefix=settings.API_V1_PREFIX)
app.include_router(connections.router, prefix=settings.API_V1_PREFIX)
app.include_router(conversations.router, prefix=settings.API_V1_PREFIX)
app.include_router(projects.router, prefix=settings.API_V1_PREFIX)
app.include_router(teams.router, prefix=settings.API_V1_PREFIX)
app.include_router(profiles.router, prefix=settings.API_V1_PREFIX)
app.include_router(admin_moderation.router, prefix=settings.API_V1_PREFIX)

# Also expose /ws directly at root for standard client connection
app.add_api_websocket_route("/ws", conversations.websocket_endpoint)
