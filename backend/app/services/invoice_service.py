"""Invoice CRUD query service — read-only queries for the invoice store."""
from __future__ import annotations

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db.models import Invoice


def get_all_invoices(db: Session) -> list[Invoice]:
    """Return all invoices ordered by most recently issued."""
    stmt = select(Invoice).order_by(Invoice.issued_at.desc())
    return list(db.scalars(stmt).all())


def get_invoice_by_id(db: Session, invoice_id: uuid.UUID) -> Invoice:
    """Return a single invoice by primary key."""
    invoice = db.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice {invoice_id} not found.",
        )
    return invoice


def get_invoice_by_timesheet(db: Session, timesheet_id: uuid.UUID) -> Invoice:
    """Return the invoice associated with a specific timesheet."""
    invoice = db.scalar(select(Invoice).where(Invoice.timesheet_id == timesheet_id))
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No invoice found for timesheet {timesheet_id}.",
        )
    return invoice


def transition_invoice(db: Session, invoice_id: uuid.UUID, target_status, user, comments: str | None = None) -> Invoice:
    """
    Transition an invoice to a new state with strict workflow validation,
    row-level locking, and immutable audit logging.
    """
    from app.services.invoice_workflow_service import validate_transition, get_audit_action_for_transition
    from app.core.db.models import InvoiceAuditLog
    from app.services import notification_service
    
    # 1. Lock the invoice
    stmt = select(Invoice).where(Invoice.id == invoice_id).with_for_update()
    invoice = db.scalars(stmt).first()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice {invoice_id} not found."
        )

    # 2. Validate Transition
    validate_transition(invoice.status, target_status, user)

    # 3. Update Status
    invoice.status = target_status

    # 4. Audit Log
    action = get_audit_action_for_transition(target_status)
    audit = InvoiceAuditLog(
        invoice_id=invoice.id,
        actor_id=user.id,
        action=action,
        actor_role=user.role,
        comments=comments
    )
    db.add(audit)

    db.commit()
    db.refresh(invoice)

    # 5. Notifications (Isolated from transaction)
    try:
        if target_status.value == "ready":
            client_email = invoice.snapshot_data.get("client_email", "client@example.com") if invoice.snapshot_data else "client@example.com"
            notification_service.notify_client_invoice_ready(invoice, client_email)
        elif target_status.value == "paid":
            finance_email = "finance@yourdomain.com"
            notification_service.notify_finance_payment_received(invoice, finance_email)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to send invoice notification: {e}")

    return invoice


def update_invoice_billing(db: Session, invoice_id: uuid.UUID, payload, user) -> Invoice:
    """
    Update billing configuration of a Draft or Ready invoice.
    Raises 400 if the invoice is in an immutable state (Sent, Paid, etc.).
    Records an Audit Log entry for the change.
    """
    from app.core.db.models import InvoiceStatus, InvoiceAuditLog, InvoiceAuditAction
    import json

    stmt = select(Invoice).where(Invoice.id == invoice_id).with_for_update()
    invoice = db.scalars(stmt).first()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice {invoice_id} not found."
        )
        
    if invoice.status not in [InvoiceStatus.draft, InvoiceStatus.ready]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot edit invoice billing details when status is {invoice.status.value}. Only draft and ready invoices can be edited."
        )

    # Capture old values
    old_snapshot = dict(invoice.snapshot_data or {})
    old_payment_terms = invoice.payment_terms
    old_notes = invoice.notes

    # Update snapshot
    new_snapshot = dict(old_snapshot)
    new_snapshot["client_name"] = payload.client_name
    new_snapshot["billing_contact"] = payload.billing_contact
    new_snapshot["billing_address"] = payload.billing_address
    new_snapshot["billing_email"] = payload.billing_email

    # Apply updates
    invoice.snapshot_data = new_snapshot
    invoice.payment_terms = payload.payment_terms
    invoice.notes = payload.notes

    # Create detailed audit comment
    changes = []
    if old_snapshot.get("client_name") != payload.client_name: changes.append("Client Name")
    if old_snapshot.get("billing_contact") != payload.billing_contact: changes.append("Billing Contact")
    if old_snapshot.get("billing_address") != payload.billing_address: changes.append("Billing Address")
    if old_snapshot.get("billing_email") != payload.billing_email: changes.append("Billing Email")
    if old_payment_terms != payload.payment_terms: changes.append("Payment Terms")
    if old_notes != payload.notes: changes.append("Notes")

    change_desc = f"Updated billing details: {', '.join(changes)}" if changes else "Saved billing details with no changes"

    audit = InvoiceAuditLog(
        invoice_id=invoice.id,
        actor_id=user.id,
        action=InvoiceAuditAction.updated,
        actor_role=user.role,
        comments=change_desc
    )
    db.add(audit)

    db.commit()
    db.refresh(invoice)

    return invoice
