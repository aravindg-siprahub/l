import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user
from app.core.db.models import User
from app.schemas.invoice import InvoiceOut, InvoiceListItem
from app.services import invoice_service

router = APIRouter()


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
    """Return the full invoice detail for rendering the invoice template."""
    return invoice_service.get_invoice_by_id(db, invoice_id)
