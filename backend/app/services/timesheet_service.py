import uuid
from datetime import datetime, timezone
import logging
from typing import Optional
from dataclasses import dataclass

from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.core.exceptions import InfrastructureError

logger = logging.getLogger(__name__)

from app.core.db.models import (
    Timesheet, TimesheetEntry, TimesheetStatus,
    TimesheetAuditLog, TimesheetAuditAction,
)
from app.schemas.timesheet import TimesheetCreate, TimesheetUpdate


# ── Paginated response dataclass ──────────────────────────────────────────────

@dataclass
class PaginatedTimesheets:
    """Lightweight container for paginated timesheet query results."""
    items: list[Timesheet]
    total: int
    page: int
    page_size: int


# ── Audit log helper ─────────────────────────────────────────────────────────

def write_audit_log(
    db: Session,
    timesheet_id: uuid.UUID,
    actor_id: uuid.UUID | None,
    actor_role: str,
    action: TimesheetAuditAction,
    comments: str | None = None,
) -> TimesheetAuditLog:
    """
    Append an immutable audit event to the log.

    MUST be called inside the same transaction as the associated status change.
    The caller (approve/reject/submit) owns the commit — this function only adds
    the record to the session; it does NOT commit.
    """
    entry = TimesheetAuditLog(
        timesheet_id=timesheet_id,
        actor_id=actor_id,
        actor_role=actor_role,
        action=action,
        comments=comments,
    )
    db.add(entry)
    return entry


# ── Candidate-scoped functions ────────────────────────────────────────────────

def get_timesheets_for_candidate(db: Session, candidate_id: uuid.UUID) -> list[Timesheet]:
    """Retrieve all timesheets for a given candidate."""
    stmt = (
        select(Timesheet)
        .where(Timesheet.candidate_id == candidate_id)
        .order_by(Timesheet.created_at.desc())
    )
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
        total_hours=sum(entry.hours_worked for entry in payload.entries),
        current_version=1,
    )
    db.add(timesheet)
    db.flush()  # get timesheet.id for entries

    for entry in payload.entries:
        db.add(TimesheetEntry(
            timesheet_id=timesheet.id,
            date=entry.date,
            hours_worked=entry.hours_worked,
            task_description=entry.task_description,
            version=1,
        ))

    db.commit()
    db.refresh(timesheet)
    return timesheet


def update_timesheet(
    db: Session,
    timesheet_id: uuid.UUID,
    payload: TimesheetUpdate,
    candidate_id: uuid.UUID,
) -> Timesheet:
    """
    Update a draft or rejected timesheet.

    Version preservation rule:
      - On FIRST update (draft → still draft), entries are replaced as before
        since no submitted version exists yet.
      - On RESUBMIT update (after rejection), the previous submitted entries are
        preserved by incrementing the version counter and inserting new entries
        at the new version number. Old entries (lower version) are never deleted.
    """
    timesheet = get_timesheet_by_id(db, timesheet_id, candidate_id)

    if timesheet.status not in (
        TimesheetStatus.draft,
        TimesheetStatus.client_rejected,
        TimesheetStatus.finance_rejected,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot edit timesheet in status: {timesheet.status.value}",
        )

    # Update header fields
    timesheet.period_start_date = payload.period_start_date
    timesheet.period_end_date = payload.period_end_date
    timesheet.notes = payload.notes
    timesheet.total_hours = sum(entry.hours_worked for entry in payload.entries)

    if timesheet.status == TimesheetStatus.draft:
        # Draft: no submitted version exists yet — replace entries directly
        for existing_entry in timesheet.entries:
            db.delete(existing_entry)
        new_version = 1
    else:
        # Rejected resubmit: preserve prior entries, increment version
        new_version = timesheet.current_version + 1
        timesheet.current_version = new_version

    for entry in payload.entries:
        db.add(TimesheetEntry(
            timesheet_id=timesheet.id,
            date=entry.date,
            hours_worked=entry.hours_worked,
            task_description=entry.task_description,
            version=new_version,
        ))

    db.commit()
    db.refresh(timesheet)
    return timesheet


def submit_timesheet(
    db: Session,
    timesheet_id: uuid.UUID,
    candidate_id: uuid.UUID,
) -> Timesheet:
    """Change the status of a timesheet to submitted and write an audit entry."""
    timesheet = get_timesheet_by_id(db, timesheet_id, candidate_id)

    if timesheet.status not in (
        TimesheetStatus.draft,
        TimesheetStatus.client_rejected,
        TimesheetStatus.finance_rejected,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Timesheet is already {timesheet.status.value}",
        )

    is_resubmit = timesheet.status in (
        TimesheetStatus.client_rejected,
        TimesheetStatus.finance_rejected,
    )
    action = TimesheetAuditAction.resubmitted if is_resubmit else TimesheetAuditAction.submitted

    timesheet.status = TimesheetStatus.submitted
    timesheet.submitted_at = datetime.now(timezone.utc)

    write_audit_log(
        db=db,
        timesheet_id=timesheet.id,
        actor_id=candidate_id,
        actor_role="candidate",
        action=action,
    )

    db.commit()
    db.refresh(timesheet)
    return timesheet


# ── Client Manager-scoped functions ──────────────────────────────────────────

def get_client_pending_timesheets(db: Session, client_email: str) -> list[Timesheet]:
    """
    Retrieve all submitted timesheets assigned to this client manager.
    Eagerly loads the candidate relationship to avoid N+1 queries.
    """
    stmt = (
        select(Timesheet)
        .options(joinedload(Timesheet.candidate))
        .where(Timesheet.status == TimesheetStatus.submitted)
        .where(Timesheet.manager_email == client_email)
        .order_by(Timesheet.submitted_at.asc())
    )
    return list(db.scalars(stmt).unique().all())


def get_client_pending_timesheets_paginated(
    db: Session,
    client_email: str,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    status_filter: list[TimesheetStatus] | None = None,
    sort_by: str = "submitted_at",
    sort_order: str = "asc",
) -> PaginatedTimesheets:
    """
    Paginated, searchable, filterable list of timesheets for this client manager.
    Uses a single JOIN query — no N+1.

    Filters:
      - search: matches against candidate full_name (case-insensitive)
      - status_filter: list of statuses to include (defaults to submitted only)
      - sort_by: "submitted_at" | "period_start_date" | "total_hours"
      - sort_order: "asc" | "desc"
    """
    from app.core.db.models import User

    if status_filter is None:
        status_filter = [TimesheetStatus.submitted]

    # Sort column mapping — validated against allowed values to prevent injection
    sort_column_map = {
        "submitted_at": Timesheet.submitted_at,
        "period_start_date": Timesheet.period_start_date,
        "total_hours": Timesheet.total_hours,
    }
    sort_col = sort_column_map.get(sort_by, Timesheet.submitted_at)
    order_expr = sort_col.asc() if sort_order == "asc" else sort_col.desc()

    base_query = (
        select(Timesheet)
        .join(User, Timesheet.candidate_id == User.id)
        .options(joinedload(Timesheet.candidate))
        .where(Timesheet.manager_email == client_email)
        .where(Timesheet.status.in_(status_filter))
    )

    if search:
        base_query = base_query.where(
            User.full_name.ilike(f"%{search}%")
        )

    # Total count (separate query to avoid LIMIT interference)
    count_stmt = select(func.count()).select_from(base_query.subquery())
    total = db.scalar(count_stmt) or 0

    # Paginated items
    page_size = min(max(page_size, 1), 100)  # clamp: 1–100
    offset = (max(page, 1) - 1) * page_size

    items_stmt = base_query.order_by(order_expr).offset(offset).limit(page_size)
    items = list(db.scalars(items_stmt).unique().all())

    return PaginatedTimesheets(items=items, total=total, page=page, page_size=page_size)


def get_timesheet_for_client_review(
    db: Session,
    timesheet_id: uuid.UUID,
    manager_email: str,
) -> Timesheet:
    """
    Retrieve a timesheet for client manager review.

    Authorization contract:
      - Does NOT check candidate ownership (timesheet.candidate_id != manager's id).
      - DOES validate manager_email == timesheet.manager_email (assignment guard).
      - DOES validate the timesheet is not in draft status.
      - Eagerly loads candidate, entries, and audit logs.

    Raises 404 if the timesheet doesn't exist or the manager is not assigned.
    Raises 403 if the timesheet is a draft (manager has no business seeing drafts).
    """
    stmt = (
        select(Timesheet)
        .options(
            joinedload(Timesheet.candidate),
            joinedload(Timesheet.entries),
            joinedload(Timesheet.reviewed_by),
        )
        .where(Timesheet.id == timesheet_id)
    )
    timesheet = db.scalars(stmt).unique().first()

    if not timesheet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timesheet not found.",
        )

    if timesheet.status == TimesheetStatus.draft:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Draft timesheets cannot be reviewed.",
        )

    if timesheet.manager_email != manager_email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not assigned to review this timesheet.",
        )

    return timesheet


def get_client_manager_stats(db: Session, manager_email: str) -> dict:
    """
    Return live dashboard counts for a client manager.
    Uses three targeted aggregation queries — no N+1.
    """
    from datetime import date
    from sqlalchemy import extract

    now = datetime.now(timezone.utc)

    pending_count = db.scalar(
        select(func.count(Timesheet.id))
        .where(Timesheet.manager_email == manager_email)
        .where(Timesheet.status == TimesheetStatus.submitted)
    ) or 0

    approved_this_month = db.scalar(
        select(func.count(Timesheet.id))
        .where(Timesheet.manager_email == manager_email)
        .where(Timesheet.status == TimesheetStatus.client_approved)
        .where(extract("year", Timesheet.reviewed_at) == now.year)
        .where(extract("month", Timesheet.reviewed_at) == now.month)
    ) or 0

    rejected_this_month = db.scalar(
        select(func.count(Timesheet.id))
        .where(Timesheet.manager_email == manager_email)
        .where(Timesheet.status == TimesheetStatus.client_rejected)
        .where(extract("year", Timesheet.reviewed_at) == now.year)
        .where(extract("month", Timesheet.reviewed_at) == now.month)
    ) or 0

    return {
        "pending": pending_count,
        "approved_this_month": approved_this_month,
        "rejected_this_month": rejected_this_month,
    }


def get_timesheet_audit_log(
    db: Session,
    timesheet_id: uuid.UUID,
    requester_email: str,
) -> list[TimesheetAuditLog]:
    """
    Return the audit log for a timesheet.
    Access control: only the assigned manager can query this.
    """
    # Verify the timesheet exists and requester is assigned
    timesheet = db.get(Timesheet, timesheet_id)
    if not timesheet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timesheet not found.",
        )
    if timesheet.manager_email != requester_email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not assigned to this timesheet.",
        )

    stmt = (
        select(TimesheetAuditLog)
        .options(joinedload(TimesheetAuditLog.actor))
        .where(TimesheetAuditLog.timesheet_id == timesheet_id)
        .order_by(TimesheetAuditLog.created_at.asc())
    )
    return list(db.scalars(stmt).unique().all())


def approve_timesheet_by_client(
    db: Session,
    timesheet_id: uuid.UUID,
    client_id: uuid.UUID,
    client_email: str,
    comments: str | None,
) -> Timesheet:
    """
    Client Manager approves a timesheet, pushing it to the finance queue.

    Guards:
      1. Row-level lock (SELECT FOR UPDATE) prevents duplicate concurrent approvals.
      2. Status must be 'submitted' — clear error for any other state.
      3. Assignment guard: manager_email must match the requesting manager.
      4. is_locked guard: finance-locked timesheets cannot be re-acted on.
      5. Audit log written inside the same transaction.
    """
    from app.services import notification_service

    # 1. Acquire row-level lock before reading status
    stmt = (
        select(Timesheet)
        .where(Timesheet.id == timesheet_id)
        .with_for_update()
    )
    timesheet = db.scalars(stmt).first()

    if not timesheet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timesheet not found.",
        )

    # 2. Status guard
    if timesheet.status != TimesheetStatus.submitted:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Cannot approve: timesheet is already '{timesheet.status.value}'. "
                "Only submitted timesheets can be approved."
            ),
        )

    # 3. Assignment guard
    if timesheet.manager_email != client_email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not assigned to review this timesheet.",
        )

    # 4. Lock guard
    if timesheet.is_locked:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This timesheet has been locked by Finance and cannot be modified.",
        )

    # 5. Mutate and write audit log atomically
    timesheet.status = TimesheetStatus.client_approved
    timesheet.reviewed_by_id = client_id
    timesheet.reviewed_at = datetime.now(timezone.utc)
    timesheet.approval_comments = comments

    write_audit_log(
        db=db,
        timesheet_id=timesheet.id,
        actor_id=client_id,
        actor_role="client_manager",
        action=TimesheetAuditAction.client_approved,
        comments=comments,
    )

    db.commit()
    db.refresh(timesheet)

    # Send notifications after commit (failure is logged, not raised)
    try:
        candidate = timesheet.candidate
        notification_service.notify_candidate_timesheet_approved(
            timesheet, candidate.full_name, candidate.email,
            timesheet.manager_name or "Manager"
        )
        notification_service.notify_finance_timesheet_approved(
            timesheet, candidate.full_name, timesheet.manager_name or "Manager"
        )
    except Exception as exc:
        logger.error(
            "Notification failed after client approval: timesheet=%s error=%s",
            timesheet.id, exc, exc_info=True,
        )

    return timesheet


def reject_timesheet_by_client(
    db: Session,
    timesheet_id: uuid.UUID,
    client_id: uuid.UUID,
    client_email: str,
    reason: str,
) -> Timesheet:
    """
    Client Manager rejects a timesheet, returning it to the candidate.

    Guards: same as approve_timesheet_by_client (lock, status, assignment, lock).
    Audit log written inside the same transaction.
    """
    from app.services import notification_service

    # 1. Acquire row-level lock
    stmt = (
        select(Timesheet)
        .where(Timesheet.id == timesheet_id)
        .with_for_update()
    )
    timesheet = db.scalars(stmt).first()

    if not timesheet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timesheet not found.",
        )

    # 2. Status guard
    if timesheet.status != TimesheetStatus.submitted:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Cannot reject: timesheet is already '{timesheet.status.value}'. "
                "Only submitted timesheets can be rejected."
            ),
        )

    # 3. Assignment guard
    if timesheet.manager_email != client_email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not assigned to review this timesheet.",
        )

    # 4. Lock guard
    if timesheet.is_locked:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This timesheet has been locked by Finance and cannot be modified.",
        )

    # 5. Mutate and write audit log atomically
    timesheet.status = TimesheetStatus.client_rejected
    timesheet.rejection_reason = reason
    timesheet.reviewed_by_id = client_id
    timesheet.reviewed_at = datetime.now(timezone.utc)

    write_audit_log(
        db=db,
        timesheet_id=timesheet.id,
        actor_id=client_id,
        actor_role="client_manager",
        action=TimesheetAuditAction.client_rejected,
        comments=reason,
    )

    db.commit()
    db.refresh(timesheet)

    # Send notifications after commit (failure is logged, not raised)
    try:
        candidate = timesheet.candidate
        notification_service.notify_candidate_timesheet_rejected(
            timesheet, candidate.full_name, candidate.email,
            timesheet.manager_name or "Manager"
        )
    except Exception as exc:
        logger.error(
            "Notification failed after client rejection: timesheet=%s error=%s",
            timesheet.id, exc, exc_info=True,
        )

    return timesheet


# ── Phase 1: Candidate → Manager Sharing ─────────────────────────────────────

def share_timesheet_with_manager(
    db: Session,
    timesheet_id: uuid.UUID,
    candidate_id: uuid.UUID,
    payload: "TimesheetSharePayload",
    candidate_name: str,
) -> Timesheet:
    """
    Share a submitted timesheet with a manager by email (PDF attached).

    Atomicity contract:
      1. Ownership is verified first (raises 404 if not owner).
      2. Status guard: only submitted/client_rejected/finance_rejected allowed.
      3. PDF is generated in memory (never stored).
      4. Email is sent BEFORE any DB update.
      5. DB is updated ONLY if email succeeds.
      6. Audit log written atomically with the DB update.
      7. If email fails, InfrastructureError propagates unchanged — DB untouched.

    Re-sharing is allowed and simply overwrites the metadata + timestamp.
    """
    from app.services import notification_service
    from app.schemas.timesheet import TimesheetSharePayload  # local import avoids circular

    timesheet = get_timesheet_by_id(db, timesheet_id, candidate_id)
    logger.info("STAGE 2: Timesheet loaded for timesheet_id=%s", timesheet_id)

    # Guard: draft timesheets cannot be shared
    if timesheet.status == TimesheetStatus.draft:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Draft timesheets cannot be shared. Please submit the timesheet first.",
        )
    # Guard: only these statuses are shareable
    shareable_statuses = (
        TimesheetStatus.submitted,
        TimesheetStatus.client_rejected,
        TimesheetStatus.finance_rejected,
    )
    if timesheet.status not in shareable_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Timesheets in '{timesheet.status.value}' status cannot be shared. "
                "Only submitted or rejected timesheets can be shared."
            ),
        )

    # Send notification FIRST — raises InfrastructureError on failure → DB not touched
    try:
        logger.info("STAGE 3: Candidate loaded: name=%s, manager_email=%s", candidate_name, payload.manager_email)
        notification_service.notify_manager_timesheet_shared(
            timesheet, candidate_name, payload.manager_email, payload.manager_name
        )
    except InfrastructureError as exc:
        logger.exception("STAGE 3 EXCEPTION: Infrastructure error during notification")
        raise
    except Exception as exc:
        import traceback
        import sys
        exc_type, exc_value, exc_traceback = sys.exc_info()
        tb = traceback.extract_tb(exc_traceback)
        filename = tb[-1].filename if tb else "Unknown"
        lineno = tb[-1].lineno if tb else 0
        logger.exception(
            "STAGE 3 EXCEPTION: Unhandled exception in share_timesheet_with_manager | "
            "endpoint=/timesheets/%s/share | timesheet_id=%s | candidate_id=%s | "
            "type=%s | message=%s | file=%s | line=%s",
            timesheet.id, timesheet.id, timesheet.candidate_id,
            type(exc).__name__, str(exc), filename, lineno
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while sharing the timesheet. Please try again later."
        )

    # Notification succeeded → update sharing metadata and write audit log
    timesheet.manager_email = str(payload.manager_email)
    timesheet.manager_name  = payload.manager_name
    timesheet.shared_at     = datetime.now(timezone.utc)

    write_audit_log(
        db=db,
        timesheet_id=timesheet.id,
        actor_id=candidate_id,
        actor_role="candidate",
        action=TimesheetAuditAction.shared,
        comments=f"Shared with {payload.manager_name or payload.manager_email}",
    )

    db.commit()
    db.refresh(timesheet)
    return timesheet


def get_timesheet_pdf_bytes(
    db: Session,
    timesheet_id: uuid.UUID,
    candidate_id: uuid.UUID,
    candidate_name: str,
) -> tuple[bytes, str]:
    """
    Generate and return PDF bytes for a candidate's own timesheet.
    Returns (pdf_bytes, pdf_filename). Never stores the PDF.

    Guards: ownership enforced; draft timesheets cannot be downloaded.
    """
    from app.services.timesheet_pdf import generate_timesheet_pdf, build_pdf_filename

    timesheet = get_timesheet_by_id(db, timesheet_id, candidate_id)

    if timesheet.status == TimesheetStatus.draft:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Draft timesheets do not have a downloadable PDF. Please submit first.",
        )

    try:
        pdf_bytes = generate_timesheet_pdf(timesheet, candidate_name)
        filename  = build_pdf_filename(
            candidate_name,
            timesheet.period_start_date,
            timesheet.period_end_date,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate PDF. Please try again.",
        ) from exc

    return pdf_bytes, filename


def get_timesheet_excel_bytes(
    db: Session,
    timesheet_id: uuid.UUID,
    candidate_id: uuid.UUID,
    candidate_name: str,
) -> tuple[bytes, str]:
    """
    Generate and return Excel bytes for a candidate's own timesheet.
    Returns (excel_bytes, excel_filename). Never stores the Excel file.

    Guards: ownership enforced; draft timesheets cannot be downloaded.
    """
    from app.services.timesheet_excel import generate_timesheet_excel, build_excel_filename

    timesheet = get_timesheet_by_id(db, timesheet_id, candidate_id)

    if timesheet.status == TimesheetStatus.draft:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Draft timesheets do not have a downloadable Excel file. Please submit first.",
        )

    try:
        excel_bytes = generate_timesheet_excel(timesheet, candidate_name)
        filename  = build_excel_filename(
            candidate_name,
            timesheet.period_start_date,
            timesheet.period_end_date,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate Excel file. Please try again.",
        ) from exc

    return excel_bytes, filename
