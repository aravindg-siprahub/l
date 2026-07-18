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
    

    # Mount router
    app.include_router(api_router)

    return app

app = create_app()

if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
