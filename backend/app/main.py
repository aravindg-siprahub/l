# pyrefly: ignore [missing-import]
from fastapi import FastAPI, APIRouter
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

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

    # Global Health Check
    @app.get("/health", tags=["Health"])
    async def health_check():
        """Basic health check endpoint."""
        return {"status": "ok", "version": settings.VERSION}

    # API v1 Router
    api_router = APIRouter(prefix=settings.API_V1_STR)
    
    from app.api.endpoints.foundation import router as foundation_router
    api_router.include_router(foundation_router, prefix="/foundation", tags=["Foundation Validation"])
    
    from app.api.endpoints.auth import router as auth_router
    api_router.include_router(auth_router, prefix="/auth", tags=["Auth"])
    
    from app.api.endpoints.rbac_test import router as rbac_router
    api_router.include_router(rbac_router, prefix="/rbac", tags=["RBAC Testing"])
    
    from app.api.endpoints.system import router as system_router
    api_router.include_router(system_router, prefix="/system", tags=["System"])
    
    from app.api.endpoints.timesheets import router as timesheets_router
    api_router.include_router(timesheets_router, prefix="/timesheets", tags=["Timesheets"])
    
    from app.api.endpoints.hr import router as hr_router
    api_router.include_router(hr_router, prefix="/hr", tags=["HR"])
    
    from app.api.endpoints.invoices import router as invoices_router
    api_router.include_router(invoices_router, prefix="/invoices", tags=["Invoices"])
    
    # Mount router
    app.include_router(api_router)

    return app

app = create_app()

if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
