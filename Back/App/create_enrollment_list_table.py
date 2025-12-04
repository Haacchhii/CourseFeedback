"""
Create enrollment_list table for pre-registered students
This table defines which students are officially enrolled in which programs
"""

from database.connection import get_db
from sqlalchemy import text

def create_enrollment_list_table():
    """
    Create table to store official student enrollment records
    This serves as the authoritative source for student-program assignments
    """
    db = next(get_db())
    
    try:
        # Create enrollment_list table
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS enrollment_list (
                id SERIAL PRIMARY KEY,
                student_number VARCHAR(50) UNIQUE NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                middle_name VARCHAR(100),
                email VARCHAR(255) UNIQUE,
                program_id INTEGER NOT NULL REFERENCES programs(id),
                year_level INTEGER NOT NULL CHECK (year_level BETWEEN 1 AND 4),
                college_code VARCHAR(20) NOT NULL,
                college_name VARCHAR(255) NOT NULL,
                status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred', 'graduated')),
                date_enrolled DATE DEFAULT CURRENT_DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER REFERENCES users(id),
                notes TEXT
            )
        """))
        
        # Create indexes for faster lookups
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_enrollment_student_number 
            ON enrollment_list(student_number)
        """))
        
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_enrollment_program 
            ON enrollment_list(program_id)
        """))
        
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_enrollment_college 
            ON enrollment_list(college_code)
        """))
        
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_enrollment_status 
            ON enrollment_list(status)
        """))
        
        # Create trigger to update updated_at timestamp
        db.execute(text("""
            CREATE OR REPLACE FUNCTION update_enrollment_list_timestamp()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        """))
        
        db.execute(text("""
            DROP TRIGGER IF EXISTS enrollment_list_updated_at ON enrollment_list;
            CREATE TRIGGER enrollment_list_updated_at
            BEFORE UPDATE ON enrollment_list
            FOR EACH ROW
            EXECUTE FUNCTION update_enrollment_list_timestamp();
        """))
        
        db.commit()
        
        print("✅ enrollment_list table created successfully!")
        print("\nTable structure:")
        print("  - student_number: Official student ID")
        print("  - first_name, last_name, middle_name: Student names")
        print("  - email: Student email (optional)")
        print("  - program_id: FOREIGN KEY to programs table")
        print("  - year_level: 1-4")
        print("  - college_code: e.g., CCAS, CBA, CED")
        print("  - college_name: Full college name")
        print("  - status: active, inactive, transferred, graduated")
        print("  - date_enrolled: When student enrolled")
        print("\nIndexes created for fast lookups")
        
        # Check current programs
        result = db.execute(text("""
            SELECT id, program_code, program_name, department
            FROM programs
            ORDER BY program_code
        """))
        
        programs = result.fetchall()
        print("\n📚 Available Programs:")
        for prog in programs:
            print(f"  ID {prog[0]}: {prog[1]} - {prog[2]} ({prog[3]})")
        
    except Exception as e:
        print(f"❌ Error creating table: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_enrollment_list_table()
