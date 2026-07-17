from fastapi import APIRouter, Depends
from app.core.security.roles import Role
from app.api.dependencies.auth import require_role, get_current_user
from app.core.models.user import User

router = APIRouter()

@router.get("/admin-only")
async def admin_only_endpoint(
    current_user: User = require_role([Role.SYSTEM_ADMINISTRATOR])
):
    return {"message": "Welcome Admin!", "user_role": current_user.role.value}

@router.get("/hr-or-admin")
async def hr_or_admin_endpoint(
    current_user: User = require_role([Role.SYSTEM_ADMINISTRATOR, Role.HR_TEAM])
):
    return {"message": "Welcome HR or Admin!", "user_role": current_user.role.value}

@router.get("/me")
async def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    # Any authenticated user
    return {
        "id": str(current_user.id),
        "name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role.value
    }
