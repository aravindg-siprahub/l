"""Finance Team validation service — wraps Invoice Engine."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db.models import Invoice, Timesheet, TimesheetStatus
from app.services.invoice_engine import InvoiceConfig, create_invoice
from sqlalchemy.orm import joinedload


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


def get_finance_trend(db: Session) -> dict:
    """Return trend data for finance dashboard over the last 7 days."""
    from datetime import timedelta
    from app.core.db.models import InvoiceStatus
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)
    
    # We will track invoices created or updated in the last 7 days
    stmt = select(Invoice).where(
        (Invoice.created_at >= seven_days_ago) |
        (Invoice.updated_at >= seven_days_ago)
    )
    invoices = db.scalars(stmt).all()
    
    trend_map = {}
    for i in range(7):
        d = now - timedelta(days=6 - i)
        date_str = d.strftime("%b ") + str(d.day)
        trend_map[date_str] = {"draft": 0, "sent": 0, "paid": 0}
        
    for inv in invoices:
        action_time = inv.updated_at or inv.created_at
        if action_time >= seven_days_ago:
            d_str = action_time.strftime("%b ") + str(action_time.day)
            if d_str in trend_map:
                if inv.status in (InvoiceStatus.draft, InvoiceStatus.ready):
                    trend_map[d_str]["draft"] += 1
                elif inv.status in (InvoiceStatus.sent, InvoiceStatus.payment_pending):
                    trend_map[d_str]["sent"] += 1
                elif inv.status == InvoiceStatus.paid:
                    trend_map[d_str]["paid"] += 1
                    
    result = []
    for date_str, counts in trend_map.items():
        result.append({
            "date": date_str,
            "draft": counts["draft"],
            "sent": counts["sent"],
            "paid": counts["paid"],
        })
    return {"data": result}


def get_finance_pending_timesheets(db: Session) -> list[Timesheet]:
    """Return all timesheets awaiting Finance team review (client_approved)."""
    stmt = (
        select(Timesheet)
        .options(joinedload(Timesheet.candidate))
        .where(Timesheet.status == TimesheetStatus.client_approved)
        .order_by(Timesheet.submitted_at.asc())
    )
    return list(db.scalars(stmt).all())


def get_timesheet_for_finance(db: Session, timesheet_id: uuid.UUID) -> Timesheet:
    """Retrieve a timesheet for Finance review (no candidate restriction)."""
    stmt = select(Timesheet).options(joinedload(Timesheet.candidate)).where(Timesheet.id == timesheet_id)
    timesheet = db.scalar(stmt)
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
