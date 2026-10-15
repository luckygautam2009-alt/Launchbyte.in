"""
App entry point. Run with:

    uvicorn app.main:app --reload
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.logging import configure_logging
from app.routers import admin_opportunities, auth, health, opportunities, users

configure_logging()
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("%s starting up in %s mode", settings.APP_NAME, settings.ENV)
    yield
    logger.info("%s shutting down", settings.APP_NAME)


app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route modules get registered here. Each router owns one domain and stays
# thin — parsing input, calling a service, returning a schema.
app.include_router(health.router)
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(users.router, prefix=settings.API_V1_PREFIX)
app.include_router(opportunities.router, prefix=settings.API_V1_PREFIX)
app.include_router(admin_opportunities.router, prefix=settings.API_V1_PREFIX)
