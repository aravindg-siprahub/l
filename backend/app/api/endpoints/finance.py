import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user
from app.core.db.models import User
from app.schemas.timesheet import TimesheetOut
from app.schemas.invoice import FinanceApprove, FinanceReject, InvoiceOut
from app.services import finance_service
from app.services.invoice_engine import InvoiceConfig

router = APIRouter()


@router.get("/pending", response_model=list[TimesheetOut])
def get_finance_pending(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Finance queue: all client_approved timesheets awaiting Finance review."""
    return finance_service.get_finance_pending_timesheets(db)


@router.post("/{timesheet_id}/approve", response_model=InvoiceOut, status_code=status.HTTP_201_CREATED)
def finance_approve(
    timesheet_id: uuid.UUID,
    payload: FinanceApprove,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Finance approves a timesheet.
    Locks the timesheet and triggers the Invoice Engine to generate an invoice.
    Returns the generated invoice.
    """
    config = InvoiceConfig(
        hourly_rate=payload.hourly_rate,
        tax_rate=payload.tax_rate,
        payment_terms=payload.payment_terms,
        notes=payload.notes,
    )
    return finance_service.finance_approve_timesheet(db, timesheet_id, current_user.id, config)


@router.post("/{timesheet_id}/reject", response_model=TimesheetOut)
def finance_reject(
    timesheet_id: uuid.UUID,
    payload: FinanceReject,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Finance rejects a timesheet with a required reason. Returns the timesheet to the Candidate."""
    return finance_service.finance_reject_timesheet(db, timesheet_id, current_user.id, payload.reason)
