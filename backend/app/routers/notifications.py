import uuid

from fastapi import APIRouter, HTTPException, Query, status

from app.dependencies.auth import CurrentUser
from app.dependencies.db import DBSession
from app.schemas.common import Page
from app.schemas.opportunities import NotificationRead
from app.services.opportunities import service as svc

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=Page[NotificationRead])
def list_notifications(
    db: DBSession,
    current_user: CurrentUser,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    items, total = svc.list_notifications(db, current_user.id, limit=limit, offset=offset)
    return {"items": items, "total": total, "limit": limit, "offset": offset}


@router.get("/unread-count")
def unread_count(db: DBSession, current_user: CurrentUser):
    return {"unread": svc.count_unread_notifications(db, current_user.id)}


@router.post("/{notification_id}/read", response_model=NotificationRead)
def mark_read(
    db: DBSession,
    current_user: CurrentUser,
    notification_id: uuid.UUID,
):
    notif = svc.mark_notification_read(db, current_user.id, notification_id)
    if notif is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return notif


@router.post("/read-all")
def mark_all_read(
    db: DBSession,
    current_user: CurrentUser,
):
    count = svc.mark_all_notifications_read(db, current_user.id)
    return {"message": f"{count} notifications marked as read."}
