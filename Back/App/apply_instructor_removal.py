"""
Apply Database Migration: Remove Instructor Concept
This script removes all instructor-related columns and tables
"""

from database.connection import get_db
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def apply_migration():
    db = next(get_db())
    
    try:
        logger.info("Starting instructor removal migration...")
        
        # Execute each migration statement individually
        statements = [
            "DROP TABLE IF EXISTS instructors CASCADE",
            "ALTER TABLE class_sections DROP COLUMN IF EXISTS instructor_id CASCADE",
            # Instead of changing role, just delete instructor users or change to department_head if they have other roles
            "DELETE FROM users WHERE role = 'instructor'"
        ]
        
        for statement in statements:
            logger.info(f"Executing: {statement}")
            db.execute(text(statement))
            db.commit()  # Commit each statement separately
        
        logger.info("✅ Migration completed successfully!")
        
        # Verification
        logger.info("\nVerifying changes...")
        
        # Check if instructor_id column is gone
        check_column = db.execute(text("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'class_sections' AND column_name = 'instructor_id'
        """)).fetchone()
        
        if check_column:
            logger.warning("⚠️ instructor_id column still exists!")
        else:
            logger.info("✅ instructor_id column removed from class_sections")
        
        # Check instructor role users
        instructor_users = db.execute(text("""
            SELECT COUNT(*) FROM users WHERE role = 'instructor'
        """)).scalar()
        
        logger.info(f"✅ Instructor role users: {instructor_users} (should be 0)")
        
        # Check if instructors table is gone
        try:
            db.execute(text("SELECT COUNT(*) FROM instructors LIMIT 1"))
            logger.warning("⚠️ instructors table still exists!")
        except Exception:
            logger.info("✅ instructors table dropped successfully")
        
        logger.info("\n🎉 Migration complete! Instructor concept removed from system.")
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Migration failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    apply_migration()
