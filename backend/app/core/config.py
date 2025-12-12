from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_URI: str
    MONGO_DB_NAME: str = "attendance_db"
    BACKEND_CORS_ORIGINS: str = "*"
    ENV: str = "development"

    class Config:
        env_file = ".env"

settings = Settings()
