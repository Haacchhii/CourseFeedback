# Configuration settings for the Course Feedback System

import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database Configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost/course_feedback_db")
    
    # Debug Configuration
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # CORS Configuration (from .env)
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173")
    
    # JWT Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
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
    BACKEND_CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080"
    ]
    
    # Email Configuration (SMTP)
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