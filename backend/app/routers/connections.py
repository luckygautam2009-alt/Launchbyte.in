import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies.auth import CurrentUser
from app.dependencies.db import DBSession
from app.schemas.networking import (
    ConnectionRead,
    ConnectionRequestCreate,
    ConnectionUserBrief,
    NetworkSuggestion,
)
from app.schemas.common import Page
from app.services.networking.connections import (
    ConnectionError,
    accept_connection_request,
    block_user,
    cancel_connection_request,
    create_connection_request,
    decline_connection_request,
    get_network_suggestions,
    list_blocks,
    list_connection_requests,
    list_connections,
    remove_connection,
    unblock_user,
)

router = APIRouter(tags=["connections"])


@router.post("/connections/requests", response_model=ConnectionRead, status_code=status.HTTP_201_CREATED)
def request_connection(
    payload: ConnectionRequestCreate,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        conn = create_connection_request(
            db,
            current_user,
            handle=payload.handle,
            user_id=payload.user_id,
            message=payload.message,
        )
        # Format for read
        other_u = conn.addressee if conn.requester_id == current_user.id else conn.requester
        other_brief = ConnectionUserBrief.model_validate(other_u) if other_u else None
        return ConnectionRead(
            id=conn.id,
            requester_id=conn.requester_id,
            addressee_id=conn.addressee_id,
            status=conn.status,
            message=conn.message,
            created_at=conn.created_at,
            responded_at=conn.responded_at,
            other_user=other_brief,
        )
    except ConnectionError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.get("/connections", response_model=Page[ConnectionRead])
def get_connections(
    db: DBSession,
    current_user: CurrentUser,
    q: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    items, total = list_connections(db, current_user, q=q, limit=limit, offset=offset)
    return Page[ConnectionRead](items=items, total=total, limit=limit, offset=offset)


@router.get("/connections/requests", response_model=list[ConnectionRead])
def get_connection_requests(
    db: DBSession,
    current_user: CurrentUser,
    direction: Literal["incoming", "outgoing"] = Query(default="incoming"),
):
    return list_connection_requests(db, current_user, direction=direction)


@router.post("/connections/requests/{request_id}/accept", response_model=ConnectionRead)
def accept_request(
    request_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        conn = accept_connection_request(db, current_user, request_id)
        other_u = conn.addressee if conn.requester_id == current_user.id else conn.requester
        other_brief = ConnectionUserBrief.model_validate(other_u) if other_u else None
        return ConnectionRead(
            id=conn.id,
            requester_id=conn.requester_id,
            addressee_id=conn.addressee_id,
            status=conn.status,
            message=conn.message,
            created_at=conn.created_at,
            responded_at=conn.responded_at,
            other_user=other_brief,
        )
    except ConnectionError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.post("/connections/requests/{request_id}/decline", response_model=ConnectionRead)
def decline_request(
    request_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        conn = decline_connection_request(db, current_user, request_id)
        other_u = conn.addressee if conn.requester_id == current_user.id else conn.requester
        other_brief = ConnectionUserBrief.model_validate(other_u) if other_u else None
        return ConnectionRead(
            id=conn.id,
            requester_id=conn.requester_id,
            addressee_id=conn.addressee_id,
            status=conn.status,
            message=conn.message,
            created_at=conn.created_at,
            responded_at=conn.responded_at,
            other_user=other_brief,
        )
    except ConnectionError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.delete("/connections/requests/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_request(
    request_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        cancel_connection_request(db, current_user, request_id)
    except ConnectionError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.delete("/connections/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_connection(
    user_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        remove_connection(db, current_user, user_id)
    except ConnectionError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.get("/network/suggestions", response_model=list[NetworkSuggestion])
def get_suggestions(
    db: DBSession,
    current_user: CurrentUser,
    limit: int = Query(default=10, ge=1, le=50),
):
    return get_network_suggestions(db, current_user, limit=limit)


# ==========================================
# BLOCKS
# ==========================================


@router.post("/blocks/{user_id}", status_code=status.HTTP_201_CREATED)
def block(
    user_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        block_user(db, current_user, user_id)
        return {"message": "User blocked successfully"}
    except ConnectionError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.delete("/blocks/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def unblock(
    user_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    unblock_user(db, current_user, user_id)


@router.get("/blocks", response_model=list[ConnectionUserBrief])
def get_blocks(
    db: DBSession,
    current_user: CurrentUser,
):
    return list_blocks(db, current_user)
