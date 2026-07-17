import logging
from typing import Dict, Any
from fastapi import APIRouter

from app.infrastructure.diagnostics import DiagnosticsManager

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/status", response_model=Dict[str, Any])
async def get_foundation_status():
    """
    Returns a comprehensive validation report of all foundation subsystems.
    """
    return await DiagnosticsManager.get_system_status()
