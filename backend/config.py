from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/hospital_roster"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 9000
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
    ]
    # LLM Integration
    ANTHROPIC_API_KEY: str | None = None

    class Config:
        env_file = ".env"


settings = Settings()
