import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user
from app.core.db.models import User
from app.schemas.invoice import InvoiceOut, InvoiceListItem, InvoiceTransitionRequest, InvoiceUpdate
from app.services import invoice_service

router = APIRouter()

@router.post("/{invoice_id}/transition", response_model=InvoiceOut)
def transition_invoice_state(
    invoice_id: uuid.UUID,
    payload: InvoiceTransitionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Transition an invoice to a new state and log the action."""
    return invoice_service.transition_invoice(
        db, 
        invoice_id, 
        payload.target_status, 
        current_user, 
        payload.comments
    )


@router.get("/", response_model=list[InvoiceListItem])
def list_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all generated invoices, newest first."""
    return invoice_service.get_all_invoices(db)


@router.get("/{invoice_id}", response_model=InvoiceOut)
def get_invoice(
    invoice_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve full details for a specific invoice."""
    return invoice_service.get_invoice_by_id(db, invoice_id)


@router.put("/{invoice_id}", response_model=InvoiceOut)
def update_invoice(
    invoice_id: uuid.UUID,
    payload: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update billing details for a Draft or Ready invoice."""
    return invoice_service.update_invoice_billing(db, invoice_id, payload, current_user)
