import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException, status

from app.core.db.models import Timesheet, TimesheetEntry, TimesheetStatus
from app.schemas.timesheet import TimesheetCreate, TimesheetUpdate


def get_timesheets_for_candidate(db: Session, candidate_id: uuid.UUID) -> list[Timesheet]:
    """Retrieve all timesheets for a given candidate."""
    stmt = select(Timesheet).where(Timesheet.candidate_id == candidate_id).order_by(Timesheet.created_at.desc())
    return list(db.scalars(stmt).all())


def get_timesheet_by_id(db: Session, timesheet_id: uuid.UUID, candidate_id: uuid.UUID) -> Timesheet:
    """Retrieve a specific timesheet, ensuring it belongs to the requesting candidate."""
    timesheet = db.get(Timesheet, timesheet_id)
    if not timesheet or timesheet.candidate_id != candidate_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timesheet not found or access denied."
        )
    return timesheet


def create_timesheet(db: Session, payload: TimesheetCreate, candidate_id: uuid.UUID) -> Timesheet:
    """Create a new draft timesheet with optional initial entries."""
    timesheet = Timesheet(
        candidate_id=candidate_id,
        period_start_date=payload.period_start_date,
        period_end_date=payload.period_end_date,
        notes=payload.notes,
        status=TimesheetStatus.draft,
        total_hours=sum(entry.hours_worked for entry in payload.entries)
    )
    db.add(timesheet)
    db.flush()  # To get timesheet.id for entries

    for entry in payload.entries:
        db.add(TimesheetEntry(
            timesheet_id=timesheet.id,
            date=entry.date,
            hours_worked=entry.hours_worked,
            task_description=entry.task_description
        ))
    
    db.commit()
    db.refresh(timesheet)
    return timesheet


def update_timesheet(db: Session, timesheet_id: uuid.UUID, payload: TimesheetUpdate, candidate_id: uuid.UUID) -> Timesheet:
    """Update a draft or rejected timesheet, replacing its entries entirely."""
    timesheet = get_timesheet_by_id(db, timesheet_id, candidate_id)

    if timesheet.status not in (TimesheetStatus.draft, TimesheetStatus.client_rejected, TimesheetStatus.finance_rejected):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot edit timesheet in status: {timesheet.status.value}"
        )

    # Update header
    timesheet.period_start_date = payload.period_start_date
    timesheet.period_end_date = payload.period_end_date
    timesheet.notes = payload.notes
    timesheet.total_hours = sum(entry.hours_worked for entry in payload.entries)

    # Replace entries (delete old, insert new)
    for existing_entry in timesheet.entries:
        db.delete(existing_entry)
    
    for entry in payload.entries:
        db.add(TimesheetEntry(
            timesheet_id=timesheet.id,
            date=entry.date,
            hours_worked=entry.hours_worked,
            task_description=entry.task_description
        ))

    db.commit()
    db.refresh(timesheet)
    return timesheet


def submit_timesheet(db: Session, timesheet_id: uuid.UUID, candidate_id: uuid.UUID) -> Timesheet:
    """Change the status of a timesheet to submitted."""
    timesheet = get_timesheet_by_id(db, timesheet_id, candidate_id)

    if timesheet.status not in (TimesheetStatus.draft, TimesheetStatus.client_rejected, TimesheetStatus.finance_rejected):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Timesheet is already {timesheet.status.value}"
        )

    timesheet.status = TimesheetStatus.submitted
    timesheet.submitted_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(timesheet)
    return timesheet


def get_client_pending_timesheets(db: Session) -> list[Timesheet]:
    """Retrieve all timesheets waiting for client manager approval."""
    stmt = select(Timesheet).where(Timesheet.status == TimesheetStatus.submitted).order_by(Timesheet.submitted_at.asc())
    return list(db.scalars(stmt).all())


def approve_timesheet_by_client(db: Session, timesheet_id: uuid.UUID, client_id: uuid.UUID, comments: str | None) -> Timesheet:
    """Client Manager approves a timesheet, pushing it to the finance queue."""
    timesheet = db.get(Timesheet, timesheet_id)
    if not timesheet or timesheet.status != TimesheetStatus.submitted:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Timesheet not found or not in submitted status.")
    
    timesheet.status = TimesheetStatus.client_approved
    timesheet.reviewed_by_id = client_id
    timesheet.reviewed_at = datetime.now(timezone.utc)
    timesheet.approval_comments = comments
    
    db.commit()
    db.refresh(timesheet)
    return timesheet


def reject_timesheet_by_client(db: Session, timesheet_id: uuid.UUID, client_id: uuid.UUID, reason: str) -> Timesheet:
    """Client Manager rejects a timesheet, returning it to the candidate."""
    timesheet = db.get(Timesheet, timesheet_id)
    if not timesheet or timesheet.status != TimesheetStatus.submitted:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Timesheet not found or not in submitted status.")
    
    timesheet.status = TimesheetStatus.client_rejected
    timesheet.rejection_reason = reason
    timesheet.reviewed_by_id = client_id
    timesheet.reviewed_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(timesheet)
    return timesheet
