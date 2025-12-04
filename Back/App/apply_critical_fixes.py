"""
Apply all critical fixes to the database
- Create instructors table
- Add instructor_id column to class_sections
- Activate evaluation period
- Assign programs to staff
"""

import os
import sys
from pathlib import Path
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from database.connection import SessionLocal
from sqlalchemy import text

def print_section(title):
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)

def print_result(status, message):
    symbols = {"✅": "✅", "❌": "❌", "⚠️": "⚠️", "ℹ️": "ℹ️"}
    print(f"{symbols.get(status, status)} {message}")

def fix_instructors_table():
    """Create instructors table if missing"""
    print_section("FIX 1: CREATE INSTRUCTORS TABLE")
    db = SessionLocal()
    
    try:
        # Check if table exists
        result = db.execute(text("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name='instructors'
            )
        """))
        exists = result.scalar()
        
        if exists:
            print_result("ℹ️", "Instructors table already exists")
            count = db.execute(text("SELECT COUNT(*) FROM instructors")).scalar()
            print_result("ℹ️", f"Current instructors: {count}")
            return True
        
        print_result("⚠️", "Instructors table is MISSING - creating now...")
        
        # Create instructors table
        db.execute(text("""
            CREATE TABLE instructors (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                department VARCHAR(255),
                specialization VARCHAR(255),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """))
        
        # Create index
        db.execute(text("""
            CREATE INDEX idx_instructors_user_id ON instructors(user_id)
        """))
        
        db.commit()
        print_result("✅", "Instructors table created successfully")
        
        # Populate with existing instructor users
        result = db.execute(text("""
            INSERT INTO instructors (user_id, name, department, specialization)
            SELECT 
                u.id as user_id,
                CONCAT(u.first_name, ' ', u.last_name) as name,
                'General' as department,
                NULL as specialization
            FROM users u
            WHERE u.role = 'instructor'
            RETURNING id
        """))
        db.commit()
        
        created = len(list(result))
        print_result("✅", f"Created {created} instructor records from existing users")
        return True
        
    except Exception as e:
        db.rollback()
        print_result("❌", f"Error creating instructors table: {str(e)}")
        return False
    finally:
        db.close()

def fix_instructor_id_column():
    """Add instructor_id column to class_sections"""
    print_section("FIX 2: ADD INSTRUCTOR_ID TO CLASS_SECTIONS")
    db = SessionLocal()
    
    try:
        # Check if column exists
        result = db.execute(text("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='class_sections' AND column_name='instructor_id'
            )
        """))
        exists = result.scalar()
        
        if exists:
            print_result("ℹ️", "instructor_id column already exists")
            return True
        
        print_result("⚠️", "instructor_id column is MISSING - adding now...")
        
        # Add column
        db.execute(text("""
            ALTER TABLE class_sections 
            ADD COLUMN instructor_id INTEGER REFERENCES users(id) ON DELETE SET NULL
        """))
        
        # Create index
        db.execute(text("""
            CREATE INDEX idx_class_sections_instructor ON class_sections(instructor_id)
        """))
        
        db.commit()
        print_result("✅", "instructor_id column added successfully")
        return True
        
    except Exception as e:
        db.rollback()
        print_result("❌", f"Error adding instructor_id column: {str(e)}")
        return False
    finally:
        db.close()

def activate_evaluation_period():
    """Reactivate the evaluation period"""
    print_section("FIX 3: ACTIVATE EVALUATION PERIOD")
    db = SessionLocal()
    
    try:
        # Check current status
        result = db.execute(text("""
            SELECT id, name, status, end_date
            FROM evaluation_periods
            ORDER BY created_at DESC
            LIMIT 1
        """))
        row = result.first()
        
        if not row:
            print_result("❌", "No evaluation period found!")
            print_result("ℹ️", "Create one via admin panel: Settings > Evaluation Periods")
            return False
        
        period_id, name, status, end_date = row
        
        if status == 'active':
            print_result("✅", f"Period '{name}' is already active")
            return True
        
        print_result("⚠️", f"Period '{name}' is {status} - activating...")
        
        # Extend end date to next month
        new_end_date = datetime.now() + timedelta(days=60)
        
        db.execute(text("""
            UPDATE evaluation_periods
            SET status = 'active',
                end_date = :end_date
            WHERE id = :period_id
        """), {"period_id": period_id, "end_date": new_end_date})
        
        db.commit()
        print_result("✅", f"Period activated until {new_end_date.strftime('%Y-%m-%d')}")
        return True
        
    except Exception as e:
        db.rollback()
        print_result("❌", f"Error activating period: {str(e)}")
        return False
    finally:
        db.close()

def assign_staff_programs():
    """Assign all programs to staff who have none"""
    print_section("FIX 4: ASSIGN PROGRAMS TO STAFF")
    db = SessionLocal()
    
    try:
        # Get all program IDs
        result = db.execute(text("SELECT id FROM programs ORDER BY id"))
        all_program_ids = [row[0] for row in result]
        
        if not all_program_ids:
            print_result("⚠️", "No programs found in database")
            return True
        
        print_result("ℹ️", f"Found {len(all_program_ids)} programs")
        
        # Fix secretaries without programs
        result = db.execute(text("""
            SELECT s.id, u.email, u.first_name, u.last_name, s.programs
            FROM secretaries s
            JOIN users u ON s.user_id = u.id
        """))
        
        fixed_count = 0
        for row in result:
            sec_id, email, first, last, programs = row
            if not programs or len(programs) == 0:
                db.execute(text("""
                    UPDATE secretaries
                    SET programs = :programs
                    WHERE id = :sec_id
                """), {"programs": all_program_ids, "sec_id": sec_id})
                print_result("✅", f"Assigned programs to {first} {last} ({email})")
                fixed_count += 1
        
        # Fix department heads without programs
        result = db.execute(text("""
            SELECT dh.id, u.email, u.first_name, u.last_name, dh.programs
            FROM department_heads dh
            JOIN users u ON dh.user_id = u.id
        """))
        
        for row in result:
            dh_id, email, first, last, programs = row
            if not programs or len(programs) == 0:
                db.execute(text("""
                    UPDATE department_heads
                    SET programs = :programs
                    WHERE id = :dh_id
                """), {"programs": all_program_ids, "dh_id": dh_id})
                print_result("✅", f"Assigned programs to {first} {last} ({email})")
                fixed_count += 1
        
        db.commit()
        
        if fixed_count == 0:
            print_result("ℹ️", "All staff already have programs assigned")
        else:
            print_result("✅", f"Fixed {fixed_count} staff members")
        
        return True
        
    except Exception as e:
        db.rollback()
        print_result("❌", f"Error assigning programs: {str(e)}")
        return False
    finally:
        db.close()

def verify_fixes():
    """Verify all fixes were applied successfully"""
    print_section("VERIFICATION")
    db = SessionLocal()
    
    try:
        # Check instructors table
        result = db.execute(text("SELECT COUNT(*) FROM instructors")).scalar()
        print_result("✅" if result >= 0 else "❌", f"Instructors table: {result} rows")
        
        # Check instructor_id column
        result = db.execute(text("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='class_sections' AND column_name='instructor_id'
        """)).first()
        print_result("✅" if result else "❌", 
                    "instructor_id column: " + ("exists" if result else "MISSING"))
        
        # Check active period
        result = db.execute(text("""
            SELECT COUNT(*) FROM evaluation_periods WHERE status='active'
        """)).scalar()
        print_result("✅" if result > 0 else "⚠️", f"Active periods: {result}")
        
        # Check staff programs
        result = db.execute(text("""
            SELECT COUNT(*) FROM secretaries WHERE programs IS NULL OR array_length(programs, 1) = 0
        """)).scalar()
        print_result("✅" if result == 0 else "⚠️", f"Secretaries without programs: {result}")
        
        result = db.execute(text("""
            SELECT COUNT(*) FROM department_heads WHERE programs IS NULL OR array_length(programs, 1) = 0
        """)).scalar()
        print_result("✅" if result == 0 else "⚠️", f"Dept heads without programs: {result}")
        
    except Exception as e:
        print_result("❌", f"Verification error: {str(e)}")
    finally:
        db.close()

def main():
    print("\n" + "🔧"*40)
    print("APPLYING CRITICAL DATABASE FIXES")
    print("🔧"*40)
    
    print("\nThis will:")
    print("  1. Create instructors table (if missing)")
    print("  2. Add instructor_id column to class_sections (if missing)")
    print("  3. Activate the latest evaluation period")
    print("  4. Assign all programs to staff who have none")
    
    input("\nPress ENTER to continue or CTRL+C to cancel...")
    
    success = True
    
    # Apply fixes
    success &= fix_instructors_table()
    success &= fix_instructor_id_column()
    success &= activate_evaluation_period()
    success &= assign_staff_programs()
    
    # Verify
    verify_fixes()
    
    print("\n" + "="*80)
    if success:
        print("✅ ALL FIXES APPLIED SUCCESSFULLY!")
        print("\nNext steps:")
        print("  1. Restart backend: python main.py")
        print("  2. Test instructor management in admin panel")
        print("  3. Test class section creation with instructor assignment")
        print("  4. Test student evaluation submission")
    else:
        print("⚠️ SOME FIXES FAILED - Check errors above")
    print("="*80)

if __name__ == "__main__":
    main()
