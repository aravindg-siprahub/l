from fastapi import APIRouter
from app.api.dependencies.auth import require_role
from app.core.security.roles import Role

router = APIRouter()

@router.get("/users", dependencies=[require_role([Role.SYSTEM_ADMINISTRATOR])])
async def get_users():
    return {"message": "User management access granted"}

@router.get("/roles", dependencies=[require_role([Role.SYSTEM_ADMINISTRATOR])])
async def get_roles():
    return {"message": "Role management access granted"}

@router.get("/workflows", dependencies=[require_role([Role.SYSTEM_ADMINISTRATOR])])
async def get_workflows():
    return {"message": "Workflow configuration access granted"}

@router.get("/audit", dependencies=[require_role([Role.SYSTEM_ADMINISTRATOR])])
async def get_audit_logs():
    return {"message": "Audit logs access granted"}

@router.get("/settings", dependencies=[require_role([Role.SYSTEM_ADMINISTRATOR])])
async def get_settings():
    return {"message": "System settings access granted"}
