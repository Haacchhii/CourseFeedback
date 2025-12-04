"""
Bulk Student Import Script
Imports students from student_csv.txt into the database
"""
import csv
import asyncio
from sqlalchemy.orm import Session
from database.connection import get_db
from models.enhanced_models import User, Student, ProgramSection, SectionStudent
from sqlalchemy import text
import bcrypt

# Program mapping
PROGRAM_MAPPING = {
    'BSPSY': 'Bachelor of Science in Psychology',
    'AB-PSY': 'Bachelor of Arts in Psychology',
    'BMMA': 'Bachelor of Multimedia Arts',
    'BSCS': 'Bachelor of Science in Computer Science',
    'BSCYSEC': 'Bachelor of Science in Cybersecurity',
    'BSCS-DS': 'Bachelor of Science in Computer Science - Data Science',
    'BSIT': 'Bachelor of Science in Information Technology'
}

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def get_or_create_program(db: Session, program_code: str):
    """Get or create program by code"""
    # Try to find existing program
    program_query = text("""
        SELECT id, program_code, program_name 
        FROM programs 
        WHERE program_code = :code
    """)
    result = db.execute(program_query, {"code": program_code}).fetchone()
    
    if result:
        return result[0]  # Return program ID
    
    # Create new program if not exists
    program_name = PROGRAM_MAPPING.get(program_code, program_code)
    insert_query = text("""
        INSERT INTO programs (program_code, program_name, department)
        VALUES (:code, :name, 'College of Arts and Sciences')
        RETURNING id
    """)
    result = db.execute(insert_query, {"code": program_code, "name": program_name})
    db.commit()
    return result.fetchone()[0]

def get_or_create_program_section(db: Session, program_id: int, year_level: str):
    """Get or create program section"""
    section_query = text("""
        SELECT id FROM program_sections 
        WHERE program_id = :program_id AND year_level = :year_level
        LIMIT 1
    """)
    result = db.execute(section_query, {
        "program_id": program_id,
        "year_level": year_level
    }).fetchone()
    
    if result:
        return result[0]
    
    # Create new program section
    insert_query = text("""
        INSERT INTO program_sections (program_id, year_level, section_name)
        VALUES (:program_id, :year_level, 'Section A')
        RETURNING id
    """)
    result = db.execute(insert_query, {
        "program_id": program_id,
        "year_level": year_level
    })
    db.commit()
    return result.fetchone()[0]

def import_students():
    """Import students from CSV file"""
    db = next(get_db())
    
    # Read CSV file
    csv_file_path = r'C:\Users\Jose Iturralde\Documents\1 thesis\student_csv.txt'
    
    success_count = 0
    error_count = 0
    skipped_count = 0
    
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file)
            
            for row in csv_reader:
                email = row['email'].strip()
                first_name = row['first_name'].strip()
                last_name = row['last_name'].strip()
                school_id = row['school_id'].strip()
                program_code = row['program'].strip()
                year_level = row['year_level'].strip()
                
                try:
                    # Check if user already exists
                    check_query = text("""
                        SELECT id FROM users WHERE email = :email OR username = :username
                    """)
                    existing = db.execute(check_query, {
                        "email": email,
                        "username": email.split('@')[0]
                    }).fetchone()
                    
                    if existing:
                        print(f"⚠️  Skipped: {email} - User already exists")
                        skipped_count += 1
                        continue
                    
                    # Get or create program
                    program_id = get_or_create_program(db, program_code)
                    
                    # Get or create program section
                    program_section_id = get_or_create_program_section(db, program_id, year_level)
                    
                    # Create user account
                    username = email.split('@')[0]
                    default_password = school_id  # Using school_id as default password
                    password_hash = hash_password(default_password)
                    
                    user_query = text("""
                        INSERT INTO users (
                            username, email, password_hash, role, 
                            first_name, last_name, first_time_login
                        )
                        VALUES (
                            :username, :email, :password_hash, 'student',
                            :first_name, :last_name, true
                        )
                        RETURNING id
                    """)
                    
                    user_result = db.execute(user_query, {
                        "username": username,
                        "email": email,
                        "password_hash": password_hash,
                        "first_name": first_name,
                        "last_name": last_name
                    })
                    user_id = user_result.fetchone()[0]
                    
                    # Create student record
                    student_query = text("""
                        INSERT INTO students (
                            user_id, student_number, program_id, year_level
                        )
                        VALUES (
                            :user_id, :student_number, :program_id, :year_level
                        )
                        RETURNING id
                    """)
                    
                    student_result = db.execute(student_query, {
                        "user_id": user_id,
                        "student_number": school_id,
                        "program_id": program_id,
                        "year_level": year_level
                    })
                    student_id = student_result.fetchone()[0]
                    
                    # Link student to program section
                    link_query = text("""
                        INSERT INTO section_students (section_id, student_id)
                        VALUES (:section_id, :student_id)
                        ON CONFLICT DO NOTHING
                    """)
                    
                    db.execute(link_query, {
                        "section_id": program_section_id,
                        "student_id": student_id
                    })
                    
                    db.commit()
                    
                    print(f"✅ Imported: {first_name} {last_name} ({email}) - {program_code} {year_level}")
                    success_count += 1
                    
                except Exception as e:
                    db.rollback()
                    print(f"❌ Error importing {email}: {str(e)}")
                    error_count += 1
                    continue
        
        print("\n" + "="*60)
        print("📊 IMPORT SUMMARY")
        print("="*60)
        print(f"✅ Successfully imported: {success_count} students")
        print(f"⚠️  Skipped (already exists): {skipped_count} students")
        print(f"❌ Errors: {error_count} students")
        print(f"📝 Total processed: {success_count + error_count + skipped_count} students")
        print("="*60)
        
    except FileNotFoundError:
        print(f"❌ Error: CSV file not found at {csv_file_path}")
    except Exception as e:
        print(f"❌ Error reading CSV file: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Starting bulk student import...")
    print("="*60)
    import_students()
    print("\n✅ Import process completed!")
