from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from typing import Annotated

from app.api.dependencies.auth import verify_token
from app.infrastructure.database.session import get_db_session
from app.core.models.user import User
from app.core.security.roles import Role

router = APIRouter()

@router.post("/sync-profile")
async def sync_profile(
    payload: Annotated[dict, Depends(verify_token)],
    session: Annotated[AsyncSession, Depends(get_db_session)]
):
    user_id_str = payload.get("sub")
    email = payload.get("email")
    user_metadata = payload.get("user_metadata", {})
    role_str = user_metadata.get("role")

    if not user_id_str or not email or not role_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incomplete token payload for provisioning"
        )
        
    user_id = uuid.UUID(user_id_str)
    
    # Check if user already exists
    result = await session.execute(select(User).where(User.id == user_id))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        return {"message": "User already exists", "user_id": str(existing_user.id)}

    try:
        role_enum = Role(role_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role specified")

    # Restrict roles for public signup
    if role_enum not in [Role.CANDIDATE_EMPLOYEE, Role.CLIENT]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot provision a privileged role during public signup"
        )

    full_name = email.split("@")[0]
    
    new_user = User(
        id=user_id,
        email=email,
        role=role_enum,
        full_name=full_name
    )
    
    session.add(new_user)
    await session.commit()
    
    return {"message": "Profile synced successfully", "user_id": str(new_user.id)}
