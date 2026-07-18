"""
Invoice Engine — core reusable invoice generation service.

This module has NO knowledge of HTTP, FastAPI, or the frontend.
It exposes a clean interface consumed by finance_service.py.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.core.db.models import Invoice, InvoiceStatus, Timesheet, TimesheetEntry


@dataclass
class InvoiceConfig:
    """Configuration for invoice generation. Defaults represent the MVP contract."""
    hourly_rate: float = 150.0
    tax_rate: float = 0.0
    payment_terms: str = "Net 30"
    notes: str | None = None
    client_name: str = "Test Client Organization"
    billing_contact: str | None = None
    billing_address: str | None = None
    billing_email: str | None = None


def create_invoice(
    db: Session,
    timesheet: Timesheet,
    finance_user_id: uuid.UUID,
    config: InvoiceConfig | None = None,
) -> Invoice:
    """
    Orchestrate invoice generation from an approved timesheet.
    """
    from app.services.finance_calculation_service import calculate_invoice_totals
    from app.services.invoice_generator import generate_invoice_number, build_work_summary
    
    if config is None:
        config = InvoiceConfig()

    existing = db.scalar(select(Invoice).where(Invoice.timesheet_id == timesheet.id))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An invoice already exists for timesheet {timesheet.id}: {existing.invoice_number}",
        )

    invoice_number = generate_invoice_number(db)
    financials = calculate_invoice_totals(timesheet.total_hours, config.hourly_rate, config.tax_rate)
    work_summary = build_work_summary(list(timesheet.entries), timesheet.period_start_date, timesheet.period_end_date)

    now = datetime.now(timezone.utc)
    due = now + timedelta(days=30)
    
    # Freeze snapshot data
    snapshot_data = {
        "hourly_rate": config.hourly_rate,
        "tax_rate": config.tax_rate,
        "payment_terms": config.payment_terms,
        "client_name": config.client_name,
        "billing_contact": config.billing_contact,
        "billing_address": config.billing_address,
        "billing_email": config.billing_email,
        "currency": "USD"
    }

    invoice = Invoice(
        timesheet_id=timesheet.id,
        candidate_id=timesheet.candidate_id,
        generated_by_id=finance_user_id,
        invoice_number=invoice_number,
        status=InvoiceStatus.draft,
        period_start_date=timesheet.period_start_date,
        period_end_date=timesheet.period_end_date,
        total_hours=timesheet.total_hours,
        hourly_rate=config.hourly_rate,
        subtotal=financials["subtotal"],
        tax_rate=config.tax_rate,
        tax_amount=financials["tax_amount"],
        total_amount=financials["total_amount"],
        work_summary=work_summary,
        payment_terms=config.payment_terms,
        notes=config.notes,
        issued_at=now,
        due_date=due,
        snapshot_data=snapshot_data,
        currency="USD",
        template_name="default"
    )
    db.add(invoice)
    return invoice
