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
# MUST be set in .env file - no fallback for security
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL environment variable is not set!\n"
        "Please create a .env file in the Back/App directory with:\n"
        "DATABASE_URL=postgresql+psycopg://username:password@host:port/database"
    )

# Alternative format if needed:
# DATABASE_URL = "postgresql://username:password@localhost:5432/database_name"

# Create SQLAlchemy engine with optimized connection pooling
# Connection Pool Configuration:
# - pool_size: Number of permanent connections to maintain (5-10 recommended)
# - max_overflow: Additional connections during high load (10-20 recommended)
# - Total max connections = pool_size + max_overflow (15-30 typical)
# - pool_recycle: Recycle connections after 600s to prevent stale connections
# - pool_pre_ping: Test connections before use to handle network issues
# - pool_timeout: Wait max 30s for connection before failing
#
# For production with 100+ concurrent users:
# - Increase pool_size to 10-15
# - Increase max_overflow to 20-30
# - Monitor with: SELECT count(*) FROM pg_stat_activity WHERE datname='your_db';
#
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,      # Verify connections before use (detect stale connections)
    pool_recycle=600,        # Recycle connections every 10 minutes (prevents timeout issues)
    pool_size=10,            # Permanent connections (optimized for 50-100 concurrent users)
    max_overflow=20,         # Maximum temporary connections during peak load
    pool_timeout=30,         # Wait up to 30s for connection (prevents immediate failures)
    echo=False,              # Set to True for SQL debugging (logs all queries)
    connect_args={
        "prepare_threshold": None,  # Disable prepared statement cache (Supabase compatibility)
        "connect_timeout": 10,       # Connection timeout in seconds
        "keepalives": 1,             # Enable TCP keepalive (detect dead connections)
        "keepalives_idle": 30,       # Seconds before sending keepalive probes
        "keepalives_interval": 10,   # Seconds between keepalive probes
        "keepalives_count": 5        # Number of keepalive probes before giving up
    }
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