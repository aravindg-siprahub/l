"""
Notification Service
====================
Orchestrates delivery of all timesheet-related notifications.

Responsibility boundary:
  - Builds period labels, action tokens, and deep-link URLs.
  - Passes plain strings to EmailService (no HTML here).
  - Does NOT contain business logic (no status checks, no DB writes).

Provider notes:
  - All links use settings.FRONTEND_URL — no hardcoded domains.
  - Action tokens are signed JWTs (7-day TTL). The timesheet ID in the URL
    is not a secret; backend access is enforced by get_current_user on each
    API endpoint, not by URL obscurity.
  - FINANCE_EMAIL is read from settings. If unconfigured, the notification
    is skipped with a warning — the approval action still succeeds (the caller
    in timesheet_service.py wraps notifications in try/except).
"""

from __future__ import annotations

import logging
from datetime import timedelta
import uuid

from app.core.config import settings
from app.core.security import create_access_token
from app.core.db.models import Timesheet, User
from app.services import email_service
from app.services.timesheet_pdf import generate_timesheet_pdf, build_pdf_filename, derive_timesheet_type

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────────────────────────────────────

def _generate_action_token(timesheet_id: uuid.UUID, action: str) -> str:
    """
    Generate a signed JWT token valid for 7 days.

    Payload: {"sub": "<timesheet_uuid>", "action": "<action>", "exp": ...}
    The token is passed as a query parameter in email deep-links.
    Authorization is enforced by the backend endpoint (get_current_user),
    not by knowledge of the token or the resource ID.
    """
    return create_access_token(
        data={"sub": str(timesheet_id), "action": action},
        expires_delta=timedelta(days=7)
    )


def _format_period(timesheet: Timesheet) -> str:
    """Return a human-readable period label, e.g. '01 Jul 2025 – 07 Jul 2025'."""
    return (
        f"{timesheet.period_start_date.strftime('%d %b %Y')} – "
        f"{timesheet.period_end_date.strftime('%d %b %Y')}"
    )


# ─────────────────────────────────────────────────────────────────────────────
# Public notification functions
# ─────────────────────────────────────────────────────────────────────────────

def notify_manager_timesheet_shared(
    timesheet: Timesheet,
    candidate_name: str,
    manager_email: str,
    manager_name: str,
) -> None:
    """
    Send an email to the Client Manager to review a submitted timesheet.
    Generates a PDF attachment and a signed deep-link directly to the timesheet.
    """
    logger.info(
        "Sending manager review notification: timesheet=%s → manager=%s",
        timesheet.id, manager_email,
    )

    logger.info("STAGE 4: PDF generation started for timesheet_id=%s", timesheet.id)
    try:
        pdf_bytes = generate_timesheet_pdf(timesheet, candidate_name)
    except Exception as exc:
        import traceback
        import sys
        exc_type, exc_value, exc_traceback = sys.exc_info()
        tb = traceback.extract_tb(exc_traceback)
        filename = tb[-1].filename if tb else "Unknown"
        lineno = tb[-1].lineno if tb else 0
        logger.exception(
            "STAGE 4 EXCEPTION: PDF generation failed for timesheet_id=%s | "
            "type=%s | message=%s | file=%s | line=%s", 
            timesheet.id, type(exc).__name__, str(exc), filename, lineno
        )
        raise

    logger.info("STAGE 5: PDF generation completed for timesheet_id=%s", timesheet.id)

    period_label = _format_period(timesheet)

    # Dynamic submitted date — never hardcoded "Just now"
    submitted_date = (
        timesheet.submitted_at.strftime("%d %b %Y at %H:%M UTC")
        if timesheet.submitted_at
        else "—"
    )

    pdf_filename = build_pdf_filename(
        candidate_name, timesheet.period_start_date, timesheet.period_end_date
    )

    # Signed action token for deep-link; ID in path is not a secret —
    # backend enforces get_current_user on the review endpoint.
    token = _generate_action_token(timesheet.id, "review_timesheet")
    review_link = (
        f"{settings.FRONTEND_URL}/dashboard/client-manager/timesheets"
        f"/{timesheet.id}?token={token}"
    )

    email_service.send_manager_review_email(
        to_email=manager_email,
        manager_name=manager_name,
        candidate_name=candidate_name,
        period_label=period_label,
        total_hours=timesheet.total_hours,
        submitted_date=submitted_date,
        review_link=review_link,
        pdf_bytes=pdf_bytes,
        pdf_filename=pdf_filename,
    )


def notify_candidate_timesheet_approved(
    timesheet: Timesheet,
    candidate_name: str,
    candidate_email: str,
    manager_name: str,
) -> None:
    """Notify candidate that the client manager approved their timesheet."""
    logger.info(
        "Sending candidate approval notification: timesheet=%s → candidate=%s",
        timesheet.id, candidate_email,
    )

    period_label = _format_period(timesheet)
    date_approved = (
        timesheet.reviewed_at.strftime("%d %b %Y")
        if timesheet.reviewed_at
        else "today"
    )

    # Build URL here so EmailService receives a plain string only (no settings access in email layer)
    dashboard_link = f"{settings.FRONTEND_URL}/dashboard/candidate"

    email_service.send_candidate_approval_email(
        to_email=candidate_email,
        candidate_name=candidate_name,
        manager_name=manager_name,
        period_label=period_label,
        date_approved=date_approved,
        dashboard_link=dashboard_link,
    )


def notify_candidate_timesheet_rejected(
    timesheet: Timesheet,
    candidate_name: str,
    candidate_email: str,
    manager_name: str,
) -> None:
    """Notify candidate that the client manager rejected their timesheet."""
    logger.info(
        "Sending candidate rejection notification: timesheet=%s → candidate=%s",
        timesheet.id, candidate_email,
    )

    period_label = _format_period(timesheet)

    # Both Edit and Resubmit point to the same form page — the form already
    # supports save-draft and submit-for-approval, no separate endpoint needed.
    edit_link = (
        f"{settings.FRONTEND_URL}/dashboard/candidate/timesheets/{timesheet.id}"
    )
    resubmit_link = edit_link

    email_service.send_candidate_rejection_email(
        to_email=candidate_email,
        candidate_name=candidate_name,
        manager_name=manager_name,
        period_label=period_label,
        rejection_reason=timesheet.rejection_reason or "No reason provided.",
        edit_link=edit_link,
        resubmit_link=resubmit_link,
    )


def notify_finance_timesheet_approved(
    timesheet: Timesheet,
    candidate_name: str,
    manager_name: str,
) -> None:
    """
    Notify the Finance team that a timesheet was client-approved and is
    ready for final processing.

    Skipped (with a warning) if FINANCE_EMAIL is not configured — the caller
    wraps this in try/except so the approval action still succeeds.
    """
    finance_email = settings.FINANCE_EMAIL
    if not finance_email:
        logger.warning(
            "FINANCE_EMAIL is not configured — finance notification skipped "
            "(timesheet=%s). Set FINANCE_EMAIL in .env to enable.",
            timesheet.id,
        )
        return

    logger.info(
        "Sending finance notification: timesheet=%s → finance=%s",
        timesheet.id, finance_email,
    )

    period_label = _format_period(timesheet)

    # Generate PDF
    pdf_bytes = generate_timesheet_pdf(timesheet, candidate_name)
    pdf_filename = build_pdf_filename(
        candidate_name, timesheet.period_start_date, timesheet.period_end_date
    )

    # Deep-link directly to the specific timesheet in the finance queue
    view_link = f"{settings.FRONTEND_URL}/dashboard/finance/timesheets/{timesheet.id}"

    email_service.send_finance_notification_email(
        to_email=finance_email,
        candidate_name=candidate_name,
        manager_name=manager_name,
        period_label=period_label,
        total_hours=timesheet.total_hours,
        view_link=view_link,
        pdf_bytes=pdf_bytes,
        pdf_filename=pdf_filename,
    )

def notify_client_invoice_ready(invoice, client_email: str) -> None:
    """
    Notify the client that an invoice is ready for payment.
    """
    logger.info(
        "Sending client invoice notification: invoice=%s → client=%s",
        invoice.id, client_email,
    )
    # Generate Invoice PDF
    from app.services.invoice_template_service import build_invoice_context
    from app.services.invoice_pdf_service import generate_invoice_pdf
    
    context = build_invoice_context(invoice)
    pdf_bytes = generate_invoice_pdf(context)
    pdf_filename = f"Invoice_{invoice.invoice_number}.pdf"
    
    # Normally we would call a specific send_client_invoice_email in email_service.
    # For now, we simulate this logic as requested by architecture (email sent successfully).
    logger.info(f"Simulating email sent to {client_email} with invoice {invoice.invoice_number}")

def notify_finance_payment_received(invoice, finance_email: str) -> None:
    """
    Notify the finance team that a payment has been received.
    """
    logger.info(
        "Sending finance payment received notification: invoice=%s → finance=%s",
        invoice.id, finance_email,
    )
    logger.info(f"Simulating email sent to {finance_email} for payment received on {invoice.invoice_number}")

