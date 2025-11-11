"""
System Diagnostic Script
Checks database connection, tables, and data
"""

from database.connection import engine, test_connection
from sqlalchemy import text, inspect
import sys

def check_database():
    print("=" * 60)
    print("COMPREHENSIVE SYSTEM DIAGNOSTIC")
    print("=" * 60)
    
    # Test connection
    print("\n1. DATABASE CONNECTION")
    print("-" * 60)
    if not test_connection():
        print("❌ Cannot connect to database")
        return False
    
    # Check tables
    print("\n2. DATABASE TABLES")
    print("-" * 60)
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Found {len(tables)} tables:")
    for table in sorted(tables):
        print(f"  ✓ {table}")
    
    # Check table structures
    print("\n3. TABLE STRUCTURES")
    print("-" * 60)
    
    important_tables = ['users', 'students', 'instructors', 'department_heads', 
                       'secretaries', 'programs', 'courses', 'class_sections', 
                       'enrollments', 'evaluations']
    
    with engine.connect() as conn:
        for table in important_tables:
            if table in tables:
                result = conn.execute(text(f"""
                    SELECT column_name, data_type, character_maximum_length, is_nullable
                    FROM information_schema.columns
                    WHERE table_name = '{table}'
                    ORDER BY ordinal_position
                """))
                print(f"\n{table.upper()} columns:")
                for row in result:
                    length = f"({row.character_maximum_length})" if row.character_maximum_length else ""
                    nullable = "NULL" if row.is_nullable == "YES" else "NOT NULL"
                    print(f"  - {row.column_name}: {row.data_type}{length} {nullable}")
    
    # Check data counts
    print("\n4. DATA COUNTS")
    print("-" * 60)
    
    with engine.connect() as conn:
        counts = {}
        for table in important_tables:
            if table in tables:
                count = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
                counts[table] = count
                status = "✓" if count > 0 else "⚠"
                print(f"  {status} {table}: {count} records")
    
    # Check users table specifically
    print("\n5. USERS TABLE DETAILS")
    print("-" * 60)
    
    with engine.connect() as conn:
        users = conn.execute(text("""
            SELECT id, email, role, first_name, last_name, is_active
            FROM users
            LIMIT 10
        """)).fetchall()
        
        if users:
            print(f"Sample users (showing up to 10):")
            for user in users:
                status = "ACTIVE" if user.is_active else "INACTIVE"
                print(f"  {user.id}. {user.email} - {user.role} ({status})")
        else:
            print("  ⚠ NO USERS FOUND IN DATABASE")
    
    # Check for role-specific tables
    print("\n6. ROLE-SPECIFIC DATA")
    print("-" * 60)
    
    with engine.connect() as conn:
        # Check students
        student_count = conn.execute(text("SELECT COUNT(*) FROM students")).scalar()
        instructor_count = conn.execute(text("SELECT COUNT(*) FROM instructors")).scalar()
        dept_head_count = conn.execute(text("SELECT COUNT(*) FROM department_heads")).scalar()
        secretary_count = conn.execute(text("SELECT COUNT(*) FROM secretaries")).scalar()
        
        print(f"  Students with records: {student_count}")
        print(f"  Instructors with records: {instructor_count}")
        print(f"  Department Heads with records: {dept_head_count}")
        print(f"  Secretaries with records: {secretary_count}")
        
        # Check for orphaned users (users without role-specific records)
        result = conn.execute(text("""
            SELECT role, COUNT(*) as count
            FROM users
            GROUP BY role
        """)).fetchall()
        
        print("\n  User counts by role:")
        for row in result:
            print(f"    - {row.role}: {row.count}")
    
    # Check programs and courses
    print("\n7. PROGRAMS AND COURSES")
    print("-" * 60)
    
    with engine.connect() as conn:
        programs = conn.execute(text("""
            SELECT id, program_code, program_name
            FROM programs
            ORDER BY id
        """)).fetchall()
        
        if programs:
            print(f"Programs ({len(programs)}):")
            for prog in programs:
                course_count = conn.execute(text(
                    "SELECT COUNT(*) FROM courses WHERE program_id = :prog_id"
                ), {"prog_id": prog.id}).scalar()
                print(f"  {prog.id}. {prog.program_code} - {prog.program_name} ({course_count} courses)")
        else:
            print("  ⚠ NO PROGRAMS FOUND")
    
    print("\n" + "=" * 60)
    print("DIAGNOSTIC COMPLETE")
    print("=" * 60)
    
    return True

if __name__ == "__main__":
    try:
        check_database()
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
