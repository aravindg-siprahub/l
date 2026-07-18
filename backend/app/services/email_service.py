"""
Email Service
=============
Renders HTML email templates and delivers them via the Brevo transactional API.

Responsibility boundary:
  - Accepts plain strings only — no business logic, no settings access,
    no URL construction.
  - _send_email() is the single delivery boundary (Brevo API via httpx).
    To swap providers in the future, only this function needs to change.
  - Template functions are thin wrappers: build HTML → call _send_email().

Brevo API docs: https://developers.brevo.com/reference/sendtransacemail
"""

from __future__ import annotations

import base64
import logging

import httpx

from app.core.config import settings
from app.core.exceptions import InfrastructureError

logger = logging.getLogger(__name__)

_BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email"


# ─────────────────────────────────────────────────────────────────────────────
# Delivery boundary — replace only this function to swap providers
# ─────────────────────────────────────────────────────────────────────────────

def _send_email(
    to_email: str,
    subject: str,
    html_body: str,
    pdf_bytes: bytes | None = None,
    pdf_filename: str | None = None,
) -> None:
    """
    Deliver a single HTML email via the Brevo transactional API.
    Attaches a PDF if provided (base64-encoded per Brevo spec).
    Logs success and failure. Raises InfrastructureError on delivery failure.
    """
    if not settings.BREVO_API_KEY or not settings.BREVO_SENDER_EMAIL:
        logger.warning(
            "Email skipped — Brevo not configured "
            "(BREVO_API_KEY / BREVO_SENDER_EMAIL missing): subject=%r to=%s",
            subject, to_email,
        )
        return

    payload: dict = {
        "sender": {
            "name": settings.BREVO_SENDER_NAME,
            "email": settings.BREVO_SENDER_EMAIL,
        },
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": html_body,
    }

    # PDF attachment — Brevo expects base64-encoded content
    if pdf_bytes and pdf_filename:
        logger.info("STAGE 6: Attachment created (encoding PDF) | PDF byte length=%s", len(pdf_bytes))
        b64_content = base64.b64encode(pdf_bytes).decode("ascii")
        logger.info("STAGE 7: Base64 attachment length=%s", len(b64_content))
        payload["attachment"] = [
            {
                "name": pdf_filename,
                "content": b64_content,
            }
        ]
    else:
        logger.info("STAGE 6: No attachment provided")

    logger.info("STAGE 8: Brevo request payload created")

    headers = {
        "api-key": settings.BREVO_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    try:
        logger.info("STAGE 9: Brevo HTTP request started")
        response = httpx.post(
            _BREVO_SEND_URL,
            json=payload,
            headers=headers,
            timeout=20.0,
        )
        logger.info("STAGE 10: Brevo HTTP response status=%s", response.status_code)
        logger.info("STAGE 11: Brevo response body=%s", response.text)
        
        # If Brevo returns an HTTP error, log it
        if response.status_code >= 400:
            logger.error(
                "Brevo HTTP Error | status code: %s | response body: %s | response headers: %s",
                response.status_code, response.text, response.headers
            )
            
        response.raise_for_status()
        logger.info(
            "Email delivered via Brevo: subject=%r to=%s messageId=%s",
            subject, to_email,
            response.json().get("messageId", "—"),
        )

    except httpx.HTTPStatusError as exc:
        error_body = exc.response.text
        logger.exception("Brevo API error: status=%s body=%s subject=%r to=%s", exc.response.status_code, error_body, subject, to_email)
        raise InfrastructureError(
            f"Email delivery failed (Brevo {exc.response.status_code}): {error_body}"
        ) from exc

    except httpx.RequestError as exc:
        logger.exception("Brevo request error: %s subject=%r to=%s", exc, subject, to_email)
        raise InfrastructureError(
            f"Email delivery failed (network error): {exc}"
        ) from exc
    except Exception as exc:
        import traceback
        import sys
        exc_type, exc_value, exc_traceback = sys.exc_info()
        tb = traceback.extract_tb(exc_traceback)
        filename = tb[-1].filename if tb else "Unknown"
        lineno = tb[-1].lineno if tb else 0
        logger.exception(
            "Unhandled exception during Brevo request | type=%s | message=%s | filename=%s | line=%s",
            type(exc).__name__, str(exc), filename, lineno
        )
        raise


# ─────────────────────────────────────────────────────────────────────────────
# Shared template helpers
# ─────────────────────────────────────────────────────────────────────────────

_BASE_STYLES = """
  body {
    margin: 0; padding: 0;
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
    background: #f4f4f5; color: #18181b; line-height: 1.6;
  }
  .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff;
    border-radius: 12px; overflow: hidden;
    box-shadow: 0 1px 4px rgba(0,0,0,.08); }
  .header { padding: 32px 40px 24px; border-bottom: 1px solid #e4e4e7; }
  .header h1 { margin: 0; font-size: 20px; font-weight: 700; color: #18181b; }
  .body { padding: 32px 40px; }
  .footer { padding: 20px 40px; border-top: 1px solid #e4e4e7;
    font-size: 12px; color: #a1a1aa; text-align: center; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 99px;
    font-size: 13px; font-weight: 600; margin-bottom: 16px; }
  .badge-green  { background: #dcfce7; color: #15803d; }
  .badge-red    { background: #fee2e2; color: #b91c1c; }
  .badge-indigo { background: #e0e7ff; color: #4338ca; }
  .meta { background: #f9f9fb; border-radius: 8px; padding: 16px 20px;
    margin: 20px 0; border: 1px solid #e4e4e7; }
  .meta dt { font-size: 11px; font-weight: 600; text-transform: uppercase;
    letter-spacing: .05em; color: #71717a; margin-bottom: 2px; }
  .meta dd { margin: 0 0 12px; font-size: 15px; font-weight: 600; color: #18181b; }
  .meta dd:last-child { margin-bottom: 0; }
  .reason-box { background: #fef2f2; border-left: 4px solid #ef4444;
    border-radius: 4px; padding: 14px 16px; margin: 20px 0;
    font-size: 14px; color: #7f1d1d; }
  .reason-box strong { display: block; margin-bottom: 6px; color: #b91c1c; }
  .btn { display: inline-block; padding: 12px 24px; border-radius: 8px;
    font-size: 14px; font-weight: 600; text-decoration: none; cursor: pointer; }
  .btn-primary   { background: #4f46e5; color: #ffffff; }
  .btn-secondary { background: #ffffff; color: #4f46e5;
    border: 1px solid #c7d2fe; }
  .btn-success   { background: #10b981; color: #ffffff; }
  .cta-row { margin-top: 24px; }
  .cta-row a { margin-right: 12px; margin-bottom: 8px; }
"""


def _html(header_color: str, icon: str, title: str, body_html: str) -> str:
    """Wrap body content in the shared email chrome."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
  <style>{_BASE_STYLES}</style>
</head>
<body>
  <div class="wrapper">
    <div class="header" style="border-top: 4px solid {header_color};">
      <h1>{icon}&nbsp; {title}</h1>
    </div>
    <div class="body">
      {body_html}
    </div>
    <div class="footer">
      Lorvish Platform &bull; This is an automated notification.
    </div>
  </div>
</body>
</html>"""


# ─────────────────────────────────────────────────────────────────────────────
# Template functions
# ─────────────────────────────────────────────────────────────────────────────

def send_manager_review_email(
    to_email: str,
    manager_name: str | None,
    candidate_name: str,
    period_label: str,
    total_hours: float,
    submitted_date: str,
    review_link: str,
    pdf_bytes: bytes,
    pdf_filename: str,
) -> None:
    """
    Email to Client Manager: action required — timesheet awaiting review.

    Fields: Candidate · Period · Total Hours · Submitted Date · Review button · PDF attachment
    """
    greeting = f"Hello {manager_name}," if manager_name else "Hello,"

    body = f"""
      <p style="margin:0 0 20px;">{greeting}</p>
      <span class="badge badge-indigo">&#x23F3; Action Required</span>
      <p style="margin:0 0 8px;">
        <strong>{candidate_name}</strong> has submitted a timesheet for your review
        and approval.
      </p>

      <dl class="meta">
        <dt>Candidate</dt><dd>{candidate_name}</dd>
        <dt>Period</dt><dd>{period_label}</dd>
        <dt>Total Hours</dt><dd>{total_hours:g}h</dd>
        <dt>Submitted</dt><dd>{submitted_date}</dd>
      </dl>

      <div class="cta-row">
        <a href="{review_link}" class="btn btn-primary">Review &amp; Approve Timesheet &#x2192;</a>
      </div>

      <p style="margin-top:24px; font-size:13px; color:#71717a;">
        A PDF copy of the timesheet is attached for your records.
      </p>
    """

    _send_email(
        to_email=to_email,
        subject=f"Action Required: Timesheet Review \u2014 {candidate_name}",
        html_body=_html("#4f46e5", "&#x1F4CB;", "Timesheet Awaiting Your Review", body),
        pdf_bytes=pdf_bytes,
        pdf_filename=pdf_filename,
    )


def send_candidate_approval_email(
    to_email: str,
    candidate_name: str,
    manager_name: str,
    period_label: str,
    date_approved: str,
    dashboard_link: str,
) -> None:
    """
    Email to Candidate: timesheet approved.

    Fields: Status badge · Manager · Period · Approval Date · Dashboard CTA
    """
    body = f"""
      <p style="margin:0 0 20px;">Hello {candidate_name},</p>
      <span class="badge badge-green">&#x2713; Timesheet Approved</span>
      <p style="margin:0 0 8px;">
        Great news! Your timesheet has been <strong>approved</strong> and forwarded
        to the Finance team for processing.
      </p>

      <dl class="meta">
        <dt>Status</dt><dd>Approved &#x2713;</dd>
        <dt>Period</dt><dd>{period_label}</dd>
        <dt>Approved By</dt><dd>{manager_name}</dd>
        <dt>Approval Date</dt><dd>{date_approved}</dd>
      </dl>

      <p style="margin:0 0 24px; font-size:14px; color:#52525b;">
        Your timesheet has been forwarded to the Finance team. You can track its
        status from your dashboard.
      </p>

      <div class="cta-row">
        <a href="{dashboard_link}" class="btn btn-success">View My Dashboard &#x2192;</a>
      </div>
    """

    _send_email(
        to_email=to_email,
        subject=f"Timesheet Approved \u2014 {period_label}",
        html_body=_html("#10b981", "&#x2705;", "Your Timesheet Has Been Approved", body),
    )


def send_candidate_rejection_email(
    to_email: str,
    candidate_name: str,
    manager_name: str,
    period_label: str,
    rejection_reason: str,
    edit_link: str,
    resubmit_link: str,
) -> None:
    """
    Email to Candidate: timesheet rejected.

    Fields: Status badge · Manager · Period · Rejection Reason · Edit CTA · Resubmit CTA
    Note: edit_link and resubmit_link point to the same form page (which supports
    both save-draft and submit-for-approval actions).
    """
    body = f"""
      <p style="margin:0 0 20px;">Hello {candidate_name},</p>
      <span class="badge badge-red">&#x2717; Timesheet Rejected</span>
      <p style="margin:0 0 8px;">
        Your timesheet for <strong>{period_label}</strong> was
        <strong>rejected</strong> by {manager_name}.
      </p>

      <div class="reason-box">
        <strong>Reason for Rejection:</strong>
        {rejection_reason}
      </div>

      <p style="margin:0 0 24px; font-size:14px; color:#52525b;">
        Please review the feedback above, update your timesheet, and resubmit
        it for approval.
      </p>

      <div class="cta-row">
        <a href="{edit_link}" class="btn btn-primary">Edit Timesheet &#x2192;</a>
        <a href="{resubmit_link}" class="btn btn-secondary">Resubmit &#x2192;</a>
      </div>
    """

    _send_email(
        to_email=to_email,
        subject=f"Action Required: Timesheet Rejected \u2014 {period_label}",
        html_body=_html("#ef4444", "&#x1F6AB;", "Your Timesheet Has Been Rejected", body),
    )


def send_finance_notification_email(
    to_email: str,
    candidate_name: str,
    manager_name: str,
    period_label: str,
    total_hours: float,
    view_link: str,
    pdf_bytes: bytes,
    pdf_filename: str,
) -> None:
    """
    Email to Finance team: approved timesheet ready for processing.

    Fields: Candidate · Manager · Period · Total Hours · View Timesheet CTA · PDF attachment
    """
    body = f"""
      <p style="margin:0 0 20px;">Finance Team,</p>
      <span class="badge badge-green">&#x2713; Ready for Processing</span>
      <p style="margin:0 0 8px;">
        The following timesheet has been <strong>client-approved</strong> and is
        ready for your final review and processing.
      </p>

      <dl class="meta">
        <dt>Candidate</dt><dd>{candidate_name}</dd>
        <dt>Approved By</dt><dd>{manager_name}</dd>
        <dt>Period</dt><dd>{period_label}</dd>
        <dt>Total Hours</dt><dd>{total_hours:g}h</dd>
      </dl>

      <div class="cta-row">
        <a href="{view_link}" class="btn btn-success">View Timesheet &#x2192;</a>
      </div>

      <p style="margin-top:24px; font-size:13px; color:#71717a;">
        A PDF copy of the timesheet is attached for your records.
      </p>
    """

    _send_email(
        to_email=to_email,
        subject=f"Finance Queue: Timesheet Approved \u2014 {candidate_name}",
        html_body=_html("#10b981", "&#x1F4BC;", "Timesheet Ready for Processing", body),
        pdf_bytes=pdf_bytes,
        pdf_filename=pdf_filename,
    )
