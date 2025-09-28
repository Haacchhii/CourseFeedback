# Configuration settings for the Course Feedback System

import os
from pydantic import BaseSettings

class Settings(BaseSettings):
    # Database Configuration
    DATABASE_URL: str = "postgresql://postgres:password@localhost/course_feedback_db"
    
    # JWT Configuration
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
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
    
    class Config:
        env_file = ".env"

settings = Settings()