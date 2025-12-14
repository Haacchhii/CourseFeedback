"""
Fix missing student records for users in section_students
This script creates student records for users who are assigned to program sections
but don't have entries in the students table.
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from database.connection import engine
from models.enhanced_models import Student
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fix_missing_student_records():
    """Create student records for users in section_students who lack them"""
    
    with Session(engine) as db:
        try:
            # Find users in section_students without student records
            result = db.execute(text("""
                SELECT DISTINCT 
                    u.id as user_id,
                    u.email,
                    u.first_name,
                    u.last_name,
                    u.school_id,
                    ps.program_id,
                    ps.year_level
                FROM section_students ss
                JOIN users u ON ss.student_id = u.id
                JOIN program_sections ps ON ss.section_id = ps.id
                LEFT JOIN students s ON s.user_id = u.id
                WHERE u.is_active = true
                AND u.role = 'student'
                AND s.id IS NULL
                ORDER BY u.id
            """))
            
            missing_users = result.fetchall()
            
            if not missing_users:
                logger.info("✅ No missing student records found. All users have student records.")
                return
            
            logger.info(f"Found {len(missing_users)} users WITHOUT student records:")
            for user in missing_users:
                logger.info(f"  User ID: {user[0]}, Email: {user[1]}, Name: {user[2]} {user[3]}, School ID: {user[4]}, Program: {user[5]}, Year: {user[6]}")
            
            # Create student records
            created_count = 0
            for user in missing_users:
                user_id, email, first_name, last_name, school_id, program_id, year_level = user
                
                # Generate student_number from school_id or user_id
                student_number = school_id if school_id else f"STU{user_id:05d}"
                
                logger.info(f"Creating student record for User ID {user_id} ({email}): student_number={student_number}")
                
                # Create the student record
                new_student = Student(
                    user_id=user_id,
                    student_number=student_number,
                    program_id=program_id,
                    year_level=year_level or 1,
                    is_active=True
                )
                db.add(new_student)
                created_count += 1
            
            db.commit()
            logger.info(f"✅ Successfully created {created_count} student records!")
            
        except Exception as e:
            logger.error(f"❌ Error: {e}")
            db.rollback()
            raise

if __name__ == "__main__":
    print("=" * 60)
    print("Fix Missing Student Records")
    print("=" * 60)
    print("\nThis script will create student records for users who are")
    print("assigned to program sections but lack entries in the students table.")
    print("\n" + "=" * 60)
    
    fix_missing_student_records()
    
    print("\n" + "=" * 60)
    print("Done! You can now try the quick bulk enroll again.")
    print("=" * 60)
