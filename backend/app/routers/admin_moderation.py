import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.dependencies.auth import StaffUser
from app.dependencies.db import DBSession
from app.schemas.networking import MessageReportRead
from app.schemas.common import Page
from app.services.networking.messaging import (
    MessagingError,
    action_message_report,
    list_message_reports,
)

router = APIRouter(prefix="/admin/message-reports", tags=["admin: moderation"])


class ReportActionPayload(BaseModel):
    action: Literal["hide", "dismiss", "mute_user"]


@router.get("", response_model=Page[MessageReportRead])
def get_reports(
    db: DBSession,
    staff: StaffUser,
    status: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    items, total = list_message_reports(db, staff, status=status, limit=limit, offset=offset)
    return Page[MessageReportRead](items=items, total=total, limit=limit, offset=offset)


@router.post("/{report_id}/action", response_model=MessageReportRead)
def post_report_action(
    report_id: uuid.UUID,
    payload: ReportActionPayload,
    db: DBSession,
    staff: StaffUser,
):
    try:
        rep = action_message_report(db, staff, report_id, payload.action)
        return MessageReportRead(
            id=rep.id,
            message_id=rep.message_id,
            reporter_id=rep.reporter_id,
            reason=rep.reason,
            status=rep.status,
            created_at=rep.created_at,
        )
    except MessagingError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )
