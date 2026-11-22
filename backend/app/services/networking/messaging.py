import asyncio
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from app.core.websocket import ws_manager
from app.models.audit import AuditLog
from app.models.networking import (
    Connection,
    ConnectionStatus,
    Conversation,
    ConversationParticipant,
    ConversationType,
    Message,
    MessageReport,
    ReportStatus,
    Team,
    TeamMember,
    TeamMemberRole,
    UserBlock,
)
from app.models.users import User
from app.schemas.networking import (
    ConnectionUserBrief,
    ConversationMessagesPage,
    ConversationRead,
    MessageRead,
    MessageReportRead,
)
from app.services.networking.connections import _is_blocked, get_blocked_user_ids


class MessagingError(Exception):
    def __init__(self, message: str, code: str = "MESSAGING_ERROR", status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


def _run_async(coro):
    """Safely run async coroutine from sync service if loop is running, else dispatch to ws_manager loop."""
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(coro)
    except RuntimeError:
        if ws_manager.loop and ws_manager.loop.is_running():
            asyncio.run_coroutine_threadsafe(coro, ws_manager.loop)
        else:
            coro.close()


def create_or_get_direct_conversation(db: Session, current_user: User, target_user_id: uuid.UUID) -> Conversation:
    if target_user_id == current_user.id:
        raise MessagingError("Cannot start conversation with yourself", "CANNOT_MESSAGE_SELF", 400)

    target = db.get(User, target_user_id)
    if not target or not target.is_active:
        raise MessagingError("User not found", "USER_NOT_FOUND", 404)

    # Check blocks
    if _is_blocked(db, current_user.id, target_user_id):
        raise MessagingError("Cannot message this user", "BLOCKED_USER", 403)

    # Enforce permission: Must be accepted connections OR share at least one common team
    is_connected = db.query(Connection).filter(
        Connection.status == ConnectionStatus.ACCEPTED,
        or_(
            and_(Connection.requester_id == current_user.id, Connection.addressee_id == target_user_id),
            and_(Connection.requester_id == target_user_id, Connection.addressee_id == current_user.id),
        ),
    ).first() is not None

    shares_team = False
    if not is_connected:
        my_team_ids = db.query(TeamMember.team_id).filter(TeamMember.user_id == current_user.id).all()
        my_team_ids = {t[0] for t in my_team_ids}
        if my_team_ids:
            shares_team = db.query(TeamMember).filter(
                TeamMember.team_id.in_(my_team_ids),
                TeamMember.user_id == target_user_id,
            ).first() is not None

    if not is_connected and not shares_team:
        raise MessagingError("Must be connected or on the same team to start a direct message", "NOT_CONNECTED", 403)

    # Canonical pair
    u1, u2 = (current_user.id, target_user_id) if current_user.id < target_user_id else (target_user_id, current_user.id)

    existing = db.query(Conversation).filter(
        Conversation.type == ConversationType.DIRECT,
        Conversation.user_a_id == u1,
        Conversation.user_b_id == u2,
    ).first()

    if existing:
        return existing

    # Create direct conversation
    conv = Conversation(
        type=ConversationType.DIRECT,
        user_a_id=u1,
        user_b_id=u2,
    )
    db.add(conv)
    db.flush()

    p1 = ConversationParticipant(conversation_id=conv.id, user_id=current_user.id)
    p2 = ConversationParticipant(conversation_id=conv.id, user_id=target_user_id)
    db.add_all([p1, p2])
    db.commit()
    db.refresh(conv)
    return conv


def list_conversations(db: Session, current_user: User) -> list[ConversationRead]:
    # Active participants
    participants = db.query(ConversationParticipant).filter(
        ConversationParticipant.user_id == current_user.id,
        ConversationParticipant.left_at.is_(None),
    ).all()

    conv_ids = [p.conversation_id for p in participants]
    if not conv_ids:
        return []

    p_map = {p.conversation_id: p for p in participants}

    conversations = db.query(Conversation).filter(Conversation.id.in_(conv_ids)).all()

    results: list[ConversationRead] = []
    for c in conversations:
        p = p_map.get(c.id)
        if not p:
            continue

        # Last message
        last_msg = db.query(Message).filter(
            Message.conversation_id == c.id,
            Message.deleted_at.is_(None),
        ).order_by(Message.created_at.desc()).first()

        last_msg_read = None
        if last_msg:
            sender = db.get(User, last_msg.sender_id) if last_msg.sender_id else None
            last_msg_read = MessageRead(
                id=last_msg.id,
                conversation_id=last_msg.conversation_id,
                sender_id=last_msg.sender_id,
                client_msg_id=last_msg.client_msg_id,
                body=last_msg.body,
                created_at=last_msg.created_at,
                edited_at=last_msg.edited_at,
                is_deleted=last_msg.deleted_at is not None,
                sender_name=sender.full_name if sender else None,
                sender_handle=sender.handle if sender else None,
            )

        # Unread count
        unread = 0
        if p.last_read_message_id:
            last_read_msg = db.get(Message, p.last_read_message_id)
            if last_read_msg:
                unread = db.query(func.count(Message.id)).filter(
                    Message.conversation_id == c.id,
                    Message.deleted_at.is_(None),
                    Message.created_at > last_read_msg.created_at,
                    Message.sender_id != current_user.id,
                ).scalar() or 0
        else:
            unread = db.query(func.count(Message.id)).filter(
                Message.conversation_id == c.id,
                Message.deleted_at.is_(None),
                Message.sender_id != current_user.id,
            ).scalar() or 0

        # Title / other user
        other_user_brief = None
        title = c.title
        if c.type == ConversationType.DIRECT:
            other_id = c.user_b_id if c.user_a_id == current_user.id else c.user_a_id
            if other_id:
                other_u = db.get(User, other_id)
                if other_u:
                    other_user_brief = ConnectionUserBrief.model_validate(other_u)
                    title = other_u.full_name or other_u.handle
        elif c.type == ConversationType.TEAM and c.team_id:
            team = db.get(Team, c.team_id)
            if team:
                title = team.name

        count_parts = db.query(func.count(ConversationParticipant.id)).filter(
            ConversationParticipant.conversation_id == c.id,
            ConversationParticipant.left_at.is_(None),
        ).scalar() or 0

        results.append(
            ConversationRead(
                id=c.id,
                type=c.type,
                title=title,
                team_id=c.team_id,
                created_at=c.created_at,
                updated_at=c.updated_at,
                last_message=last_msg_read,
                unread_count=unread,
                other_user=other_user_brief,
                participants_count=count_parts,
            )
        )

    results.sort(key=lambda x: (x.last_message.created_at if x.last_message else x.updated_at), reverse=True)
    return results


def get_conversation_messages(
    db: Session,
    current_user: User,
    conversation_id: uuid.UUID,
    before: datetime | None = None,
    limit: int = 50,
) -> ConversationMessagesPage:
    # Verify participant
    part = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conversation_id,
        ConversationParticipant.user_id == current_user.id,
        ConversationParticipant.left_at.is_(None),
    ).first()
    if not part:
        raise MessagingError("Conversation not found", "NOT_FOUND", 404)

    query = db.query(Message).filter(Message.conversation_id == conversation_id)
    if before:
        query = query.filter(Message.created_at < before)

    messages = query.order_by(Message.created_at.desc()).limit(limit + 1).all()

    has_more = len(messages) > limit
    page_items = messages[:limit]

    # Convert to schema
    items = []
    for m in reversed(page_items):  # chronologically ascending for client display
        sender = db.get(User, m.sender_id) if m.sender_id else None
        body = "This message was deleted" if m.deleted_at else m.body
        items.append(
            MessageRead(
                id=m.id,
                conversation_id=m.conversation_id,
                sender_id=m.sender_id,
                client_msg_id=m.client_msg_id,
                body=body,
                created_at=m.created_at,
                edited_at=m.edited_at,
                is_deleted=m.deleted_at is not None,
                sender_name=sender.full_name if sender else None,
                sender_handle=sender.handle if sender else None,
            )
        )

    next_cursor = page_items[-1].created_at.isoformat() if has_more and page_items else None
    return ConversationMessagesPage(items=items, has_more=has_more, next_cursor=next_cursor)


def send_message(
    db: Session,
    current_user: User,
    conversation_id: uuid.UUID,
    body: str,
    client_msg_id: str | None = None,
) -> MessageRead:
    # Verify active participant
    part = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conversation_id,
        ConversationParticipant.user_id == current_user.id,
        ConversationParticipant.left_at.is_(None),
    ).first()
    if not part:
        raise MessagingError("Conversation not found", "NOT_FOUND", 404)

    conv = db.get(Conversation, conversation_id)
    if not conv:
        raise MessagingError("Conversation not found", "NOT_FOUND", 404)

    # Check block in direct conversation
    if conv.type == ConversationType.DIRECT:
        other_id = conv.user_b_id if conv.user_a_id == current_user.id else conv.user_a_id
        if other_id and _is_blocked(db, current_user.id, other_id):
            raise MessagingError("Cannot send message to blocked user", "BLOCKED_USER", 403)

    # Idempotency check: if client_msg_id provided, check if already exists
    if client_msg_id:
        existing = db.query(Message).filter(
            Message.conversation_id == conversation_id,
            Message.sender_id == current_user.id,
            Message.client_msg_id == client_msg_id,
        ).first()
        if existing:
            return MessageRead(
                id=existing.id,
                conversation_id=existing.conversation_id,
                sender_id=existing.sender_id,
                client_msg_id=existing.client_msg_id,
                body=existing.body if not existing.deleted_at else "This message was deleted",
                created_at=existing.created_at,
                edited_at=existing.edited_at,
                is_deleted=existing.deleted_at is not None,
                sender_name=current_user.full_name,
                sender_handle=current_user.handle,
            )

    msg = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        client_msg_id=client_msg_id,
        body=body,
    )
    db.add(msg)
    conv.updated_at = datetime.now(timezone.utc)
    part.last_read_message_id = msg.id
    db.commit()
    db.refresh(msg)

    # Get all active participants to broadcast
    all_parts = db.query(ConversationParticipant.user_id).filter(
        ConversationParticipant.conversation_id == conversation_id,
        ConversationParticipant.left_at.is_(None),
    ).all()
    participant_ids = [p[0] for p in all_parts]

    msg_read = MessageRead(
        id=msg.id,
        conversation_id=msg.conversation_id,
        sender_id=msg.sender_id,
        client_msg_id=msg.client_msg_id,
        body=msg.body,
        created_at=msg.created_at,
        edited_at=msg.edited_at,
        is_deleted=False,
        sender_name=current_user.full_name,
        sender_handle=current_user.handle,
    )

    # Broadcast via WebSocket
    _run_async(
        ws_manager.broadcast_to_conversation(
            conversation_id,
            participant_ids,
            "message.new",
            msg_read.model_dump(mode="json"),
        )
    )

    return msg_read


def edit_message(db: Session, current_user: User, message_id: uuid.UUID, new_body: str) -> MessageRead:
    msg = db.get(Message, message_id)
    if not msg or msg.deleted_at is not None:
        raise MessagingError("Message not found", "NOT_FOUND", 404)

    if msg.sender_id != current_user.id:
        raise MessagingError("You can only edit your own messages", "FORBIDDEN", 403)

    # Must be within 15 minutes
    age = datetime.now(timezone.utc) - msg.created_at.replace(tzinfo=timezone.utc)
    if age > timedelta(minutes=15):
        raise MessagingError("Messages can only be edited within 15 minutes of sending", "EDIT_TIME_EXPIRED", 400)

    msg.body = new_body
    msg.edited_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(msg)

    msg_read = MessageRead(
        id=msg.id,
        conversation_id=msg.conversation_id,
        sender_id=msg.sender_id,
        client_msg_id=msg.client_msg_id,
        body=msg.body,
        created_at=msg.created_at,
        edited_at=msg.edited_at,
        is_deleted=False,
        sender_name=current_user.full_name,
        sender_handle=current_user.handle,
    )

    all_parts = db.query(ConversationParticipant.user_id).filter(
        ConversationParticipant.conversation_id == msg.conversation_id,
        ConversationParticipant.left_at.is_(None),
    ).all()
    participant_ids = [p[0] for p in all_parts]

    _run_async(
        ws_manager.broadcast_to_conversation(
            msg.conversation_id,
            participant_ids,
            "message.edited",
            msg_read.model_dump(mode="json"),
        )
    )

    return msg_read


def delete_message(db: Session, current_user: User, message_id: uuid.UUID) -> None:
    msg = db.get(Message, message_id)
    if not msg:
        raise MessagingError("Message not found", "NOT_FOUND", 404)

    if msg.deleted_at is not None:
        return  # already deleted

    # Authorization: sender, or team leader if team conversation, or moderator/admin
    can_delete = False
    if msg.sender_id == current_user.id:
        can_delete = True
    elif current_user.is_staff:
        can_delete = True
    else:
        conv = db.get(Conversation, msg.conversation_id)
        if conv and conv.type == ConversationType.TEAM and conv.team_id:
            leader = db.query(TeamMember).filter(
                TeamMember.team_id == conv.team_id,
                TeamMember.user_id == current_user.id,
                TeamMember.role == TeamMemberRole.LEADER,
            ).first()
            if leader:
                can_delete = True

    if not can_delete:
        raise MessagingError("Not authorized to delete this message", "FORBIDDEN", 403)

    msg.deleted_at = datetime.now(timezone.utc)
    db.commit()

    all_parts = db.query(ConversationParticipant.user_id).filter(
        ConversationParticipant.conversation_id == msg.conversation_id,
        ConversationParticipant.left_at.is_(None),
    ).all()
    participant_ids = [p[0] for p in all_parts]

    _run_async(
        ws_manager.broadcast_to_conversation(
            msg.conversation_id,
            participant_ids,
            "message.deleted",
            {"message_id": str(msg.id), "conversation_id": str(msg.conversation_id)},
        )
    )


def mark_conversation_read(
    db: Session, current_user: User, conversation_id: uuid.UUID, message_id: uuid.UUID | None = None
) -> None:
    part = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conversation_id,
        ConversationParticipant.user_id == current_user.id,
        ConversationParticipant.left_at.is_(None),
    ).first()
    if not part:
        raise MessagingError("Conversation not found", "NOT_FOUND", 404)

    if not message_id:
        latest = db.query(Message.id).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at.desc()).first()
        if latest:
            message_id = latest[0]

    part.last_read_message_id = message_id
    db.commit()

    # Broadcast read receipt
    all_parts = db.query(ConversationParticipant.user_id).filter(
        ConversationParticipant.conversation_id == conversation_id,
        ConversationParticipant.left_at.is_(None),
    ).all()
    participant_ids = [p[0] for p in all_parts]

    _run_async(
        ws_manager.broadcast_to_conversation(
            conversation_id,
            participant_ids,
            "read",
            {"conversation_id": str(conversation_id), "user_id": str(current_user.id), "message_id": str(message_id) if message_id else None},
            exclude_user_id=current_user.id,
        )
    )


def report_message(db: Session, current_user: User, message_id: uuid.UUID, reason: str) -> MessageReport:
    msg = db.get(Message, message_id)
    if not msg:
        raise MessagingError("Message not found", "NOT_FOUND", 404)

    existing = db.query(MessageReport).filter(
        MessageReport.message_id == message_id,
        MessageReport.reporter_id == current_user.id,
    ).first()
    if existing:
        raise MessagingError("You have already reported this message", "ALREADY_REPORTED", 409)

    report = MessageReport(
        message_id=message_id,
        reporter_id=current_user.id,
        reason=reason,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def list_message_reports(
    db: Session, current_user: User, status: str | None = None, limit: int = 20, offset: int = 0
) -> tuple[list[MessageReportRead], int]:
    if not current_user.is_staff:
        raise MessagingError("Staff access required", "FORBIDDEN", 403)

    query = db.query(MessageReport)
    if status:
        query = query.filter(MessageReport.status == status)

    total = query.count()
    reports = query.order_by(MessageReport.created_at.desc()).offset(offset).limit(limit).all()

    items = []
    for r in reports:
        msg = db.get(Message, r.message_id)
        reporter = db.get(User, r.reporter_id)
        items.append(
            MessageReportRead(
                id=r.id,
                message_id=r.message_id,
                reporter_id=r.reporter_id,
                reason=r.reason,
                status=r.status,
                created_at=r.created_at,
                message_body=msg.body if msg else None,
                reporter_email=reporter.email if reporter else None,
            )
        )
    return items, total


def action_message_report(
    db: Session, current_user: User, report_id: uuid.UUID, action: str
) -> MessageReport:
    if not current_user.is_staff:
        raise MessagingError("Staff access required", "FORBIDDEN", 403)

    rep = db.get(MessageReport, report_id)
    if not rep:
        raise MessagingError("Report not found", "NOT_FOUND", 404)

    msg = db.get(Message, rep.message_id)

    if action == "hide" and msg:
        msg.deleted_at = datetime.now(timezone.utc)
        rep.status = ReportStatus.ACTIONED
    elif action == "dismiss":
        rep.status = ReportStatus.DISMISSED
    elif action == "mute_user" and msg and msg.sender_id:
        target_sender = db.get(User, msg.sender_id)
        if target_sender:
            target_sender.is_active = False  # suspended
        rep.status = ReportStatus.ACTIONED
    else:
        raise MessagingError(f"Unknown action {action}", "INVALID_ACTION", 400)

    rep.resolved_at = datetime.now(timezone.utc)
    rep.resolved_by_id = current_user.id

    # Write audit log
    audit = AuditLog(
        actor_id=current_user.id,
        action=f"message_report.{action}",
        entity_type="message_report",
        entity_id=rep.id,
        changes={"message_id": str(rep.message_id), "reason": rep.reason, "action": action},
    )
    db.add(audit)
    db.commit()
    db.refresh(rep)
    return rep
