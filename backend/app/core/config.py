# backend/app/core/config.py
import os

class Settings:
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "sqlite:///./app.db")

settings = Settings()


