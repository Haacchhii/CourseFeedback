"""
System Data Reset Script
========================
Clears all user-generated data while preserving system structure.

What this script CLEARS:
- All users (students, staff, department heads, secretaries)
- All evaluations and responses
- All enrollments
- All class sections and program sections
- All courses
- All programs
- All evaluation periods
- All audit logs
- All export history
- All password reset tokens

What this script PRESERVES:
- System admin accounts (role='admin')
- Database schema and tables
- System settings (if needed)

USE CASE: Fresh start for natural data flow testing
"""

import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from sqlalchemy.orm import Session
from database.connection import SessionLocal, engine
from models.enhanced_models import (
    User, Student, DepartmentHead, Secretary, Evaluation, 
    Enrollment, ClassSection, ProgramSection, Course, Program,
    EvaluationPeriod, AuditLog, ExportHistory, PasswordResetToken,
    SystemSettings
)
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def confirm_reset():
    """Ask for user confirmation before proceeding"""
    print("\n" + "="*70)
    print("⚠️  SYSTEM DATA RESET - DESTRUCTIVE OPERATION ⚠️")
    print("="*70)
    print("\nThis script will DELETE all data except system admin accounts:")
    print("\n✗ All students, staff, department heads, secretaries")
    print("✗ All evaluations and responses")
    print("✗ All enrollments")
    print("✗ All courses and sections")
    print("✗ All programs")
    print("✗ All evaluation periods")
    print("✗ All audit logs")
    print("✗ All export history")
    print("\n✓ System admin accounts will be PRESERVED")
    print("\n" + "="*70)
    
    response = input("\nType 'RESET' to confirm data deletion: ")
    return response == "RESET"

def backup_admin_accounts(db: Session):
    """Get list of admin accounts to preserve"""
    admins = db.query(User).filter(User.role == 'admin').all()
    admin_ids = [admin.id for admin in admins]
    admin_emails = [admin.email for admin in admins]
    
    logger.info(f"Found {len(admins)} admin account(s) to preserve:")
    for admin in admins:
        logger.info(f"  - {admin.email} (ID: {admin.id})")
    
    return admin_ids

def reset_system_data():
    """Reset all system data except admin accounts"""
    db = SessionLocal()
    
    try:
        # Get admin IDs to preserve
        admin_ids = backup_admin_accounts(db)
        
        if not admin_ids:
            logger.warning("⚠️  No admin accounts found! Creating at least one admin is recommended.")
        
        logger.info("\n" + "="*70)
        logger.info("STARTING DATA CLEANUP")
        logger.info("="*70)
        
        # Step 1: Delete evaluations (no foreign key constraints)
        logger.info("\n[1/12] Deleting evaluations...")
        eval_count = db.query(Evaluation).delete()
        db.commit()
        logger.info(f"  ✓ Deleted {eval_count} evaluations")
        
        # Step 2: Delete enrollments
        logger.info("\n[2/12] Deleting enrollments...")
        enroll_count = db.query(Enrollment).delete()
        db.commit()
        logger.info(f"  ✓ Deleted {enroll_count} enrollments")
        
        # Step 3: Delete class sections
        logger.info("\n[3/12] Deleting class sections...")
        section_count = db.query(ClassSection).delete()
        db.commit()
        logger.info(f"  ✓ Deleted {section_count} class sections")
        
        # Step 4: Delete program sections
        logger.info("\n[4/12] Deleting program sections...")
        prog_section_count = db.query(ProgramSection).delete()
        db.commit()
        logger.info(f"  ✓ Deleted {prog_section_count} program sections")
        
        # Step 5: Delete courses
        logger.info("\n[5/12] Deleting courses...")
        course_count = db.query(Course).delete()
        db.commit()
        logger.info(f"  ✓ Deleted {course_count} courses")
        
        # Step 6: Delete programs
        logger.info("\n[6/12] Deleting programs...")
        program_count = db.query(Program).delete()
        db.commit()
        logger.info(f"  ✓ Deleted {program_count} programs")
        
        # Step 7: Delete evaluation periods
        logger.info("\n[7/12] Deleting evaluation periods...")
        period_count = db.query(EvaluationPeriod).delete()
        db.commit()
        logger.info(f"  ✓ Deleted {period_count} evaluation periods")
        
        # Step 8: Delete role-specific records (students, dept heads, secretaries)
        logger.info("\n[8/12] Deleting role-specific records...")
        student_count = db.query(Student).filter(~Student.user_id.in_(admin_ids) if admin_ids else True).delete(synchronize_session=False)
        dept_head_count = db.query(DepartmentHead).filter(~DepartmentHead.user_id.in_(admin_ids) if admin_ids else True).delete(synchronize_session=False)
        secretary_count = db.query(Secretary).filter(~Secretary.user_id.in_(admin_ids) if admin_ids else True).delete(synchronize_session=False)
        db.commit()
        logger.info(f"  ✓ Deleted {student_count} student records")
        logger.info(f"  ✓ Deleted {dept_head_count} department head records")
        logger.info(f"  ✓ Deleted {secretary_count} secretary records")
        
        # Step 9: Delete non-admin users
        logger.info("\n[9/12] Deleting non-admin users...")
        if admin_ids:
            user_count = db.query(User).filter(~User.id.in_(admin_ids)).delete(synchronize_session=False)
        else:
            user_count = db.query(User).delete()
        db.commit()
        logger.info(f"  ✓ Deleted {user_count} non-admin users")
        
        # Step 10: Delete audit logs (except admin actions if you want to preserve)
        logger.info("\n[10/12] Deleting audit logs...")
        audit_count = db.query(AuditLog).delete()
        db.commit()
        logger.info(f"  ✓ Deleted {audit_count} audit log entries")
        
        # Step 11: Delete export history
        logger.info("\n[11/12] Deleting export history...")
        export_count = db.query(ExportHistory).delete()
        db.commit()
        logger.info(f"  ✓ Deleted {export_count} export history records")
        
        # Step 12: Delete password reset tokens
        logger.info("\n[12/12] Deleting password reset tokens...")
        token_count = db.query(PasswordResetToken).delete()
        db.commit()
        logger.info(f"  ✓ Deleted {token_count} password reset tokens")
        
        # Final commit
        db.commit()
        
        logger.info("\n" + "="*70)
        logger.info("✅ DATA CLEANUP COMPLETED SUCCESSFULLY")
        logger.info("="*70)
        logger.info(f"\nPreserved {len(admin_ids)} admin account(s)")
        logger.info("\nYour system is now ready for fresh data entry!")
        logger.info("\nNext steps:")
        logger.info("1. Create evaluation periods")
        logger.info("2. Add programs and courses")
        logger.info("3. Import or create users (students, staff)")
        logger.info("4. Create class sections and enroll students")
        logger.info("5. Begin natural data flow testing")
        
    except Exception as e:
        logger.error(f"\n❌ Error during data reset: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def main():
    """Main execution function"""
    print("\n🔧 Course Feedback System - Data Reset Utility")
    
    if not confirm_reset():
        print("\n❌ Reset cancelled by user.")
        return
    
    print("\n⏳ Starting data reset...")
    
    try:
        reset_system_data()
        print("\n✅ System reset complete! You can now start with fresh data.")
    except Exception as e:
        print(f"\n❌ Reset failed: {e}")
        print("\nPlease check the error and try again.")
        sys.exit(1)

if __name__ == "__main__":
    main()
