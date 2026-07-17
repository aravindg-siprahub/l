import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, Boolean, Enum, DateTime, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.core.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class DummyModel(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Minimal model required for Alembic migration testing."""
    name = Column(String, index=True)


class ContactMessage(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Stores contact inquiries from the public landing page."""
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    subject: Mapped[str | None] = mapped_column(String(255), nullable=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class UserRole(str, enum.Enum):
    """Role of a user in the Lorvish platform."""
    admin = "admin"
    recruiter = "recruiter"
    client_manager = "client_manager"
    finance_team = "finance_team"
    candidate = "candidate"


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Platform user — covers all roles."""
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="userrole"), nullable=False, default=UserRole.candidate
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )


class RefreshToken(Base, UUIDPrimaryKeyMixin):
    """Persisted refresh tokens for secure session management."""
    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True
    )
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user: Mapped["User"] = relationship("User", back_populates="refresh_tokens")


class TimesheetStatus(str, enum.Enum):
    """Lifecycle status of a timesheet."""
    draft = "draft"
    submitted = "submitted"
    client_approved = "client_approved"
    client_rejected = "client_rejected"
    finance_approved = "finance_approved"
    finance_rejected = "finance_rejected"


class Timesheet(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Header record for a candidate's timesheet submission."""
    candidate_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True
    )
    period_start_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    period_end_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[TimesheetStatus] = mapped_column(
        Enum(TimesheetStatus, name="timesheetstatus"), nullable=False, default=TimesheetStatus.draft
    )
    total_hours: Mapped[float] = mapped_column(default=0.0, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Client Manager / Finance Review fields
    reviewed_by_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("user.id", ondelete="SET NULL"), nullable=True, index=True
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    approval_comments: Mapped[str | None] = mapped_column(Text, nullable=True)

    candidate: Mapped["User"] = relationship("User", foreign_keys=[candidate_id])
    reviewed_by: Mapped["User"] = relationship("User", foreign_keys=[reviewed_by_id])
    invoice: Mapped["Invoice | None"] = relationship("Invoice", back_populates="timesheet", uselist=False)
    entries: Mapped[list["TimesheetEntry"]] = relationship(
        "TimesheetEntry", back_populates="timesheet", cascade="all, delete-orphan"
    )


class TimesheetEntry(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Daily line item for a timesheet."""
    timesheet_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("timesheet.id", ondelete="CASCADE"), nullable=False, index=True
    )
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    hours_worked: Mapped[float] = mapped_column(nullable=False)
    task_description: Mapped[str] = mapped_column(String(500), nullable=False)

    timesheet: Mapped["Timesheet"] = relationship("Timesheet", back_populates="entries")


class InvoiceStatus(str, enum.Enum):
    """Lifecycle status of a generated invoice."""
    generated = "generated"
    sent = "sent"
    paid = "paid"


class Invoice(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """A generated invoice derived from an approved timesheet."""
    timesheet_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("timesheet.id", ondelete="RESTRICT"), nullable=False, unique=True, index=True
    )
    candidate_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("user.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    generated_by_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("user.id", ondelete="RESTRICT"), nullable=False
    )

    invoice_number: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)
    status: Mapped[InvoiceStatus] = mapped_column(
        Enum(InvoiceStatus, name="invoicestatus"), nullable=False, default=InvoiceStatus.generated
    )

    # Period (denormalized from timesheet for fast display)
    period_start_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    period_end_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    # Financials (immutable after generation)
    total_hours: Mapped[float] = mapped_column(Float, nullable=False)
    hourly_rate: Mapped[float] = mapped_column(Float, nullable=False)
    subtotal: Mapped[float] = mapped_column(Float, nullable=False)
    tax_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    tax_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)

    # Content
    work_summary: Mapped[str] = mapped_column(Text, nullable=False)
    payment_terms: Mapped[str] = mapped_column(String(100), nullable=False, default="Net 30")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Dates
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Relationships
    timesheet: Mapped["Timesheet"] = relationship("Timesheet", back_populates="invoice")
    candidate: Mapped["User"] = relationship("User", foreign_keys=[candidate_id])
    generated_by: Mapped["User"] = relationship("User", foreign_keys=[generated_by_id])
