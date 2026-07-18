import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user, require_client_manager
from app.core.db.models import User, TimesheetStatus
from app.schemas.timesheet import (
    TimesheetCreate, TimesheetUpdate, TimesheetOut,
    TimesheetClientApprove, TimesheetClientReject, TimesheetSharePayload,
    TimesheetAuditLogOut, PaginatedTimesheetResponse, ClientManagerStatsOut,
)
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

@router.get("/client-pending/", response_model=PaginatedTimesheetResponse)
def get_client_pending_timesheets(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_manager),
    page: int = Query(default=1, ge=1, description="Page number (1-based)"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page (max 100)"),
    search: Optional[str] = Query(default=None, description="Filter by candidate name (case-insensitive)"),
    status_filter: Optional[str] = Query(default=None, description="Comma-separated statuses, e.g. 'submitted' or 'client_approved,client_rejected'"),
    sort_by: str = Query(default="submitted_at", pattern="^(submitted_at|period_start_date|total_hours)$"),
    sort_order: str = Query(default="asc", pattern="^(asc|desc)$"),
):
    """
    Paginated, searchable, sortable list of timesheets for this client manager.
    Defaults to submitted-only (pending queue). Pass status_filter to change.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Parse status_filter query param (comma-separated string → list of enum values)
    parsed_statuses = None
    if status_filter:
        try:
            parsed_statuses = [TimesheetStatus(s.strip()) for s in status_filter.split(",") if s.strip()]
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid status value in status_filter: {exc}",
            )

    result = timesheet_service.get_client_pending_timesheets_paginated(
        db=db,
        client_email=current_user.email,
        page=page,
        page_size=page_size,
        search=search,
        status_filter=parsed_statuses,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return PaginatedTimesheetResponse.from_paginated(result)


@router.get("/client-review/{timesheet_id}", response_model=TimesheetOut)
def get_timesheet_for_client_review(
    timesheet_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_manager),
):
    """
    Retrieve a timesheet for client manager review.
    Uses assignment-based authorization (manager_email check) instead of candidate ownership.
    This is the correct endpoint for the review page — fixes the 404 bug on the candidate-scoped endpoint.
    """
    ts = timesheet_service.get_timesheet_for_client_review(
        db, timesheet_id, current_user.email
    )
    return TimesheetOut.from_orm_with_candidate(ts)


@router.get("/client-stats", response_model=ClientManagerStatsOut)
def get_client_manager_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_manager),
):
    """Live dashboard counts for the authenticated client manager."""
    return timesheet_service.get_client_manager_stats(db, current_user.email)


@router.get("/{timesheet_id}/audit", response_model=list[TimesheetAuditLogOut])
def get_timesheet_audit_log(
    timesheet_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_manager),
):
    """Return the audit log for a specific timesheet (assigned manager only)."""
    logs = timesheet_service.get_timesheet_audit_log(db, timesheet_id, current_user.email)
    return [TimesheetAuditLogOut.from_orm_with_actor(log) for log in logs]


@router.post("/{timesheet_id}/client-approve", response_model=TimesheetOut)
def client_approve_timesheet(
    timesheet_id: uuid.UUID,
    payload: TimesheetClientApprove,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_manager),
):
    """Client Manager approves a timesheet."""
    return timesheet_service.approve_timesheet_by_client(
        db, timesheet_id, current_user.id, current_user.email, payload.comments
    )


@router.post("/{timesheet_id}/client-reject", response_model=TimesheetOut)
def client_reject_timesheet(
    timesheet_id: uuid.UUID,
    payload: TimesheetClientReject,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_manager),
):
    """Client Manager rejects a timesheet with a required reason."""
    return timesheet_service.reject_timesheet_by_client(
        db, timesheet_id, current_user.id, current_user.email, payload.reason
    )


# --- Phase 1: Candidate → Manager Sharing ---

@router.post("/{timesheet_id}/share", response_model=TimesheetOut)
def share_timesheet(
    timesheet_id: uuid.UUID,
    payload: TimesheetSharePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Candidate shares their submitted timesheet with a manager.
    Generates a PDF and emails it as an attachment.
    Updates manager_email, manager_name, shared_at on success.
    Database is only updated after successful email delivery.
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info("STAGE 1: Endpoint entered for timesheet_id=%s", timesheet_id)
    try:
        result = timesheet_service.share_timesheet_with_manager(
            db, timesheet_id, current_user.id, payload, current_user.full_name
        )
        logger.info("STAGE 10: API response returned for timesheet_id=%s", timesheet_id)
        return result
    except Exception as exc:
        import traceback
        import sys
        exc_type, exc_value, exc_traceback = sys.exc_info()
        tb = traceback.extract_tb(exc_traceback)
        filename = tb[-1].filename if tb else "Unknown"
        lineno = tb[-1].lineno if tb else 0
        logger.exception(
            "STAGE 10 EXCEPTION: API response failed for timesheet_id=%s | "
            "type=%s | message=%s | file=%s | line=%s", 
            timesheet_id, type(exc).__name__, str(exc), filename, lineno
        )
        raise


@router.get("/{timesheet_id}/pdf")
def download_timesheet_pdf(
    timesheet_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Download a PDF of the candidate's own timesheet.
    Authenticated and owner-only. Draft timesheets are not downloadable.
    """
    pdf_bytes, filename = timesheet_service.get_timesheet_pdf_bytes(
        db, timesheet_id, current_user.id, current_user.full_name
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{timesheet_id}/excel")
def download_timesheet_excel(
    timesheet_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Download an Excel file of the candidate's own timesheet.
    Authenticated and owner-only. Draft timesheets are not downloadable.
    """
    excel_bytes, filename = timesheet_service.get_timesheet_excel_bytes(
        db, timesheet_id, current_user.id, current_user.full_name
    )
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
