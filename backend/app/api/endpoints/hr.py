from fastapi import APIRouter
from app.api.dependencies.auth import require_role
from app.core.security.roles import Role

router = APIRouter()

@router.post("/allocations/validate", dependencies=[require_role([Role.HR_TEAM])])
async def validate_allocations():
    return {"message": "Employee allocation validated"}

@router.post("/attendance/validate", dependencies=[require_role([Role.HR_TEAM])])
async def validate_attendance():
    return {"message": "Attendance validated"}

@router.post("/contracts/validate", dependencies=[require_role([Role.HR_TEAM])])
async def validate_contracts():
    return {"message": "Contract details validated"}
