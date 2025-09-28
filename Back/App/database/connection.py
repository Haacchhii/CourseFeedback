# Database Configuration and Connection
# Connects FastAPI to PostgreSQL database

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import Generator

# Database URL configuration
# Update these settings to match your PostgreSQL setup
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:0518@localhost:5432/CourseFeedback"
)

# Alternative format if needed:
# DATABASE_URL = "postgresql://username:password@localhost:5432/database_name"

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=300,    # Recycle connections every 5 minutes
    echo=False           # Set to True for SQL debugging
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