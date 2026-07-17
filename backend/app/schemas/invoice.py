from pydantic import BaseModel, ConfigDict, Field
from datetime import date, datetime
from uuid import UUID

from app.core.db.models import InvoiceStatus


class InvoiceConfig(BaseModel):
    """Finance team configures these values when approving a timesheet."""
    hourly_rate: float = Field(default=150.0, gt=0, description="Hourly billing rate in USD")
    tax_rate: float = Field(default=0.0, ge=0, le=1, description="Tax rate as a decimal (e.g. 0.18 for 18%)")
    payment_terms: str = Field(default="Net 30", max_length=100)
    notes: str | None = None


class FinanceApprove(InvoiceConfig):
    """Payload for Finance team approving a timesheet. Extends InvoiceConfig."""
    pass


class FinanceReject(BaseModel):
    """Payload for Finance team rejecting a timesheet."""
    reason: str = Field(..., min_length=1, description="Required rejection reason returned to the candidate")


class InvoiceListItem(BaseModel):
    """Lightweight schema for invoice list views."""
    id: UUID
    invoice_number: str
    status: InvoiceStatus
    candidate_id: UUID
    period_start_date: date
    period_end_date: date
    total_hours: float
    hourly_rate: float
    total_amount: float
    issued_at: datetime
    due_date: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InvoiceOut(BaseModel):
    """Full invoice schema for rendering the invoice template."""
    id: UUID
    invoice_number: str
    status: InvoiceStatus
    timesheet_id: UUID
    candidate_id: UUID
    generated_by_id: UUID

    period_start_date: date
    period_end_date: date
    total_hours: float
    hourly_rate: float
    subtotal: float
    tax_rate: float
    tax_amount: float
    total_amount: float

    work_summary: str
    payment_terms: str
    notes: str | None

    issued_at: datetime
    due_date: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
