"""Invoice CRUD query service — read-only queries for the invoice store."""
from __future__ import annotations

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db.models import Invoice


def get_all_invoices(db: Session) -> list[Invoice]:
    """Return all invoices ordered by most recently issued."""
    stmt = select(Invoice).order_by(Invoice.issued_at.desc())
    return list(db.scalars(stmt).all())


def get_invoice_by_id(db: Session, invoice_id: uuid.UUID) -> Invoice:
    """Return a single invoice by primary key."""
    invoice = db.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice {invoice_id} not found.",
        )
    return invoice


def get_invoice_by_timesheet(db: Session, timesheet_id: uuid.UUID) -> Invoice:
    """Return the invoice associated with a specific timesheet."""
    invoice = db.scalar(select(Invoice).where(Invoice.timesheet_id == timesheet_id))
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No invoice found for timesheet {timesheet_id}.",
        )
    return invoice
