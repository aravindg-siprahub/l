"""
Authentication service: register, login, refresh, logout.
All DB operations are synchronous (sync SQLAlchemy session).
"""
import secrets
from datetime import datetime, timedelta, timezone
import logging

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.db.models import User, RefreshToken, UserRole
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token,
    hash_token,
)
from app.core.config import settings
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse

logger = logging.getLogger(__name__)

REFRESH_TOKEN_EXPIRE_DAYS = 7


def _generate_refresh_token() -> str:
    """Generate a cryptographically secure random refresh token."""
    return secrets.token_urlsafe(64)


def register_user(db: Session, payload: RegisterRequest) -> User:
    """Create a new user account."""
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info(f"Registered new user: {user.email} (role={user.role})")
    return user


def login_user(db: Session, payload: LoginRequest) -> TokenResponse:
    """Authenticate user and return access + refresh tokens."""
    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated.",
        )

    # Access token
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})

    # Refresh token — store hash in DB
    raw_refresh = _generate_refresh_token()
    token_hash = hash_token(raw_refresh)
    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    db_token = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db.add(db_token)

    # Update last login
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    logger.info(f"User logged in: {user.email}")
    return TokenResponse(access_token=access_token, refresh_token=raw_refresh)


def refresh_access_token(db: Session, raw_refresh_token: str) -> TokenResponse:
    """Issue a new access token given a valid refresh token."""
    token_hash = hash_token(raw_refresh_token)
    now = datetime.now(timezone.utc)

    stored = (
        db.query(RefreshToken)
        .filter(
            RefreshToken.token_hash == token_hash,
            RefreshToken.is_revoked == False,  # noqa: E712
            RefreshToken.expires_at > now,
        )
        .first()
    )

    if not stored:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )

    user = db.query(User).filter(User.id == stored.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive.",
        )

    # Rotate: revoke old, issue new
    stored.is_revoked = True

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    new_raw = _generate_refresh_token()
    new_hash = hash_token(new_raw)

    new_token = RefreshToken(
        user_id=user.id,
        token_hash=new_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(new_token)
    db.commit()

    logger.info(f"Refreshed token for user: {user.email}")
    return TokenResponse(access_token=access_token, refresh_token=new_raw)


def logout_user(db: Session, raw_refresh_token: str) -> None:
    """Revoke a refresh token (logout)."""
    token_hash = hash_token(raw_refresh_token)
    stored = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if stored:
        stored.is_revoked = True
        db.commit()
