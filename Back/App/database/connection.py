# Database Configuration and Connection
# Connects FastAPI to PostgreSQL database

import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import Generator

# Load .env file from the App directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Database URL configuration  
# Reads from .env file first, falls back to Session Pooler
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres.esdohggqyckrtlpzbyhh:Napakabangis0518@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
)

# Alternative format if needed:
# DATABASE_URL = "postgresql://username:password@localhost:5432/database_name"

# Create SQLAlchemy engine with connection pooling limits
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,      # Verify connections before use
    pool_recycle=300,        # Recycle connections every 5 minutes
    pool_size=5,             # Maximum number of permanent connections (reduced for Supabase)
    max_overflow=10,         # Maximum number of temporary connections
    pool_timeout=30,         # Timeout for getting connection from pool
    echo=False               # Set to True for SQL debugging
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Database dependency
def get_db() -> Generator:
    """
    Database dependency for FastAPI endpoints
    Provides database session and handles cleanup
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Test database connection
def test_connection():
    """Test database connection"""
    try:
        from sqlalchemy import text
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("✅ Database connection successful!")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

# Initialize database (create tables if they don't exist)
def init_db():
    """Initialize database tables"""
    try:
        # Import here to avoid circular imports
        import sys
        import os
        sys.path.append(os.path.dirname(os.path.dirname(__file__)))
        
        from models.enhanced_models import Base
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables initialized!")
        return True
    except Exception as e:
        print(f"❌ Failed to initialize database: {e}")
        return False