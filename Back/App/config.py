# Configuration settings for the Course Feedback System

import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database Configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:[Napakabangis0518]@db.esdohggqyckrtlpzbyhh.supabase.co:5432/postgres")
    
    # Debug Configuration
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # CORS Configuration (from .env)
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173")
    
    # JWT Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Validate SECRET_KEY on initialization
        if not self.SECRET_KEY:
            raise ValueError(
                "CRITICAL SECURITY ERROR: SECRET_KEY environment variable is not set!\n"
                "Please set a strong SECRET_KEY in your .env file.\n"
                "Generate one with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
            )
        if self.SECRET_KEY == "your-secret-key-here-change-in-production":
            raise ValueError(
                "CRITICAL SECURITY ERROR: SECRET_KEY is set to default value!\n"
                "Please generate a strong SECRET_KEY with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
            )
    
    # ML Model Configuration
    SVM_MODEL_PATH: str = "models/svm_sentiment_model.pkl"
    VECTORIZER_PATH: str = "models/tfidf_vectorizer.pkl"
    SCALER_PATH: str = "models/feature_scaler.pkl"
    
    # Training Data Configuration
    TRAINING_DATA_PATH: str = "data/training_data.csv"
    MIN_TRAINING_SAMPLES: int = 100
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Course Feedback System"
    
    # CORS Configuration
    # For Railway: Don't read from env, use hardcoded defaults + CORS_ORIGINS
    BACKEND_CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080"
    ]
    
    def get_cors_origins(self) -> list:
        """Get CORS origins from environment or use defaults"""
        cors_env = os.getenv("CORS_ORIGINS", "")
        if cors_env:
            # Split comma-separated string
            additional_origins = [origin.strip() for origin in cors_env.split(",")]
            return list(set(self.BACKEND_CORS_ORIGINS + additional_origins))
        return self.BACKEND_CORS_ORIGINS
    
    # Email Configuration - Resend
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    RESEND_FROM_EMAIL: str = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")
    RESEND_FROM_NAME: str = os.getenv("RESEND_FROM_NAME", "LPU Course Feedback System")
    
    # Backup: Email Configuration (SMTP)
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "LPU Course Feedback System")
    EMAIL_ENABLED: bool = os.getenv("EMAIL_ENABLED", "false").lower() == "true"
    
    # Timezone Configuration
    TIMEZONE: str = os.getenv("TIMEZONE", "Asia/Manila")  # Philippines Time (UTC+8)
    
    model_config = {
        "env_file": ".env",
        "extra": "ignore"  # Ignore extra fields from .env
    }

settings = Settings()

# Timezone utility functions
from datetime import datetime, timezone as dt_timezone
from zoneinfo import ZoneInfo

def get_local_timezone():
    """Get the configured local timezone"""
    return ZoneInfo(settings.TIMEZONE)

def now_local():
    """Get current datetime in local timezone"""
    return datetime.now(get_local_timezone())

def utc_to_local(utc_dt):
    """Convert UTC datetime to local timezone"""
    if utc_dt.tzinfo is None:
        utc_dt = utc_dt.replace(tzinfo=dt_timezone.utc)
    return utc_dt.astimezone(get_local_timezone())

def local_to_utc(local_dt):
    """Convert local datetime to UTC"""
    if local_dt.tzinfo is None:
        local_dt = local_dt.replace(tzinfo=get_local_timezone())
    return local_dt.astimezone(dt_timezone.utc)