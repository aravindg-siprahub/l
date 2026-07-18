from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Lorvish Platform API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    FRONTEND_URL: str = "http://localhost:3000"

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def parsed_cors_origins(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/lorvish"
    SUPABASE_URL: str | None = None
    SUPABASE_ANON_KEY: str | None = None
    SUPABASE_SERVICE_ROLE_KEY: str | None = None

    # JWT Authentication
    SECRET_KEY: str = "SUPER_SECRET_KEY_CHANGE_ME_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Redis/Celery
    REDIS_URL: str = "redis://localhost:6379/0"

    # AI Configuration
    AI_PROVIDER: str = "openai"  # or 'claude'
    AI_API_KEY: str = ""

    # ── Brevo Email — Transactional API (active sender) ──────────────────────
    # Set BREVO_API_KEY and BREVO_SENDER_EMAIL in .env to enable email delivery.
    # email_service._send_email() is the single delivery boundary — swap it
    # here if you ever migrate to another provider.
    BREVO_API_KEY: str = ""
    BREVO_SENDER_NAME: str = "Lorvish Platform"
    BREVO_SENDER_EMAIL: str = ""

    # Finance team recipient — receives notifications when a timesheet is approved
    FINANCE_EMAIL: str = ""

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")


settings = Settings()
