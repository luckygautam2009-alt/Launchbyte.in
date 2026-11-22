import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.models.enums import NotificationType
from app.models.events import Event, EventRegistration, RegistrationStatus
from app.models.networking import Connection, ConnectionStatus, UserBlock
from app.models.notifications import Notification
from app.models.profiles import UserProfile
from app.models.users import User
from app.schemas.networking import ConnectionRead, ConnectionUserBrief, NetworkSuggestion


class ConnectionError(Exception):
    def __init__(self, message: str, code: str = "CONNECTION_ERROR", status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


def _is_blocked(db: Session, user1_id: uuid.UUID, user2_id: uuid.UUID) -> bool:
    """Check if either user has blocked the other."""
    return db.query(UserBlock).filter(
        or_(
            and_(UserBlock.blocker_id == user1_id, UserBlock.blocked_id == user2_id),
            and_(UserBlock.blocker_id == user2_id, UserBlock.blocked_id == user1_id),
        )
    ).first() is not None


def get_blocked_user_ids(db: Session, user_id: uuid.UUID) -> set[uuid.UUID]:
    """Returns all user IDs that blocked user_id or were blocked by user_id."""
    blocks = db.query(UserBlock).filter(
        or_(UserBlock.blocker_id == user_id, UserBlock.blocked_id == user_id)
    ).all()
    res = set()
    for b in blocks:
        if b.blocker_id == user_id:
            res.add(b.blocked_id)
        else:
            res.add(b.blocker_id)
    return res


def create_connection_request(
    db: Session,
    current_user: User,
    handle: str | None = None,
    user_id: uuid.UUID | None = None,
    message: str | None = None,
) -> Connection:
    if not current_user.is_email_verified:
        raise ConnectionError("Email verification is required to send connection requests", "UNVERIFIED_EMAIL", 400)

    if not handle and not user_id:
        raise ConnectionError("Target handle or user_id required", "TARGET_REQUIRED", 400)

    target = None
    if user_id:
        target = db.query(User).filter(User.id == user_id).first()
    elif handle:
        target = db.query(User).filter(func.lower(User.handle) == handle.strip().lower()).first()

    if not target:
        raise ConnectionError("User not found", "USER_NOT_FOUND", 404)

    if target.id == current_user.id:
        raise ConnectionError("Cannot connect with yourself", "CANNOT_CONNECT_SELF", 400)

    # Check block: if blocked in either direction, return a dummy generic response so blocking is not revealed
    if _is_blocked(db, current_user.id, target.id):
        # Return a mock connection object with status pending
        now = datetime.now(timezone.utc)
        dummy = Connection(
            id=uuid.uuid4(),
            requester_id=current_user.id,
            addressee_id=target.id,
            status=ConnectionStatus.PENDING,
            message=message,
            created_at=now,
        )
        return dummy

    # Daily rate limit: max 30 requests in 24 hours
    one_day_ago = datetime.now(timezone.utc) - timedelta(days=1)
    daily_count = db.query(func.count(Connection.id)).filter(
        Connection.requester_id == current_user.id,
        Connection.created_at >= one_day_ago,
    ).scalar() or 0
    if daily_count >= 30:
        raise ConnectionError("Daily connection request limit reached (30/day)", "RATE_LIMIT_EXCEEDED", 429)

    # Max 200 pending outgoing requests
    pending_count = db.query(func.count(Connection.id)).filter(
        Connection.requester_id == current_user.id,
        Connection.status == ConnectionStatus.PENDING,
    ).scalar() or 0
    if pending_count >= 200:
        raise ConnectionError("Maximum pending requests limit reached (200)", "TOO_MANY_PENDING_REQUESTS", 400)

    # Check existing connection between this pair
    existing = db.query(Connection).filter(
        or_(
            and_(Connection.requester_id == current_user.id, Connection.addressee_id == target.id),
            and_(Connection.requester_id == target.id, Connection.addressee_id == current_user.id),
        )
    ).first()

    if existing:
        if existing.status == ConnectionStatus.ACCEPTED:
            raise ConnectionError("Already connected", "ALREADY_CONNECTED", 409)
        if existing.status == ConnectionStatus.PENDING:
            raise ConnectionError("Connection request already pending", "REQUEST_ALREADY_PENDING", 409)
        # If declined or cancelled, reopen as pending from current_user
        existing.requester_id = current_user.id
        existing.addressee_id = target.id
        existing.status = ConnectionStatus.PENDING
        existing.message = message
        existing.responded_at = None
        existing.created_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        return existing

    connection = Connection(
        requester_id=current_user.id,
        addressee_id=target.id,
        status=ConnectionStatus.PENDING,
        message=message,
    )
    db.add(connection)
    db.commit()
    db.refresh(connection)

    # Dispatch notification to recipient
    notif = Notification(
        user_id=target.id,
        type=NotificationType.SYSTEM,
        title=f"New connection request from {current_user.full_name or current_user.handle}",
        body=message or f"@{current_user.handle} wants to connect with you.",
        data={"event": "connection_request", "connection_id": str(connection.id), "requester_id": str(current_user.id)},
    )
    db.add(notif)
    db.commit()

    return connection


def accept_connection_request(db: Session, current_user: User, request_id: uuid.UUID) -> Connection:
    conn = db.get(Connection, request_id)
    if not conn or conn.addressee_id != current_user.id:
        raise ConnectionError("Connection request not found", "NOT_FOUND", 404)

    if conn.status != ConnectionStatus.PENDING:
        raise ConnectionError("Connection request is not pending", "INVALID_STATUS", 400)

    conn.status = ConnectionStatus.ACCEPTED
    conn.responded_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(conn)

    # Notify requester
    notif = Notification(
        user_id=conn.requester_id,
        type=NotificationType.SYSTEM,
        title="Connection accepted",
        body=f"{current_user.full_name or current_user.handle} accepted your connection request.",
        data={"event": "connection_accepted", "connection_id": str(conn.id), "user_id": str(current_user.id)},
    )
    db.add(notif)
    db.commit()

    return conn


def decline_connection_request(db: Session, current_user: User, request_id: uuid.UUID) -> Connection:
    conn = db.get(Connection, request_id)
    if not conn or conn.addressee_id != current_user.id:
        raise ConnectionError("Connection request not found", "NOT_FOUND", 404)

    if conn.status != ConnectionStatus.PENDING:
        raise ConnectionError("Connection request is not pending", "INVALID_STATUS", 400)

    conn.status = ConnectionStatus.DECLINED
    conn.responded_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(conn)
    return conn


def cancel_connection_request(db: Session, current_user: User, request_id: uuid.UUID) -> None:
    conn = db.get(Connection, request_id)
    if not conn or conn.requester_id != current_user.id:
        raise ConnectionError("Connection request not found", "NOT_FOUND", 404)

    if conn.status != ConnectionStatus.PENDING:
        raise ConnectionError("Only pending requests can be cancelled", "INVALID_STATUS", 400)

    db.delete(conn)
    db.commit()


def remove_connection(db: Session, current_user: User, target_user_id: uuid.UUID) -> None:
    conn = db.query(Connection).filter(
        Connection.status == ConnectionStatus.ACCEPTED,
        or_(
            and_(Connection.requester_id == current_user.id, Connection.addressee_id == target_user_id),
            and_(Connection.requester_id == target_user_id, Connection.addressee_id == current_user.id),
        ),
    ).first()

    if not conn:
        raise ConnectionError("Connection not found", "NOT_FOUND", 404)

    db.delete(conn)
    db.commit()


def list_connections(
    db: Session, current_user: User, q: str | None = None, limit: int = 20, offset: int = 0
) -> tuple[list[ConnectionRead], int]:
    blocked_ids = get_blocked_user_ids(db, current_user.id)

    query = db.query(Connection).filter(
        Connection.status == ConnectionStatus.ACCEPTED,
        or_(Connection.requester_id == current_user.id, Connection.addressee_id == current_user.id),
    )

    all_conns = query.order_by(Connection.created_at.desc()).all()

    # Filter out blocked users and apply search
    items: list[ConnectionRead] = []
    for c in all_conns:
        other_id = c.addressee_id if c.requester_id == current_user.id else c.requester_id
        if other_id in blocked_ids:
            continue
        other_user = db.get(User, other_id)
        if not other_user or not other_user.is_active:
            continue

        if q:
            term = q.strip().lower()
            name_match = other_user.full_name and term in other_user.full_name.lower()
            handle_match = other_user.handle and term in other_user.handle.lower()
            if not (name_match or handle_match):
                continue

        read_item = ConnectionRead(
            id=c.id,
            requester_id=c.requester_id,
            addressee_id=c.addressee_id,
            status=c.status,
            message=c.message,
            created_at=c.created_at,
            responded_at=c.responded_at,
            other_user=ConnectionUserBrief.model_validate(other_user),
        )
        items.append(read_item)

    total = len(items)
    paged = items[offset : offset + limit]
    return paged, total


def list_connection_requests(
    db: Session, current_user: User, direction: str = "incoming"
) -> list[ConnectionRead]:
    blocked_ids = get_blocked_user_ids(db, current_user.id)

    if direction == "incoming":
        query = db.query(Connection).filter(
            Connection.addressee_id == current_user.id,
            Connection.status == ConnectionStatus.PENDING,
        )
    else:
        query = db.query(Connection).filter(
            Connection.requester_id == current_user.id,
            Connection.status == ConnectionStatus.PENDING,
        )

    conns = query.order_by(Connection.created_at.desc()).all()
    results = []
    for c in conns:
        other_id = c.requester_id if direction == "incoming" else c.addressee_id
        if other_id in blocked_ids:
            continue
        other_user = db.get(User, other_id)
        if not other_user or not other_user.is_active:
            continue

        results.append(
            ConnectionRead(
                id=c.id,
                requester_id=c.requester_id,
                addressee_id=c.addressee_id,
                status=c.status,
                message=c.message,
                created_at=c.created_at,
                responded_at=c.responded_at,
                other_user=ConnectionUserBrief.model_validate(other_user),
            )
        )
    return results


def block_user(db: Session, current_user: User, target_user_id: uuid.UUID) -> None:
    if target_user_id == current_user.id:
        raise ConnectionError("Cannot block yourself", "CANNOT_BLOCK_SELF", 400)

    target = db.get(User, target_user_id)
    if not target:
        raise ConnectionError("User not found", "USER_NOT_FOUND", 404)

    # Check existing block
    existing = db.query(UserBlock).filter(
        UserBlock.blocker_id == current_user.id,
        UserBlock.blocked_id == target_user_id,
    ).first()
    if not existing:
        block = UserBlock(blocker_id=current_user.id, blocked_id=target_user_id)
        db.add(block)

    # Delete any existing connections between them
    db.query(Connection).filter(
        or_(
            and_(Connection.requester_id == current_user.id, Connection.addressee_id == target_user_id),
            and_(Connection.requester_id == target_user_id, Connection.addressee_id == current_user.id),
        )
    ).delete(synchronize_session=False)

    db.commit()


def unblock_user(db: Session, current_user: User, target_user_id: uuid.UUID) -> None:
    block = db.query(UserBlock).filter(
        UserBlock.blocker_id == current_user.id,
        UserBlock.blocked_id == target_user_id,
    ).first()
    if block:
        db.delete(block)
        db.commit()


def list_blocks(db: Session, current_user: User) -> list[ConnectionUserBrief]:
    blocks = db.query(UserBlock).filter(UserBlock.blocker_id == current_user.id).all()
    res = []
    for b in blocks:
        u = db.get(User, b.blocked_id)
        if u:
            res.append(ConnectionUserBrief.model_validate(u))
    return res


def get_network_suggestions(db: Session, current_user: User, limit: int = 10) -> list[NetworkSuggestion]:
    blocked_ids = get_blocked_user_ids(db, current_user.id)
    blocked_ids.add(current_user.id)

    # Connected or pending IDs
    conns = db.query(Connection).filter(
        or_(Connection.requester_id == current_user.id, Connection.addressee_id == current_user.id)
    ).all()
    for c in conns:
        if c.status in (ConnectionStatus.ACCEPTED, ConnectionStatus.PENDING):
            blocked_ids.add(c.addressee_id if c.requester_id == current_user.id else c.requester_id)

    # Current user's profile and event registrations
    my_profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    my_skills = set(my_profile.skills or []) if my_profile else set()
    my_institution = my_profile.institution if my_profile else None

    my_event_ids = set(
        db.query(EventRegistration.event_id).filter(
            EventRegistration.user_id == current_user.id,
            EventRegistration.status.in_([RegistrationStatus.REGISTERED, RegistrationStatus.CHECKED_IN]),
        ).all()
    )
    my_event_ids = {e[0] for e in my_event_ids}

    # Potential candidates
    candidates = db.query(User).filter(
        User.id.notin_(blocked_ids),
        User.is_active == True,
    ).limit(50).all()

    suggestions: list[NetworkSuggestion] = []
    for cand in candidates:
        cand_profile = db.query(UserProfile).filter(UserProfile.user_id == cand.id).first()
        cand_skills = set(cand_profile.skills or []) if cand_profile else set()
        cand_inst = cand_profile.institution if cand_profile else None

        # Check overlapping events
        cand_events = db.query(Event.title).join(
            EventRegistration, EventRegistration.event_id == Event.id
        ).filter(
            EventRegistration.user_id == cand.id,
            EventRegistration.event_id.in_(my_event_ids),
            EventRegistration.status.in_([RegistrationStatus.REGISTERED, RegistrationStatus.CHECKED_IN]),
        ).all()
        shared_events = [ev[0] for ev in cand_events]

        reasons = []
        shared_skills = my_skills.intersection(cand_skills)
        if shared_skills:
            reasons.append(f"{len(shared_skills)} shared skill{'' if len(shared_skills) == 1 else 's'}: {', '.join(list(shared_skills)[:3])}")
        if my_institution and cand_inst and my_institution.strip().lower() == cand_inst.strip().lower():
            reasons.append(f"Same institution: {cand_inst}")
        if shared_events:
            reasons.append(f"Both registered for {shared_events[0]}")

        reason_text = reasons[0] if reasons else "Active developer on LaunchByte"

        suggestions.append(
            NetworkSuggestion(
                user=ConnectionUserBrief.model_validate(cand),
                reason=reason_text,
                headline=cand_profile.headline if cand_profile else None,
                institution=cand_inst,
                skills=list(cand_skills)[:5],
            )
        )
        if len(suggestions) >= limit:
            break

    return suggestions
