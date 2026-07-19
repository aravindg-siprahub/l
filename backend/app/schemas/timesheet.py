from pydantic import BaseModel, ConfigDict, EmailStr, Field
from datetime import date, datetime
from uuid import UUID
from typing import Optional

from app.core.db.models import TimesheetStatus, TimesheetAuditAction


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
    version: int = 1
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
    """Schema for updating a timesheet (replaces existing entries for drafts; preserves old for resubmissions)."""
    entries: list[TimesheetEntryCreate] = []


class TimesheetClientApprove(BaseModel):
    """Payload for client manager approving a timesheet."""
    comments: str | None = None


class TimesheetClientReject(BaseModel):
    """Payload for client manager rejecting a timesheet."""
    reason: str = Field(..., min_length=1, description="Required rejection reason shown to the candidate.")


class TimesheetSharePayload(BaseModel):
    """
    Payload for a candidate sharing a submitted timesheet with a manager via email.
    manager_email is required and validated by Pydantic (EmailStr).
    manager_name is optional — used to personalise the greeting in the email.
    """
    manager_email: EmailStr = Field(..., description="Manager's email address (required)")
    manager_name: str | None = Field(None, max_length=255, description="Manager's name (optional)")


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
    current_version: int = 1

    # Sharing fields — Phase 1 (shared_at IS NOT NULL means timesheet has been shared)
    manager_email: str | None = None
    manager_name: str | None = None
    shared_at: datetime | None = None

    created_at: datetime
    updated_at: datetime

    # Entries filtered to the current version only (set by the API layer when needed)
    entries: list[TimesheetEntryOut] = []

    # Candidate info — populated from the relationship when available (avoids N+1)
    candidate_name: str | None = None
    candidate_email: str | None = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_with_candidate(cls, timesheet: object) -> "TimesheetOut":
        """
        Build TimesheetOut with candidate info populated from the pre-loaded relationship.
        Call this instead of model_validate when the candidate relationship is loaded.
        """
        obj = cls.model_validate(timesheet)
        candidate = getattr(timesheet, "candidate", None)
        if candidate:
            obj.candidate_name = candidate.full_name
            obj.candidate_email = candidate.email
        return obj


class TimesheetAuditLogOut(BaseModel):
    """Output schema for a single audit log entry."""
    id: UUID
    timesheet_id: UUID
    actor_id: UUID | None
    action: TimesheetAuditAction
    actor_role: str
    actor_name: str | None = None  # populated from actor relationship when available
    comments: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_with_actor(cls, log: object) -> "TimesheetAuditLogOut":
        obj = cls.model_validate(log)
        actor = getattr(log, "actor", None)
        if actor:
            obj.actor_name = actor.full_name
        return obj


class PaginatedTimesheetResponse(BaseModel):
    """Paginated response envelope for timesheet list endpoints."""
    items: list[TimesheetOut]
    total: int
    page: int
    page_size: int
    total_pages: int

    @classmethod
    def from_paginated(cls, result: object) -> "PaginatedTimesheetResponse":
        import math
        items_with_candidate = [
            TimesheetOut.from_orm_with_candidate(ts) for ts in result.items
        ]
        total_pages = math.ceil(result.total / result.page_size) if result.page_size > 0 else 1
        return cls(
            items=items_with_candidate,
            total=result.total,
            page=result.page,
            page_size=result.page_size,
            total_pages=total_pages,
        )


class ClientManagerStatsOut(BaseModel):
    """Live dashboard stats for a client manager."""
    pending: int
    approved_this_month: int
    rejected_this_month: int
    avg_approval_time_hours: str
    total_timesheets: int

class TrendDataPoint(BaseModel):
    date: str
    approved: int
    shared: int
    rejected: int

class TrendDataOut(BaseModel):
    data: list[TrendDataPoint]
