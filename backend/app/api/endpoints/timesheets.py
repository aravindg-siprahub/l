import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user
from app.core.db.models import User
from app.schemas.timesheet import TimesheetCreate, TimesheetUpdate, TimesheetOut, TimesheetClientApprove, TimesheetClientReject
from app.services import timesheet_service

router = APIRouter()


@router.post("/", response_model=TimesheetOut, status_code=status.HTTP_201_CREATED)
def create_timesheet(
    payload: TimesheetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new draft timesheet."""
    return timesheet_service.create_timesheet(db, payload, current_user.id)


@router.get("/", response_model=list[TimesheetOut])
def get_timesheets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all timesheets for the authenticated candidate."""
    return timesheet_service.get_timesheets_for_candidate(db, current_user.id)


@router.get("/{timesheet_id}", response_model=TimesheetOut)
def get_timesheet(
    timesheet_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve a specific timesheet's details and entries."""
    return timesheet_service.get_timesheet_by_id(db, timesheet_id, current_user.id)


@router.put("/{timesheet_id}", response_model=TimesheetOut)
def update_timesheet(
    timesheet_id: uuid.UUID,
    payload: TimesheetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a draft or rejected timesheet's entries."""
    return timesheet_service.update_timesheet(db, timesheet_id, payload, current_user.id)


@router.post("/{timesheet_id}/submit", response_model=TimesheetOut)
def submit_timesheet(
    timesheet_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit a draft/rejected timesheet for approval."""
    return timesheet_service.submit_timesheet(db, timesheet_id, current_user.id)


# --- Client Manager Routes ---

@router.get("/client-pending/", response_model=list[TimesheetOut])
def get_client_pending_timesheets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all timesheets waiting for client manager approval."""
    # In a real app we'd verify current_user.role == UserRole.client_manager
    return timesheet_service.get_client_pending_timesheets(db)


@router.post("/{timesheet_id}/client-approve", response_model=TimesheetOut)
def client_approve_timesheet(
    timesheet_id: uuid.UUID,
    payload: TimesheetClientApprove,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Client Manager approves a timesheet."""
    return timesheet_service.approve_timesheet_by_client(db, timesheet_id, current_user.id, payload.comments)


@router.post("/{timesheet_id}/client-reject", response_model=TimesheetOut)
def client_reject_timesheet(
    timesheet_id: uuid.UUID,
    payload: TimesheetClientReject,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Client Manager rejects a timesheet with a required reason."""
    return timesheet_service.reject_timesheet_by_client(db, timesheet_id, current_user.id, payload.reason)
