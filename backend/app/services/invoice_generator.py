"""
Invoice Generator — Reusable logic for generating sequential invoice IDs.
"""
import uuid
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.core.db.models import Invoice

def generate_invoice_number(db: Session) -> str:
    """
    Generate a sequential, unique invoice number in the format INV-YYYYXXXX.
    Must be executed inside an active transaction.
    """
    year = datetime.now(timezone.utc).year
    
    count: int = db.scalar(
        select(func.count(Invoice.id)).where(
            Invoice.invoice_number.like(f"INV-{year}%")
        )
    ) or 0
    sequence = str(count + 1).zfill(4)
    return f"INV-{year}{sequence}"

def build_work_summary(entries: list, period_start: datetime, period_end: datetime) -> str:
    """
    Synthesize a professional work summary from daily timesheet entries.
    """
    start_str = period_start.strftime("%d %b %Y")
    end_str = period_end.strftime("%d %b %Y")

    if not entries:
        return f"Professional services rendered for the period {start_str} – {end_str}."

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
