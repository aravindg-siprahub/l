from typing import Any, Dict, Optional

class BaseAppException(Exception):
    """Base exception for all application errors."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}

class DomainError(BaseAppException):
    """Raised when a business rule or invariant is violated."""
    pass

class ApplicationError(BaseAppException):
    """Raised when an application-specific error occurs (e.g., resource not found)."""
    pass

class InfrastructureError(BaseAppException):
    """Raised when an external system (DB, Cache, 3rd party API) fails."""
    pass
