"""
Utility script to clean up expired or used password reset tokens
Run this script periodically or when needed to maintain database hygiene
"""

from sqlalchemy import text
from database.connection import get_db
from utils.timezone import now_local
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def cleanup_reset_tokens():
    """Remove expired and used password reset tokens"""
    db = next(get_db())
    
    try:
        # Get count before cleanup
        count_query = text("SELECT COUNT(*) FROM password_reset_tokens")
        before_count = db.execute(count_query).scalar()
        
        # Delete expired or used tokens
        cleanup_query = text("""
            DELETE FROM password_reset_tokens 
            WHERE expires_at < :current_time OR used = TRUE
        """)
        
        result = db.execute(cleanup_query, {"current_time": now_local()})
        db.commit()
        
        deleted_count = result.rowcount
        after_count = before_count - deleted_count
        
        logger.info(f"✅ Cleanup complete:")
        logger.info(f"   - Before: {before_count} tokens")
        logger.info(f"   - Deleted: {deleted_count} expired/used tokens")
        logger.info(f"   - Remaining: {after_count} active tokens")
        
        return deleted_count
        
    except Exception as e:
        logger.error(f"❌ Error during cleanup: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🧹 Starting password reset token cleanup...")
    deleted = cleanup_reset_tokens()
    print(f"✅ Cleanup complete! Removed {deleted} tokens.")
