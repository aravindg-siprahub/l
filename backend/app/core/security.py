"""
Core security utilities: password hashing and JWT token management.
"""
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
import bcrypt
import hashlib
from app.core.config import settings

def _prepare_password(password: str) -> bytes:
    """Pre-hash password with SHA-256 to bypass bcrypt's 72-byte limit and null-byte issues."""
    return hashlib.sha256(password.encode('utf-8')).hexdigest().encode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a bcrypt hash."""
    return bcrypt.checkpw(
        _prepare_password(plain_password), 
        hashed_password.encode('utf-8')
    )

def get_password_hash(password: str) -> str:
    """Hash a plain password using bcrypt."""
    return bcrypt.hashpw(
        _prepare_password(password), 
        bcrypt.gensalt()
    ).decode('utf-8')


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """
    Decode and validate a JWT access token.
    Raises JWTError on failure.
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


def hash_token(raw_token: str) -> str:
    """SHA-256 hash a raw refresh token for safe DB storage."""
    return hashlib.sha256(raw_token.encode()).hexdigest()
