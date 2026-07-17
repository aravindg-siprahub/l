from fastapi import APIRouter
from app.api.dependencies.auth import require_role
from app.core.security.roles import Role

router = APIRouter()

# Accounts Team Routes
@router.post("/billing/validate", dependencies=[require_role([Role.ACCOUNTS_TEAM])])
async def validate_billing():
    return {"message": "Billing validated"}

@router.put("/{id}", dependencies=[require_role([Role.ACCOUNTS_TEAM])])
async def edit_invoice(id: str):
    return {"message": f"Invoice {id} edited"}

@router.post("/{id}/approve", dependencies=[require_role([Role.ACCOUNTS_TEAM])])
async def approve_invoice(id: str):
    return {"message": f"Invoice {id} approved"}

@router.post("/{id}/send", dependencies=[require_role([Role.ACCOUNTS_TEAM])])
async def send_invoice(id: str):
    return {"message": f"Invoice {id} sent"}

# Shared / Client Routes
@router.get("", dependencies=[require_role([Role.ACCOUNTS_TEAM, Role.CLIENT])])
async def get_invoices():
    return {"message": "Viewing invoices"}

@router.get("/notifications", dependencies=[require_role([Role.CLIENT])])
async def get_notifications():
    return {"message": "Viewing client notifications"}
