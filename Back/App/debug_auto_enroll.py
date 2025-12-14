"""
Debug script to trace through the exact auto-enrollment logic
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from database.connection import engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def debug_auto_enrollment(program_section_id):
    """Debug the auto-enrollment query step by step"""
    
    with Session(engine) as db:
        try:
            # Step 1: Check the program section exists
            logger.info(f"\n{'='*60}")
            logger.info(f"STEP 1: Verify Program Section {program_section_id}")
            logger.info(f"{'='*60}")
            
            section_info = db.execute(text("""
                SELECT id, section_name, program_id, year_level, semester, school_year
                FROM program_sections
                WHERE id = :section_id
            """), {"section_id": program_section_id}).fetchone()
            
            if not section_info:
                logger.error(f"❌ Program section {program_section_id} not found!")
                return
            
            logger.info(f"✅ Program Section: {section_info[1]}")
            logger.info(f"   Program ID: {section_info[2]}, Year: {section_info[3]}, Semester: {section_info[4]}")
            
            # Step 2: Check section_students
            logger.info(f"\n{'='*60}")
            logger.info(f"STEP 2: Check section_students table")
            logger.info(f"{'='*60}")
            
            section_students = db.execute(text("""
                SELECT ss.id, ss.student_id, u.email, u.first_name, u.last_name, u.role, u.is_active
                FROM section_students ss
                JOIN users u ON ss.student_id = u.id
                WHERE ss.section_id = :section_id
            """), {"section_id": program_section_id}).fetchall()
            
            logger.info(f"Found {len(section_students)} users in section_students:")
            for ss in section_students:
                logger.info(f"  User ID: {ss[1]}, Email: {ss[2]}, Name: {ss[3]} {ss[4]}, Role: {ss[5]}, Active: {ss[6]}")
            
            # Step 3: Check which have student records
            logger.info(f"\n{'='*60}")
            logger.info(f"STEP 3: Check students table for these users")
            logger.info(f"{'='*60}")
            
            students_with_records = db.execute(text("""
                SELECT s.id, s.user_id, s.student_number, s.program_id, s.year_level, u.email
                FROM section_students ss
                JOIN users u ON ss.student_id = u.id
                JOIN students s ON s.user_id = u.id
                WHERE ss.section_id = :section_id
            """), {"section_id": program_section_id}).fetchall()
            
            logger.info(f"Found {len(students_with_records)} users WITH student records:")
            for s in students_with_records:
                logger.info(f"  Student ID: {s[0]}, User ID: {s[1]}, Student#: {s[2]}, Email: {s[5]}")
            
            # Step 4: Run the EXACT query from auto-enrollment
            logger.info(f"\n{'='*60}")
            logger.info(f"STEP 4: Run EXACT auto-enrollment query")
            logger.info(f"{'='*60}")
            
            auto_enroll_query = db.execute(text("""
                SELECT s.id as student_id, u.email, u.first_name, u.last_name
                FROM section_students ss
                JOIN users u ON ss.student_id = u.id
                JOIN students s ON s.user_id = u.id
                WHERE ss.section_id = :section_id
                AND u.is_active = true
                AND u.role = 'student'
            """), {"section_id": program_section_id}).fetchall()
            
            logger.info(f"Auto-enrollment query returned {len(auto_enroll_query)} students:")
            for s in auto_enroll_query:
                logger.info(f"  Student ID: {s[0]}, Email: {s[1]}, Name: {s[2]} {s[3]}")
            
            # Step 5: Check for users filtered out
            if len(section_students) > len(auto_enroll_query):
                logger.info(f"\n{'='*60}")
                logger.info(f"STEP 5: Find users filtered out")
                logger.info(f"{'='*60}")
                
                filtered_users = db.execute(text("""
                    SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.is_active,
                           CASE WHEN s.id IS NULL THEN 'No student record' 
                                WHEN u.is_active = false THEN 'Inactive'
                                WHEN u.role != 'student' THEN 'Wrong role: ' || u.role
                                ELSE 'Unknown' END as reason
                    FROM section_students ss
                    JOIN users u ON ss.student_id = u.id
                    LEFT JOIN students s ON s.user_id = u.id
                    WHERE ss.section_id = :section_id
                    AND NOT (u.is_active = true AND u.role = 'student' AND s.id IS NOT NULL)
                """), {"section_id": program_section_id}).fetchall()
                
                logger.info(f"Found {len(filtered_users)} users FILTERED OUT:")
                for u in filtered_users:
                    logger.info(f"  User ID: {u[0]}, Email: {u[1]}, Name: {u[2]} {u[3]}")
                    logger.info(f"    Role: {u[4]}, Active: {u[5]}, Reason: {u[6]}")
            
            # Step 6: Summary
            logger.info(f"\n{'='*60}")
            logger.info(f"SUMMARY")
            logger.info(f"{'='*60}")
            logger.info(f"Program Section ID: {program_section_id}")
            logger.info(f"Total users in section_students: {len(section_students)}")
            logger.info(f"Users with student records: {len(students_with_records)}")
            logger.info(f"Users that WILL be auto-enrolled: {len(auto_enroll_query)}")
            
            if len(auto_enroll_query) == 0:
                logger.error(f"\n❌ NO STUDENTS WILL BE ENROLLED!")
                logger.error(f"This is why quick bulk enroll shows 0 students.")
            else:
                logger.info(f"\n✅ {len(auto_enroll_query)} students should be enrolled.")
            
        except Exception as e:
            logger.error(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    print("\n" + "="*60)
    print("Auto-Enrollment Debug Tool")
    print("="*60)
    
    # Get program section ID from user
    section_id = input("\nEnter Program Section ID to debug: ")
    
    try:
        section_id = int(section_id)
        debug_auto_enrollment(section_id)
    except ValueError:
        print("❌ Invalid ID. Please enter a number.")
