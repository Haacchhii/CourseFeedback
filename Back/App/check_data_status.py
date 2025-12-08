"""
System Data Status Checker
===========================
Shows current data counts in the system.
Useful before/after data reset operations.
"""

import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import func
from database.connection import SessionLocal
from models.enhanced_models import (
    User, Student, DepartmentHead, Secretary, Evaluation, 
    Enrollment, ClassSection, ProgramSection, Course, Program,
    EvaluationPeriod, AuditLog, ExportHistory
)

def check_data_status():
    """Display current data counts"""
    db = SessionLocal()
    
    try:
        print("\n" + "="*70)
        print("📊 SYSTEM DATA STATUS")
        print("="*70)
        
        # Users by role
        print("\n👥 USERS:")
        admin_count = db.query(User).filter(User.role == 'admin').count()
        student_count = db.query(User).filter(User.role == 'student').count()
        dept_head_count = db.query(User).filter(User.role == 'department_head').count()
        secretary_count = db.query(User).filter(User.role == 'secretary').count()
        total_users = db.query(User).count()
        active_users = db.query(User).filter(User.is_active == True).count()
        
        print(f"  Total Users: {total_users}")
        print(f"  Active Users: {active_users}")
        print(f"  - Admins: {admin_count}")
        print(f"  - Students: {student_count}")
        print(f"  - Department Heads: {dept_head_count}")
        print(f"  - Secretaries: {secretary_count}")
        
        # Academic structure
        print("\n📚 ACADEMIC STRUCTURE:")
        program_count = db.query(Program).count()
        course_count = db.query(Course).count()
        class_section_count = db.query(ClassSection).count()
        prog_section_count = db.query(ProgramSection).count()
        
        print(f"  Programs: {program_count}")
        print(f"  Courses: {course_count}")
        print(f"  Class Sections: {class_section_count}")
        print(f"  Program Sections: {prog_section_count}")
        
        # Enrollments and evaluations
        print("\n📝 ENROLLMENTS & EVALUATIONS:")
        enrollment_count = db.query(Enrollment).count()
        evaluation_count = db.query(Evaluation).count()
        period_count = db.query(EvaluationPeriod).count()
        
        print(f"  Evaluation Periods: {period_count}")
        print(f"  Enrollments: {enrollment_count}")
        print(f"  Evaluations Submitted: {evaluation_count}")
        
        if enrollment_count > 0:
            completion_rate = (evaluation_count / enrollment_count * 100)
            print(f"  Completion Rate: {completion_rate:.1f}%")
        
        # System logs
        print("\n📋 SYSTEM LOGS:")
        audit_count = db.query(AuditLog).count()
        export_count = db.query(ExportHistory).count()
        
        print(f"  Audit Log Entries: {audit_count}")
        print(f"  Export History: {export_count}")
        
        # Role records
        print("\n🔐 ROLE RECORDS:")
        student_records = db.query(Student).count()
        dept_records = db.query(DepartmentHead).count()
        sec_records = db.query(Secretary).count()
        
        print(f"  Student Records: {student_records}")
        print(f"  Department Head Records: {dept_records}")
        print(f"  Secretary Records: {sec_records}")
        
        print("\n" + "="*70)
        
        # Data health check
        if total_users == 0:
            print("\n⚠️  WARNING: No users in system!")
        elif admin_count == 0:
            print("\n⚠️  WARNING: No admin accounts found!")
        else:
            print(f"\n✅ System has data. Admin accounts: {admin_count}")
        
    except Exception as e:
        print(f"\n❌ Error checking data status: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_data_status()
