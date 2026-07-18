"""
Shared FastAPI dependencies for authentication.
"""
import logging
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.core.db.models import User
from app.infrastructure.database.session import get_db

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency — decode the Bearer JWT and return the active User.
    Raises HTTP 401 if the token is invalid or the user does not exist.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token = request.cookies.get("access_token")
    if not token:
        # Fallback to Authorization header if no cookie
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
        
    if not token:
        raise credentials_exception

    try:
        payload = decode_access_token(token)
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated.",
        )
    return user


def require_client_manager(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    FastAPI dependency — enforce the client_manager role.
    Raises HTTP 403 if the authenticated user is not a client manager.
    Follows the same pattern as require_admin in admin.py.
    """
    from app.core.db.models import UserRole
    if current_user.role != UserRole.client_manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Client Manager access is required to perform this action.",
        )
    return current_user
