"""Finance Team validation service — wraps Invoice Engine."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db.models import Invoice, Timesheet, TimesheetStatus
from app.services.invoice_engine import InvoiceConfig, create_invoice


def get_finance_pending_timesheets(db: Session) -> list[Timesheet]:
    """Return all timesheets awaiting Finance team review (client_approved)."""
    stmt = (
        select(Timesheet)
        .where(Timesheet.status == TimesheetStatus.client_approved)
        .order_by(Timesheet.submitted_at.asc())
    )
    return list(db.scalars(stmt).all())


def finance_approve_timesheet(
    db: Session,
    timesheet_id: uuid.UUID,
    finance_user_id: uuid.UUID,
    config: InvoiceConfig,
) -> Invoice:
    """
    Finance team approves a timesheet:
    1. Validates status is client_approved.
    2. Locks the timesheet (immutable after this point).
    3. Sets status to finance_approved.
    4. Delegates to the Invoice Engine to generate the invoice.
    5. Commits and returns the Invoice.
    """
    timesheet = db.get(Timesheet, timesheet_id)
    if not timesheet or timesheet.status != TimesheetStatus.client_approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Timesheet not found or not in client_approved status.",
        )

    # 1. Lock + approve
    timesheet.status = TimesheetStatus.finance_approved
    timesheet.is_locked = True
    timesheet.reviewed_by_id = finance_user_id
    timesheet.reviewed_at = datetime.now(timezone.utc)

    # 2. Generate invoice (raises 409 if already exists)
    invoice = create_invoice(db, timesheet, finance_user_id, config)

    db.commit()
    db.refresh(invoice)
    return invoice


def finance_reject_timesheet(
    db: Session,
    timesheet_id: uuid.UUID,
    finance_user_id: uuid.UUID,
    reason: str,
) -> Timesheet:
    """
    Finance team rejects a timesheet:
    Returns it to the Candidate (finance_rejected) with a required reason.
    The Candidate can then edit and resubmit through the full workflow.
    """
    timesheet = db.get(Timesheet, timesheet_id)
    if not timesheet or timesheet.status != TimesheetStatus.client_approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Timesheet not found or not in client_approved status.",
        )

    timesheet.status = TimesheetStatus.finance_rejected
    timesheet.rejection_reason = reason
    timesheet.reviewed_by_id = finance_user_id
    timesheet.reviewed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(timesheet)
    return timesheet
