"""Finance Team validation service — wraps Invoice Engine."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db.models import Invoice, Timesheet, TimesheetStatus
from app.services.invoice_engine import InvoiceConfig, create_invoice


def get_finance_dashboard_stats(db: Session) -> dict:
    """Return aggregated live stats for the finance dashboard."""
    from app.core.db.models import InvoiceStatus
    from sqlalchemy import func
    
    # Timesheets pending
    pending_count = db.scalar(
        select(func.count(Timesheet.id))
        .where(Timesheet.status == TimesheetStatus.client_approved)
    ) or 0
    
    # Invoice counts by status
    invoice_counts = dict(db.execute(
        select(Invoice.status, func.count(Invoice.id))
        .group_by(Invoice.status)
    ).all())
    
    # Revenue (Paid invoices)
    revenue = db.scalar(
        select(func.sum(Invoice.total_amount))
        .where(Invoice.status == InvoiceStatus.paid)
    ) or 0.0
    
    # Outstanding (Sent or Payment Pending)
    outstanding = db.scalar(
        select(func.sum(Invoice.total_amount))
        .where(Invoice.status.in_([InvoiceStatus.sent, InvoiceStatus.payment_pending]))
    ) or 0.0
    
    return {
        "pending_validation": pending_count,
        "draft_invoices": invoice_counts.get(InvoiceStatus.draft, 0),
        "ready_invoices": invoice_counts.get(InvoiceStatus.ready, 0),
        "sent_invoices": invoice_counts.get(InvoiceStatus.sent, 0),
        "paid_invoices": invoice_counts.get(InvoiceStatus.paid, 0),
        "total_revenue": float(revenue),
        "total_outstanding": float(outstanding)
    }


def get_finance_pending_timesheets(db: Session) -> list[Timesheet]:
    """Return all timesheets awaiting Finance team review (client_approved)."""
    stmt = (
        select(Timesheet)
        .where(Timesheet.status == TimesheetStatus.client_approved)
        .order_by(Timesheet.submitted_at.asc())
    )
    return list(db.scalars(stmt).all())


def get_timesheet_for_finance(db: Session, timesheet_id: uuid.UUID) -> Timesheet:
    """Retrieve a timesheet for Finance review (no candidate restriction)."""
    timesheet = db.get(Timesheet, timesheet_id)
    if not timesheet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Timesheet {timesheet_id} not found."
        )
    return timesheet


def finance_approve_timesheet(
    db: Session,
    timesheet_id: uuid.UUID,
    finance_user_id: uuid.UUID,
    config: InvoiceConfig,
) -> Invoice:
    """
    Finance team approves a timesheet:
    Uses row-level locking to prevent duplicates.
    Generates draft invoice within the same transaction.
    """
    stmt = (
        select(Timesheet)
        .where(Timesheet.id == timesheet_id)
        .with_for_update()
    )
    timesheet = db.scalars(stmt).first()
    
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

    try:
        from app.services import notification_service
        db.refresh(timesheet.candidate)
        notification_service.notify_candidate_timesheet_approved(
            timesheet, timesheet.candidate.full_name, timesheet.candidate.email, "Finance Team"
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to send notification: {e}")

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
    Uses row-level locking.
    """
    stmt = (
        select(Timesheet)
        .where(Timesheet.id == timesheet_id)
        .with_for_update()
    )
    timesheet = db.scalars(stmt).first()
    
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

    try:
        from app.services import notification_service
        db.refresh(timesheet.candidate)
        notification_service.notify_candidate_timesheet_rejected(
            timesheet, timesheet.candidate.full_name, timesheet.candidate.email, "Finance Team"
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to send notification: {e}")

    return timesheet
