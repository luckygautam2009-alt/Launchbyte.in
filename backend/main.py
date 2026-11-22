"""
LaunchByte backend entry point.

Run locally with:
    uvicorn main:app --reload

This file wires together the FastAPI app, CORS, and route registration.
Business logic should NOT live here — add routes under backend/api/routes/
and services under backend/services/.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import health
from core.config.settings import get_settings

settings = get_settings()

app = FastAPI(
    title="LaunchByte API",
    description="Backend API for the LaunchByte student opportunity platform.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)


@app.get("/")
def root() -> dict:
    return {"service": "launchbyte-backend", "status": "running"}
