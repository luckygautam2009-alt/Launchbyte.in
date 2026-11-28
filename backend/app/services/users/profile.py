import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from app.models.events import EventRegistration, RegistrationStatus
from app.models.networking import TeamMember
from app.models.profiles import UserProfile
from app.models.users import User
from app.schemas.profiles import MyProfileRead, ProfileUpdate, PublicProfileRead
from app.schemas.teams import TeammateCandidateRead


class ProfileError(Exception):
    def __init__(self, message: str, code: str = "PROFILE_ERROR", status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


def get_my_profile(db: Session, current_user: User) -> MyProfileRead:
    prof = db.get(UserProfile, current_user.id)
    if not prof:
        prof = UserProfile(user_id=current_user.id)
        db.add(prof)
        db.commit()
        db.refresh(prof)

    return MyProfileRead(
        user_id=current_user.id,
        email=current_user.email,
        handle=current_user.handle,
        full_name=current_user.full_name,
        avatar_url=prof.avatar_url,
        headline=prof.headline,
        bio=prof.bio,
        location=prof.location,
        country_code=prof.country_code,
        institution=prof.institution,
        field_of_study=prof.field_of_study,
        graduation_year=prof.graduation_year,
        skills=prof.skills or [],
        interests=prof.interests or [],
        open_to_teams=prof.open_to_teams,
        looking_for_roles=prof.looking_for_roles or [],
        availability_note=prof.availability_note,
        is_public=prof.is_public,
        show_linkedin=prof.show_linkedin,
        show_github=prof.show_github,
        linkedin_url=prof.linkedin_url,
        github_url=prof.github_url,
        portfolio_url=prof.portfolio_url,
        resume_url=prof.resume_url,
        handle_updated_at=current_user.handle_updated_at,
    )


def update_my_profile(db: Session, current_user: User, data: ProfileUpdate) -> MyProfileRead:
    prof = db.get(UserProfile, current_user.id)
    if not prof:
        prof = UserProfile(user_id=current_user.id)
        db.add(prof)
        db.flush()

    # Handle update with 30-day throttle
    if data.handle is not None and data.handle != current_user.handle:
        new_handle = data.handle.strip().lower()
        if current_user.handle_updated_at:
            delta = datetime.now(timezone.utc) - current_user.handle_updated_at.replace(tzinfo=timezone.utc)
            if delta < timedelta(days=30):
                remaining_days = 30 - delta.days
                raise ProfileError(
                    f"Handle can only be changed once every 30 days. Please wait {remaining_days} more days.",
                    "HANDLE_THROTTLED",
                    400,
                )

        # Check uniqueness
        existing = db.query(User).filter(User.handle == new_handle, User.id != current_user.id).first()
        if existing:
            raise ProfileError(f"Handle '@{new_handle}' is already taken.", "HANDLE_TAKEN", 409)

        current_user.handle = new_handle
        current_user.handle_updated_at = datetime.now(timezone.utc)

    # Whitelist fields update
    if data.headline is not None:
        prof.headline = data.headline.strip() if data.headline else None
    if data.bio is not None:
        prof.bio = data.bio.strip() if data.bio else None
    if data.location is not None:
        prof.location = data.location.strip() if data.location else None
    if data.institution is not None:
        prof.institution = data.institution.strip() if data.institution else None
    if data.field_of_study is not None:
        prof.field_of_study = data.field_of_study.strip() if data.field_of_study else None
    if data.graduation_year is not None:
        prof.graduation_year = data.graduation_year
    if data.skills is not None:
        prof.skills = data.skills
    if data.interests is not None:
        prof.interests = data.interests
    if data.open_to_teams is not None:
        prof.open_to_teams = data.open_to_teams
    if data.looking_for_roles is not None:
        prof.looking_for_roles = data.looking_for_roles
    if data.availability_note is not None:
        prof.availability_note = data.availability_note.strip() if data.availability_note else None
    if data.is_public is not None:
        prof.is_public = data.is_public
    if data.show_linkedin is not None:
        prof.show_linkedin = data.show_linkedin
    if data.show_github is not None:
        prof.show_github = data.show_github
    if data.linkedin_url is not None:
        prof.linkedin_url = data.linkedin_url.strip() if data.linkedin_url else None
    if data.github_url is not None:
        prof.github_url = data.github_url.strip() if data.github_url else None
    if data.portfolio_url is not None:
        prof.portfolio_url = data.portfolio_url.strip() if data.portfolio_url else None
    if data.resume_url is not None:
        prof.resume_url = data.resume_url.strip() if data.resume_url else None

    db.commit()
    db.refresh(prof)
    db.refresh(current_user)

    return get_my_profile(db, current_user)


def get_public_profile(
    db: Session, handle: str, current_user: Optional[User] = None
) -> PublicProfileRead:
    user = db.query(User).filter(User.handle == handle.strip().lower(), User.is_active.is_(True)).first()
    if not user:
        raise ProfileError("Profile not found", "NOT_FOUND", 404)

    prof = db.get(UserProfile, user.id)
    if not prof:
        raise ProfileError("Profile not found", "NOT_FOUND", 404)

    # Privacy check: if not public and viewer != owner -> 404 (not 403, prevents existence leaks)
    is_owner = current_user and current_user.id == user.id
    if not prof.is_public and not is_owner:
        raise ProfileError("Profile not found", "NOT_FOUND", 404)

    return PublicProfileRead(
        user_id=user.id,
        handle=user.handle or "",
        full_name=user.full_name,
        avatar_url=prof.avatar_url,
        headline=prof.headline,
        bio=prof.bio,
        institution=prof.institution,
        field_of_study=prof.field_of_study,
        graduation_year=prof.graduation_year,
        skills=prof.skills or [],
        interests=prof.interests or [],
        open_to_teams=prof.open_to_teams,
        looking_for_roles=prof.looking_for_roles or [],
        availability_note=prof.availability_note,
        linkedin_url=prof.linkedin_url if prof.show_linkedin or is_owner else None,
        github_url=prof.github_url if prof.show_github or is_owner else None,
        portfolio_url=prof.portfolio_url,
    )


def discover_teammates(
    db: Session,
    current_user: Optional[User] = None,
    event_id: Optional[uuid.UUID] = None,
    skills: Optional[list[str]] = None,
    q: Optional[str] = None,
    limit: int = 50,
) -> list[TeammateCandidateRead]:
    """
    Teammate discovery:
    - Filters: is_public=True, open_to_teams=True, user.is_active=True.
    - If event_id given:
      * User must NOT already be in a team for this event.
      * User must have an active registration for this event.
    - Excludes current_user.
    - Computes skill-overlap and match score.
    """
    query = (
        db.query(UserProfile, User)
        .join(User, UserProfile.user_id == User.id)
        .filter(
            UserProfile.is_public.is_(True),
            UserProfile.open_to_teams.is_(True),
            User.is_active.is_(True),
        )
    )

    if current_user:
        query = query.filter(User.id != current_user.id)

    # If event_id is specified:
    if event_id:
        # Exclude users already in a team for this event
        existing_team_members = db.query(TeamMember.user_id).filter(TeamMember.event_id == event_id)
        query = query.filter(User.id.not_in(existing_team_members))

        # Include only users with an active registration for this event
        active_regs = db.query(EventRegistration.user_id).filter(
            EventRegistration.event_id == event_id,
            EventRegistration.status.in_([RegistrationStatus.REGISTERED, RegistrationStatus.CHECKED_IN]),
        )
        query = query.filter(User.id.in_(active_regs))

    if q:
        _q = q.strip().lower().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        q_clean = f"%{_q}%"
        query = query.filter(
            or_(
                func.lower(User.full_name).ilike(q_clean, escape="\\"),
                func.lower(User.handle).ilike(q_clean, escape="\\"),
                func.lower(UserProfile.institution).ilike(q_clean, escape="\\"),
                func.lower(UserProfile.headline).ilike(q_clean, escape="\\"),
            )
        )

    results = query.limit(100).all()

    target_skills = set(s.lower() for s in (skills or []))

    candidates: list[TeammateCandidateRead] = []
    for prof, u in results:
        user_skills = [s.lower() for s in (prof.skills or [])]
        user_skills_set = set(user_skills)

        shared = list(target_skills.intersection(user_skills_set))
        if target_skills:
            score = int((len(shared) / max(len(target_skills), 1)) * 100)
        else:
            score = min(len(user_skills) * 10, 100)

        candidates.append(
            TeammateCandidateRead(
                id=u.id,
                handle=u.handle or "",
                full_name=u.full_name,
                avatar_url=prof.avatar_url,
                headline=prof.headline,
                institution=prof.institution,
                skills=prof.skills or [],
                looking_for_roles=prof.looking_for_roles or [],
                availability_note=prof.availability_note,
                match_score=score,
                shared_skills=shared,
            )
        )

    # Sort descending by match score
    candidates.sort(key=lambda c: c.match_score, reverse=True)
    return candidates[:limit]
