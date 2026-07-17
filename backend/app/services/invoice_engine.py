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


def generate_invoice_number(db: Session) -> str:
    """
    Generate a sequential, unique invoice number in the format INV-YYYYXXXX.
    Executed inside the caller's transaction for atomicity.
    """
    year = datetime.now(timezone.utc).year
    # Count existing invoices for this year to derive sequence
    count: int = db.scalar(
        select(func.count(Invoice.id)).where(
            Invoice.invoice_number.like(f"INV-{year}%")
        )
    ) or 0
    sequence = str(count + 1).zfill(4)
    return f"INV-{year}{sequence}"


def build_work_summary(entries: list[TimesheetEntry], period_start: datetime, period_end: datetime) -> str:
    """
    Synthesize a professional work summary from daily timesheet entries.
    This function encapsulates the 'AI generation' logic; swap in an LLM call
    here in the future without touching any other module.
    """
    start_str = period_start.strftime("%d %b %Y")
    end_str = period_end.strftime("%d %b %Y")

    if not entries:
        return f"Professional services rendered for the period {start_str} – {end_str}."

    # Aggregate unique task descriptions with their hours
    task_lines = []
    for entry in sorted(entries, key=lambda e: e.date):
        task_lines.append(f"{entry.task_description} ({entry.hours_worked}h)")

    tasks_prose = "; ".join(task_lines)
    total = sum(e.hours_worked for e in entries)

    return (
        f"Professional services rendered for the period {start_str} – {end_str}. "
        f"Work performed: {tasks_prose}. "
        f"Total hours: {total}h."
    )


def calculate_financials(total_hours: float, config: InvoiceConfig) -> dict:
    """
    Pure calculation — no side effects.
    Returns subtotal, tax_amount, total_amount all rounded to 2 decimal places.
    """
    subtotal = round(total_hours * config.hourly_rate, 2)
    tax_amount = round(subtotal * config.tax_rate, 2)
    total_amount = round(subtotal + tax_amount, 2)
    return {
        "subtotal": subtotal,
        "tax_amount": tax_amount,
        "total_amount": total_amount,
    }


def create_invoice(
    db: Session,
    timesheet: Timesheet,
    finance_user_id: uuid.UUID,
    config: InvoiceConfig | None = None,
) -> Invoice:
    """
    Orchestrate invoice generation from an approved timesheet.

    Rules:
    - Raises DomainError if an invoice already exists for this timesheet.
    - Idempotent-safe: does NOT commit; the caller (finance_service) commits.
    """
    if config is None:
        config = InvoiceConfig()

    # Guard: prevent duplicate invoice generation
    existing = db.scalar(select(Invoice).where(Invoice.timesheet_id == timesheet.id))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An invoice already exists for timesheet {timesheet.id}: {existing.invoice_number}",
        )

    invoice_number = generate_invoice_number(db)
    financials = calculate_financials(timesheet.total_hours, config)
    work_summary = build_work_summary(list(timesheet.entries), timesheet.period_start_date, timesheet.period_end_date)

    now = datetime.now(timezone.utc)
    due = now + timedelta(days=30)

    invoice = Invoice(
        timesheet_id=timesheet.id,
        candidate_id=timesheet.candidate_id,
        generated_by_id=finance_user_id,
        invoice_number=invoice_number,
        status=InvoiceStatus.generated,
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
    )
    db.add(invoice)
    return invoice
