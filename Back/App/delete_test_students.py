"""
Delete All Test Student Accounts
Keep only: iturraldejose@lpubatangas.edu.ph
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from database.connection import SessionLocal
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

KEEP_EMAIL = "iturraldejose@lpubatangas.edu.ph"

def delete_test_students():
    """Delete all student accounts except the specified one."""
    
    db = SessionLocal()
    try:
        logger.info("="*70)
        logger.info("DELETING TEST STUDENT ACCOUNTS")
        logger.info(f"Keeping: {KEEP_EMAIL}")
        logger.info("="*70)
        
        # Get the user ID to keep
        keep_user = db.execute(text(
            "SELECT id FROM users WHERE email = :email"
        ), {"email": KEEP_EMAIL}).fetchone()
        
        keep_user_id = keep_user[0] if keep_user else -1
        logger.info(f"\nUser to keep: ID={keep_user_id}")
        
        # Count students to delete
        count_result = db.execute(text(
            "SELECT COUNT(*) FROM users WHERE role = 'student' AND id != :keep_id"
        ), {"keep_id": keep_user_id}).fetchone()
        
        students_to_delete = count_result[0] if count_result else 0
        logger.info(f"Students to delete: {students_to_delete}")
        
        if students_to_delete == 0:
            logger.info("No test students to delete.")
            return
        
        # Step 1: Delete evaluations for students to be deleted
        logger.info(f"\n[1/5] Deleting evaluations...")
        try:
            eval_deleted = db.execute(text("""
                DELETE FROM evaluations 
                WHERE student_id IN (
                    SELECT id FROM users WHERE role = 'student' AND id != :keep_id
                )
            """), {"keep_id": keep_user_id}).rowcount
            db.commit()
            logger.info(f"  ✓ Deleted {eval_deleted} evaluations")
        except Exception as e:
            logger.warning(f"  ⚠️ Evaluations: {e}")
            db.rollback()
        
        # Step 2: Delete section_students
        logger.info("\n[2/5] Deleting section_students records...")
        try:
            section_deleted = db.execute(text("""
                DELETE FROM section_students 
                WHERE student_id IN (
                    SELECT id FROM users WHERE role = 'student' AND id != :keep_id
                )
            """), {"keep_id": keep_user_id}).rowcount
            db.commit()
            logger.info(f"  ✓ Deleted {section_deleted} section_students")
        except Exception as e:
            logger.warning(f"  ⚠️ section_students: {e}")
            db.rollback()
        
        # Step 3: Delete enrollments
        logger.info("\n[3/5] Deleting enrollments...")
        try:
            enroll_deleted = db.execute(text("""
                DELETE FROM enrollments 
                WHERE student_id IN (
                    SELECT id FROM users WHERE role = 'student' AND id != :keep_id
                )
            """), {"keep_id": keep_user_id}).rowcount
            db.commit()
            logger.info(f"  ✓ Deleted {enroll_deleted} enrollments")
        except Exception as e:
            logger.warning(f"  ⚠️ Enrollments: {e}")
            db.rollback()
        
        # Step 4: Delete student records
        logger.info("\n[4/5] Deleting student records...")
        try:
            student_records = db.execute(text("""
                DELETE FROM students 
                WHERE user_id IN (
                    SELECT id FROM users WHERE role = 'student' AND id != :keep_id
                )
            """), {"keep_id": keep_user_id}).rowcount
            db.commit()
            logger.info(f"  ✓ Deleted {student_records} student records")
        except Exception as e:
            logger.warning(f"  ⚠️ Students table: {e}")
            db.rollback()
        
        # Step 5: Delete user accounts
        logger.info("\n[5/5] Deleting user accounts...")
        users_deleted = db.execute(text("""
            DELETE FROM users 
            WHERE role = 'student' AND id != :keep_id
        """), {"keep_id": keep_user_id}).rowcount
        db.commit()
        logger.info(f"  ✓ Deleted {users_deleted} user accounts")
        
        logger.info("\n" + "="*70)
        logger.info("✅ CLEANUP COMPLETED")
        logger.info("="*70)
        
        # Verify remaining
        remaining = db.execute(text(
            "SELECT email FROM users WHERE role = 'student'"
        )).fetchall()
        
        logger.info(f"\nRemaining student accounts: {len(remaining)}")
        for r in remaining:
            logger.info(f"  - {r[0]}")
    
    finally:
        db.close()

if __name__ == "__main__":
    confirm = input(f"This will DELETE all student accounts except {KEEP_EMAIL}. Type 'yes' to confirm: ")
    if confirm.lower() == 'yes':
        delete_test_students()
    else:
        print("Cancelled.")
