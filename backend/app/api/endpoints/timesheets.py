from fastapi import APIRouter
from app.api.dependencies.auth import require_role
from app.core.security.roles import Role

router = APIRouter()

# Employee Routes
@router.post("", dependencies=[require_role([Role.CANDIDATE_EMPLOYEE])])
async def submit_timesheet():
    return {"message": "Timesheet submitted"}

@router.get("/me", dependencies=[require_role([Role.CANDIDATE_EMPLOYEE])])
async def get_my_timesheets():
    return {"message": "Viewing own timesheets"}

@router.put("/{id}", dependencies=[require_role([Role.CANDIDATE_EMPLOYEE])])
async def edit_timesheet(id: str):
    return {"message": f"Timesheet {id} edited"}

# Client Manager Routes
@router.get("/assigned", dependencies=[require_role([Role.CLIENT_MANAGER])])
async def review_assigned_timesheets():
    return {"message": "Reviewing assigned timesheets"}

@router.post("/{id}/approve", dependencies=[require_role([Role.CLIENT_MANAGER])])
async def approve_timesheet(id: str):
    return {"message": f"Timesheet {id} approved"}

@router.post("/{id}/reject", dependencies=[require_role([Role.CLIENT_MANAGER])])
async def reject_timesheet(id: str):
    return {"message": f"Timesheet {id} rejected"}

@router.post("/{id}/comments", dependencies=[require_role([Role.CLIENT_MANAGER])])
async def add_comments(id: str):
    return {"message": f"Added comments to timesheet {id}"}
