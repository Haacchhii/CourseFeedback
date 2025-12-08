"""
Student & Evaluation Data Reset Script
=======================================
Clears only student-related data while preserving system structure and staff.

What this script CLEARS:
- All students (student users and records)
- All evaluations and responses
- All enrollments
- Student-related audit logs (optional)

What this script PRESERVES:
- System admin accounts
- Department heads
- Secretaries
- All courses and class sections
- All programs and program sections
- All evaluation periods
- System settings

USE CASE: Keep your academic structure but reset student data
"""

import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from sqlalchemy.orm import Session
from database.connection import SessionLocal, engine
from models.enhanced_models import (
    User, Student, Evaluation, Enrollment, AuditLog
)
import logging

# Note: enrollment_list is a separate table accessed via raw SQL

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def confirm_reset():
    """Ask for user confirmation before proceeding"""
    print("\n" + "="*70)
    print("⚠️  STUDENT & EVALUATION DATA RESET ⚠️")
    print("="*70)
    print("\nThis script will DELETE:")
    print("\n✗ All students and student records")
    print("✗ All evaluations and responses")
    print("✗ All enrollments (course enrollments)")
    print("✗ All enrollment list records (registrar records)")
    print("\nThis script will PRESERVE:")
    print("\n✓ Admin accounts")
    print("✓ Department heads")
    print("✓ Secretaries")
    print("✓ Courses and class sections")
    print("✓ Programs and program sections")
    print("✓ Evaluation periods")
    print("\n" + "="*70)
    
    response = input("\nType 'RESET STUDENTS' to confirm deletion: ")
    return response == "RESET STUDENTS"

def reset_student_data():
    """Reset student and evaluation data only"""
    db = SessionLocal()
    
    try:
        logger.info("\n" + "="*70)
        logger.info("STARTING STUDENT & EVALUATION DATA CLEANUP")
        logger.info("="*70)
        
        # Step 1: Get count of students before deletion
        student_user_count = db.query(User).filter(User.role == 'student').count()
        student_record_count = db.query(Student).count()
        
        # Get enrollment_list count
        enrollment_list_result = db.execute(text("SELECT COUNT(*) FROM enrollment_list"))
        enrollment_list_count = enrollment_list_result.scalar()
        
        logger.info(f"\nFound {student_user_count} student users, {student_record_count} student records, and {enrollment_list_count} enrollment list records")
        
        # Step 2: Delete enrollment_list records (registrar's official records)
        logger.info("\n[1/5] Deleting enrollment list records...")
        db.execute(text("DELETE FROM enrollment_list"))
        db.commit()
        logger.info(f"  ✓ Deleted {enrollment_list_count} enrollment list records")
        
        # Step 3: Delete evaluations (no foreign key constraints)
        logger.info("\n[2/5] Deleting evaluations...")
        eval_count = db.query(Evaluation).delete()
        db.commit()
        logger.info(f"  ✓ Deleted {eval_count} evaluations")
        
        # Step 4: Delete enrollments
        logger.info("\n[3/5] Deleting enrollments...")
        enroll_count = db.query(Enrollment).delete()
        db.commit()
        logger.info(f"  ✓ Deleted {enroll_count} enrollments")
        
        # Step 5: Get student user IDs for audit log cleanup
        student_user_ids = [s.id for s in db.query(User.id).filter(User.role == 'student').all()]
        
        # Step 6: Delete student records (from Student table)
        logger.info("\n[4/5] Deleting student records...")
        student_records_deleted = db.query(Student).delete(synchronize_session=False)
        db.commit()
        logger.info(f"  ✓ Deleted {student_records_deleted} student records")
        
        # Step 7: Delete student users
        logger.info("\n[5/5] Deleting student user accounts...")
        student_users_deleted = db.query(User).filter(User.role == 'student').delete(synchronize_session=False)
        db.commit()
        logger.info(f"  ✓ Deleted {student_users_deleted} student users")
        
        # Optional: Clean up student-related audit logs
        if student_user_ids:
            logger.info("\n[Bonus] Cleaning student audit logs (optional)...")
            try:
                audit_deleted = db.query(AuditLog).filter(AuditLog.user_id.in_(student_user_ids)).delete(synchronize_session=False)
                db.commit()
                logger.info(f"  ✓ Deleted {audit_deleted} student audit log entries")
            except Exception as e:
                logger.warning(f"  ⚠️  Could not delete student audit logs: {e}")
                db.rollback()
        
        # Final commit
        db.commit()
        
        logger.info("\n" + "="*70)
        logger.info("✅ STUDENT & EVALUATION DATA CLEANUP COMPLETED")
        logger.info("="*70)
        logger.info(f"\nDeleted:")
        logger.info(f"  - {enrollment_list_count} enrollment list records")
        logger.info(f"  - {student_users_deleted} student users")
        logger.info(f"  - {student_records_deleted} student records")
        logger.info(f"  - {eval_count} evaluations")
        logger.info(f"  - {enroll_count} enrollments")
        logger.info("\nPreserved:")
        logger.info("  ✓ Admin accounts")
        logger.info("  ✓ Staff (department heads, secretaries)")
        logger.info("  ✓ Courses and sections")
        logger.info("  ✓ Programs")
        logger.info("  ✓ Evaluation periods")
        logger.info("\nYour system is ready for fresh student data!")
        logger.info("\nNext steps:")
        logger.info("1. Import or create new students")
        logger.info("2. Enroll students in class sections")
        logger.info("3. Students can begin submitting evaluations")
        
    except Exception as e:
        logger.error(f"\n❌ Error during reset: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def main():
    """Main execution function"""
    print("\n🔧 Course Feedback System - Student Data Reset")
    
    if not confirm_reset():
        print("\n❌ Reset cancelled by user.")
        return
    
    print("\n⏳ Starting student data reset...")
    
    try:
        reset_student_data()
        print("\n✅ Student data reset complete! You can now import fresh students.")
    except Exception as e:
        print(f"\n❌ Reset failed: {e}")
        print("\nPlease check the error and try again.")
        sys.exit(1)

if __name__ == "__main__":
    main()
