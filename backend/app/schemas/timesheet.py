from pydantic import BaseModel, ConfigDict, Field
from datetime import date, datetime
from uuid import UUID

from app.core.db.models import TimesheetStatus


class TimesheetEntryBase(BaseModel):
    date: date
    hours_worked: float = Field(..., ge=0, le=24, description="Hours worked on this date")
    task_description: str = Field(..., min_length=1, max_length=500)


class TimesheetEntryCreate(TimesheetEntryBase):
    """Schema for creating/updating a line item within a timesheet."""
    pass


class TimesheetEntryOut(TimesheetEntryBase):
    id: UUID
    timesheet_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TimesheetBase(BaseModel):
    period_start_date: date
    period_end_date: date
    notes: str | None = None


class TimesheetCreate(TimesheetBase):
    """Schema for a Candidate creating a new timesheet (with optional initial entries)."""
    entries: list[TimesheetEntryCreate] = []


class TimesheetUpdate(TimesheetBase):
    """Schema for updating a timesheet (replaces existing entries)."""
    entries: list[TimesheetEntryCreate] = []


class TimesheetClientApprove(BaseModel):
    """Payload for client manager approving a timesheet."""
    comments: str | None = None


class TimesheetClientReject(BaseModel):
    """Payload for client manager rejecting a timesheet."""
    reason: str = Field(..., min_length=1)


class TimesheetOut(TimesheetBase):
    id: UUID
    candidate_id: UUID
    status: TimesheetStatus
    total_hours: float
    rejection_reason: str | None
    submitted_at: datetime | None
    reviewed_by_id: UUID | None
    reviewed_at: datetime | None
    approval_comments: str | None
    created_at: datetime
    updated_at: datetime
    entries: list[TimesheetEntryOut] = []

    model_config = ConfigDict(from_attributes=True)
