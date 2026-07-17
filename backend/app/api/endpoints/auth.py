"""
Auth API endpoints: register, login, refresh, logout, me.
"""
from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.orm import Session

from app.infrastructure.database.session import get_db
from app.api.dependencies import get_current_user
from app.schemas.auth import RegisterRequest, LoginRequest, RefreshRequest, TokenResponse, UserOut
from app.services import auth_service
from app.core.db.models import User

router = APIRouter()


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user account."""
    user = auth_service.register_user(db, payload)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """Authenticate and receive access + refresh tokens."""
    token_data = auth_service.login_user(db, payload)
    _set_auth_cookies(response, token_data.access_token, token_data.refresh_token)
    return token_data


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, response: Response, db: Session = Depends(get_db)):
    """Exchange a valid refresh token for a new access token (token rotation)."""
    token_data = auth_service.refresh_access_token(db, payload.refresh_token)
    _set_auth_cookies(response, token_data.access_token, token_data.refresh_token)
    return token_data


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    payload: RefreshRequest,
    response: Response,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Revoke the provided refresh token (logout)."""
    auth_service.logout_user(db, payload.refresh_token)
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    """Return the profile of the currently authenticated user."""
    return current_user

def _set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    """Helper to set secure, HttpOnly auth cookies."""
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False,  # Set True in prod with HTTPS
        path="/",
        max_age=3600  # 1 hour
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        secure=False,
        path="/",
        max_age=86400 * 7  # 7 days
    )
