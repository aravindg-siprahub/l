"""
Invoice Workflow Service — Validates and enforces invoice state transitions.
"""

from fastapi import HTTPException, status
from app.core.db.models import InvoiceStatus, UserRole, User, InvoiceAuditAction
import logging

logger = logging.getLogger(__name__)

# Valid next states from a given state
VALID_TRANSITIONS = {
    InvoiceStatus.draft: {InvoiceStatus.ready},
    InvoiceStatus.ready: {InvoiceStatus.draft, InvoiceStatus.sent},
    InvoiceStatus.sent: {InvoiceStatus.payment_pending},
    InvoiceStatus.payment_pending: {InvoiceStatus.paid},
    InvoiceStatus.paid: set(),
}

def validate_transition(current_state: InvoiceStatus, next_state: InvoiceStatus, user: User):
    """
    Validates if a transition is allowed based on workflow logic and RBAC.
    """
    # 1. State validity
    allowed_states = VALID_TRANSITIONS.get(current_state, set())
    if next_state not in allowed_states:
        logger.warning(f"Invalid transition attempted: {current_state} -> {next_state} by {user.id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition from {current_state.value} to {next_state.value}."
        )

    # 2. RBAC rules
    if user.role != UserRole.finance_team:
        logger.warning(f"Unauthorized invoice transition by {user.id} (Role: {user.role})")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Finance Team can transition invoices."
        )

def get_audit_action_for_transition(next_state: InvoiceStatus) -> InvoiceAuditAction:
    mapping = {
        InvoiceStatus.draft: InvoiceAuditAction.updated,
        InvoiceStatus.ready: InvoiceAuditAction.status_changed,
        InvoiceStatus.sent: InvoiceAuditAction.sent,
        InvoiceStatus.payment_pending: InvoiceAuditAction.status_changed,
        InvoiceStatus.paid: InvoiceAuditAction.payment_received,
    }
    return mapping.get(next_state, InvoiceAuditAction.status_changed)
