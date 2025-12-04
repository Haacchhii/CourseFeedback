"""
Comprehensive System Scan
Checks for missing features, incomplete implementations, and issues
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from database.connection import SessionLocal
from sqlalchemy import text
import json

def print_section(title):
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)

def print_result(name, status, details=""):
    symbols = {"✅": "✅", "❌": "❌", "⚠️": "⚠️", "ℹ️": "ℹ️"}
    print(f"{symbols.get(status, status)} {name}")
    if details:
        print(f"   {details}")

def scan_database_structure():
    """Check database tables and columns"""
    print_section("DATABASE STRUCTURE")
    db = SessionLocal()
    
    try:
        # Check all expected tables
        expected_tables = [
            'users', 'students', 'programs', 'courses', 'class_sections',
            'enrollments', 'evaluations', 'evaluation_periods',
            'secretaries', 'department_heads', 'instructors',
            'audit_logs', 'export_history', 'system_settings',
            'password_reset_tokens'
        ]
        
        result = db.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """))
        existing_tables = [row[0] for row in result]
        
        for table in expected_tables:
            if table in existing_tables:
                count = db.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
                print_result(f"Table: {table}", "✅", f"{count} rows")
            else:
                print_result(f"Table: {table}", "❌", "MISSING!")
        
        # Check for extra tables
        extra_tables = set(existing_tables) - set(expected_tables)
        if extra_tables:
            print(f"\nℹ️ Extra tables found: {', '.join(extra_tables)}")
        
    except Exception as e:
        print_result("Database scan", "❌", str(e))
    finally:
        db.close()

def scan_critical_data():
    """Check for essential data"""
    print_section("CRITICAL DATA")
    db = SessionLocal()
    
    try:
        # Check users
        admin_count = db.execute(text("SELECT COUNT(*) FROM users WHERE role='admin'")).scalar()
        student_count = db.execute(text("SELECT COUNT(*) FROM users WHERE role='student'")).scalar()
        staff_count = db.execute(text("""
            SELECT COUNT(*) FROM users 
            WHERE role IN ('secretary', 'department_head', 'instructor')
        """)).scalar()
        
        print_result("Admin users", "✅" if admin_count > 0 else "❌", f"{admin_count} found")
        print_result("Student users", "✅" if student_count > 0 else "⚠️", f"{student_count} found")
        print_result("Staff users", "✅" if staff_count > 0 else "⚠️", f"{staff_count} found")
        
        # Check programs
        programs = db.execute(text("SELECT COUNT(*) FROM programs")).scalar()
        print_result("Programs", "✅" if programs > 0 else "❌", f"{programs} found")
        
        # Check active evaluation period
        active_period = db.execute(text("""
            SELECT COUNT(*) FROM evaluation_periods WHERE status='active'
        """)).scalar()
        print_result("Active evaluation period", "✅" if active_period > 0 else "⚠️", 
                    f"{active_period} active periods")
        
        # Check courses
        courses = db.execute(text("SELECT COUNT(*) FROM courses")).scalar()
        print_result("Courses", "✅" if courses > 0 else "⚠️", f"{courses} found")
        
        # Check enrollments
        enrollments = db.execute(text("SELECT COUNT(*) FROM enrollments")).scalar()
        print_result("Enrollments", "✅" if enrollments > 0 else "⚠️", f"{enrollments} found")
        
        # Check evaluations
        evaluations = db.execute(text("SELECT COUNT(*) FROM evaluations")).scalar()
        print_result("Evaluations submitted", "ℹ️", f"{evaluations} found")
        
    except Exception as e:
        print_result("Data scan", "❌", str(e))
    finally:
        db.close()

def scan_staff_programs():
    """Check if staff have programs assigned"""
    print_section("STAFF PROGRAM ASSIGNMENTS")
    db = SessionLocal()
    
    try:
        # Check secretaries
        result = db.execute(text("""
            SELECT 
                u.email,
                u.first_name,
                u.last_name,
                s.programs
            FROM secretaries s
            JOIN users u ON s.user_id = u.id
        """))
        
        print("\n📋 SECRETARIES:")
        for row in result:
            email, first, last, programs = row
            if programs:
                print_result(f"{first} {last} ({email})", "✅", f"{len(programs)} programs")
            else:
                print_result(f"{first} {last} ({email})", "❌", "NO PROGRAMS ASSIGNED!")
        
        # Check department heads
        result = db.execute(text("""
            SELECT 
                u.email,
                u.first_name,
                u.last_name,
                dh.programs
            FROM department_heads dh
            JOIN users u ON dh.user_id = u.id
        """))
        
        print("\n👤 DEPARTMENT HEADS:")
        for row in result:
            email, first, last, programs = row
            if programs:
                print_result(f"{first} {last} ({email})", "✅", f"{len(programs)} programs")
            else:
                print_result(f"{first} {last} ({email})", "❌", "NO PROGRAMS ASSIGNED!")
        
    except Exception as e:
        print_result("Staff programs scan", "❌", str(e))
    finally:
        db.close()

def scan_model_issues():
    """Check for model/database mismatches"""
    print_section("MODEL VALIDATION")
    
    try:
        from models.enhanced_models import (
            User, Student, Program, Course, ClassSection, Evaluation,
            Secretary, DepartmentHead, Instructor, EvaluationPeriod
        )
        print_result("All models import successfully", "✅")
        
        # Try to query each model
        db = SessionLocal()
        try:
            db.query(User).first()
            print_result("User model", "✅")
            
            db.query(Student).first()
            print_result("Student model", "✅")
            
            db.query(Secretary).first()
            print_result("Secretary model", "✅")
            
            db.query(DepartmentHead).first()
            print_result("DepartmentHead model", "✅")
            
            db.query(Program).first()
            print_result("Program model", "✅")
            
            db.query(Course).first()
            print_result("Course model", "✅")
            
            db.query(ClassSection).first()
            print_result("ClassSection model", "✅")
            
            db.query(Evaluation).first()
            print_result("Evaluation model", "✅")
            
            db.query(EvaluationPeriod).first()
            print_result("EvaluationPeriod model", "✅")
            
        except Exception as e:
            print_result("Model queries", "❌", str(e))
        finally:
            db.close()
            
    except ImportError as e:
        print_result("Model imports", "❌", str(e))

def scan_missing_features():
    """Check for incomplete or missing features"""
    print_section("FEATURE COMPLETENESS")
    
    # Check key files exist
    files_to_check = [
        ("Backend Main", "main.py"),
        ("Auth Routes", "routes/auth.py"),
        ("Student Routes", "routes/student.py"),
        ("Secretary Routes", "routes/secretary.py"),
        ("Dept Head Routes", "routes/department_head.py"),
        ("Admin Routes", "routes/system_admin.py"),
        ("Welcome Email Service", "services/welcome_email_service.py"),
        ("Email Service", "services/email_service.py"),
        ("Config", "config.py"),
        (".env file", ".env"),
    ]
    
    for name, filepath in files_to_check:
        if os.path.exists(filepath):
            size = os.path.getsize(filepath)
            print_result(name, "✅", f"{size:,} bytes")
        else:
            print_result(name, "❌", "FILE MISSING!")

def scan_environment():
    """Check environment configuration"""
    print_section("ENVIRONMENT CONFIGURATION")
    
    if not os.path.exists('.env'):
        print_result(".env file", "❌", "MISSING!")
        return
    
    with open('.env', 'r') as f:
        env_content = f.read()
    
    required_vars = [
        'DATABASE_URL',
        'SECRET_KEY',
        'SMTP_SERVER',
        'SMTP_USERNAME',
        'SMTP_PASSWORD',
        'FRONTEND_URL'
    ]
    
    for var in required_vars:
        if var in env_content and f"{var}=" in env_content:
            # Check if it has a value
            for line in env_content.split('\n'):
                if line.startswith(f"{var}=") and not line.startswith('#'):
                    value = line.split('=', 1)[1].strip()
                    if value:
                        print_result(var, "✅", "Configured")
                    else:
                        print_result(var, "⚠️", "Empty value")
                    break
            else:
                print_result(var, "⚠️", "Commented out")
        else:
            print_result(var, "❌", "NOT FOUND!")

def main():
    print("\n" + "🔍"*40)
    print("COMPREHENSIVE SYSTEM SCAN")
    print("🔍"*40)
    
    scan_database_structure()
    scan_critical_data()
    scan_staff_programs()
    scan_model_issues()
    scan_missing_features()
    scan_environment()
    
    print("\n" + "="*80)
    print("SCAN COMPLETE")
    print("="*80)
    
    print("\n📋 SUMMARY OF ISSUES TO FIX:")
    print("1. Check if staff (secretaries/dept heads) have programs assigned")
    print("2. Ensure there's at least one active evaluation period")
    print("3. Verify students are enrolled in courses")
    print("4. Check environment variables are properly set")
    print("\n💡 TIP: Run assign_programs_to_staff.py if staff have no programs")

if __name__ == "__main__":
    main()
