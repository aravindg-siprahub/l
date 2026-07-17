# Suppress PendingDeprecationWarning from starlette's legacy multipart import.
# Must be first — fires before starlette.formparsers is loaded.
import warnings
warnings.filterwarnings(
    "ignore",
    message="Please use `import python_multipart` instead.",
    category=PendingDeprecationWarning,
)

from fastapi import FastAPI, APIRouter, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.exceptions import DomainError, ApplicationError, InfrastructureError

# Initialize structured logging
setup_logging()
logger = logging.getLogger(__name__)

def create_app() -> FastAPI:
    """Application factory for FastAPI."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
    )

    # Configure CORS for Next.js frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Exception Handlers
    @app.exception_handler(DomainError)
    async def domain_error_handler(request: Request, exc: DomainError):
        logger.warning(f"Domain Error: {exc.message}")
        return JSONResponse(
            status_code=400,
            content={"error": "DomainError", "message": exc.message, "details": exc.details},
        )

    @app.exception_handler(ApplicationError)
    async def application_error_handler(request: Request, exc: ApplicationError):
        logger.warning(f"Application Error: {exc.message}")
        return JSONResponse(
            status_code=400,
            content={"error": "ApplicationError", "message": exc.message, "details": exc.details},
        )

    @app.exception_handler(InfrastructureError)
    async def infrastructure_error_handler(request: Request, exc: InfrastructureError):
        logger.error(f"Infrastructure Error: {exc.message}")
        return JSONResponse(
            status_code=503,
            content={"error": "InfrastructureError", "message": "Service unavailable", "details": exc.details},
        )

    # Global Health Check
    @app.get("/health", tags=["Health"])
    async def health_check():
        """Basic health check endpoint."""
        return {"status": "ok", "version": settings.VERSION}

    # API v1 Router
    api_router = APIRouter(prefix=settings.API_V1_STR)
    
    from app.api.endpoints.foundation import router as foundation_router
    from app.api.endpoints.public import router as public_router
    from app.api.endpoints.auth import router as auth_router
    from app.api.endpoints.timesheets import router as timesheets_router
    from app.api.endpoints.finance import router as finance_router
    from app.api.endpoints.invoices import router as invoices_router

    api_router.include_router(foundation_router, prefix="/foundation", tags=["Foundation Validation"])
    api_router.include_router(public_router, prefix="/public", tags=["Public"])
    api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
    api_router.include_router(timesheets_router, prefix="/timesheets", tags=["Timesheets"])
    api_router.include_router(finance_router, prefix="/finance", tags=["Finance"])
    api_router.include_router(invoices_router, prefix="/invoices", tags=["Invoices"])

    # Mount router
    app.include_router(api_router)

    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
