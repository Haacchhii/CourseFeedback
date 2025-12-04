"""
Add UNIQUE constraint to students.student_number column
This prevents duplicate student numbers in the database
"""

from database.connection import get_db
from sqlalchemy import text

def add_unique_constraint():
    db = next(get_db())
    
    try:
        print("="*80)
        print("ADDING UNIQUE CONSTRAINT TO STUDENT_NUMBER")
        print("="*80)
        
        # First, check if there are any duplicates
        print("\n[1] Checking for existing duplicate student numbers...")
        duplicates = db.execute(text("""
            SELECT student_number, COUNT(*) as count
            FROM students
            GROUP BY student_number
            HAVING COUNT(*) > 1
        """)).fetchall()
        
        if duplicates:
            print(f"   ❌ Found {len(duplicates)} duplicate student numbers:")
            for dup in duplicates:
                print(f"      Student number '{dup[0]}' appears {dup[1]} times")
            print("\n   ⚠️  Please resolve duplicates before adding constraint!")
            print("   Run this query to see details:")
            print("   SELECT * FROM students WHERE student_number IN (")
            print("     SELECT student_number FROM students GROUP BY student_number HAVING COUNT(*) > 1")
            print("   ) ORDER BY student_number")
            return
        else:
            print("   ✅ No duplicate student numbers found")
        
        # Check if constraint already exists
        print("\n[2] Checking if constraint already exists...")
        constraint_exists = db.execute(text("""
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'students' 
            AND constraint_type = 'UNIQUE'
            AND constraint_name = 'unique_student_number'
        """)).fetchone()
        
        if constraint_exists:
            print("   ℹ️  Constraint 'unique_student_number' already exists")
            return
        else:
            print("   ✅ Constraint does not exist, will create")
        
        # Add the UNIQUE constraint
        print("\n[3] Adding UNIQUE constraint...")
        db.execute(text("""
            ALTER TABLE students 
            ADD CONSTRAINT unique_student_number UNIQUE (student_number)
        """))
        db.commit()
        print("   ✅ Constraint added successfully!")
        
        # Verify the constraint was added
        print("\n[4] Verifying constraint...")
        verify = db.execute(text("""
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'students' 
            AND constraint_type = 'UNIQUE'
            AND constraint_name = 'unique_student_number'
        """)).fetchone()
        
        if verify:
            print("   ✅ Constraint verified in database!")
        else:
            print("   ❌ Constraint verification failed!")
        
        # Test the constraint
        print("\n[5] Testing constraint (this should fail)...")
        try:
            # Get an existing student number
            existing = db.execute(text("""
                SELECT student_number FROM students LIMIT 1
            """)).fetchone()
            
            if existing:
                # Try to insert duplicate (will fail)
                db.execute(text("""
                    INSERT INTO students (student_number, user_id, program_id, year_level, status)
                    VALUES (:sn, 1, 1, 1, 'active')
                """), {"sn": existing[0]})
                db.commit()
                print("   ❌ Test failed - duplicate was allowed!")
            else:
                print("   ℹ️  No students to test with")
        except Exception as e:
            db.rollback()
            if "unique" in str(e).lower() or "duplicate" in str(e).lower():
                print("   ✅ Constraint working! Duplicate insert was rejected as expected")
            else:
                print(f"   ⚠️  Unexpected error: {e}")
        
        print("\n" + "="*80)
        print("CONSTRAINT ADDITION COMPLETE!")
        print("="*80)
        print("\n✅ Student numbers are now unique")
        print("✅ No duplicate student numbers can be created")
        print("✅ Database integrity improved")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error adding constraint: {e}")
        print("\nThis might mean:")
        print("1. Constraint already exists (check manually)")
        print("2. Database permissions issue")
        print("3. Duplicate student numbers exist (check above)")
    finally:
        db.close()

if __name__ == "__main__":
    add_unique_constraint()
