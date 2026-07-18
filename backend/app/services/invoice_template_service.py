"""
Invoice Template Service — Prepares data for rendering templates.
"""
from app.core.db.models import Invoice

def build_invoice_context(invoice: Invoice) -> dict:
    """
    Hydrates data for a specific invoice for use in HTML or PDF templates.
    Uses snapshot data for historical accuracy.
    """
    snapshot = invoice.snapshot_data or {}
    
    return {
        "invoice_number": invoice.invoice_number,
        "issued_at": invoice.issued_at.strftime("%B %d, %Y"),
        "due_date": invoice.due_date.strftime("%B %d, %Y"),
        "client_name": snapshot.get("client_name", "Unknown Client"),
        "billing_contact": snapshot.get("billing_contact"),
        "billing_address": snapshot.get("billing_address"),
        "billing_email": snapshot.get("billing_email"),
        "work_summary": invoice.work_summary,
        "subtotal": invoice.subtotal,
        "tax_amount": invoice.tax_amount,
        "total_amount": invoice.total_amount,
        "currency": invoice.currency,
        "notes": invoice.notes,
        "payment_terms": invoice.payment_terms
    }
