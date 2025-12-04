"""
Generate test evaluations for students enrolled in active evaluation period
"""
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/course_feedback')
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

def get_active_period(session):
    """Get the currently active evaluation period"""
    query = text("""
        SELECT id, name, semester, academic_year, status
        FROM evaluation_periods
        WHERE status = 'Open'
        ORDER BY created_at DESC
        LIMIT 1
    """)
    result = session.execute(query).fetchone()
    return result

def get_enrolled_sections(session, period_id):
    """Get sections enrolled in the active period (via enrollments table)"""
    query = text("""
        SELECT 
            ps.id as program_section_id,
            ps.section_name,
            p.program_code,
            p.program_name,
            ps.year_level,
            ps.semester,
            COUNT(DISTINCT e.student_id) as student_count
        FROM class_sections cs
        INNER JOIN enrollments e ON cs.id = e.class_section_id
        INNER JOIN program_sections ps ON cs.program_section_id = ps.id
        INNER JOIN programs p ON ps.program_id = p.id
        WHERE e.evaluation_period_id = :period_id
        GROUP BY ps.id, ps.section_name, p.program_code, p.program_name, ps.year_level, ps.semester
        ORDER BY p.program_code, ps.year_level, ps.semester
    """)
    result = session.execute(query, {"period_id": period_id}).fetchall()
    return result

def get_students_in_section(session, program_section_id, period_id):
    """Get students enrolled in a specific section for this period"""
    query = text("""
        SELECT DISTINCT
            s.id as student_id,
            s.student_number,
            u.first_name,
            u.last_name,
            u.email
        FROM enrollments e
        INNER JOIN students s ON e.student_id = s.id
        INNER JOIN users u ON s.user_id = u.id
        INNER JOIN class_sections cs ON e.class_section_id = cs.id
        WHERE cs.program_section_id = :program_section_id
        AND e.evaluation_period_id = :period_id
        ORDER BY u.last_name, u.first_name
    """)
    result = session.execute(query, {"program_section_id": program_section_id, "period_id": period_id}).fetchall()
    return result

def get_class_sections_for_program_section(session, program_section_id):
    """Get class sections (courses with instructors) for a program section"""
    query = text("""
        SELECT 
            cs.id as class_section_id,
            c.course_code,
            c.course_name,
            i.id as instructor_id,
            u.first_name as instructor_first_name,
            u.last_name as instructor_last_name
        FROM class_sections cs
        INNER JOIN courses c ON cs.course_id = c.id
        INNER JOIN instructors i ON cs.instructor_id = i.id
        INNER JOIN users u ON i.user_id = u.id
        WHERE cs.program_section_id = :program_section_id
        ORDER BY c.course_code
    """)
    result = session.execute(query, {"program_section_id": program_section_id}).fetchall()
    return result

def check_existing_evaluation(session, student_id, class_section_id, period_id):
    """Check if evaluation already exists"""
    query = text("""
        SELECT id FROM evaluations
        WHERE student_id = :student_id
        AND class_section_id = :class_section_id
        AND evaluation_period_id = :period_id
    """)
    result = session.execute(query, {
        "student_id": student_id,
        "class_section_id": class_section_id,
        "period_id": period_id
    }).fetchone()
    return result is not None

def create_evaluation(session, student_id, class_section_id, period_id):
    """Create a new evaluation record"""
    query = text("""
        INSERT INTO evaluations (
            student_id, 
            class_section_id, 
            evaluation_period_id, 
            status, 
            created_at, 
            updated_at
        )
        VALUES (
            :student_id, 
            :class_section_id, 
            :period_id, 
            'pending', 
            NOW(), 
            NOW()
        )
        RETURNING id
    """)
    result = session.execute(query, {
        "student_id": student_id,
        "class_section_id": class_section_id,
        "period_id": period_id
    })
    return result.fetchone()[0]

def main():
    session = Session()
    
    try:
        print("=" * 80)
        print("GENERATING TEST EVALUATIONS FOR ACTIVE PERIOD")
        print("=" * 80)
        print()
        
        # Get active period
        active_period = get_active_period(session)
        if not active_period:
            print("❌ No active evaluation period found!")
            return
        
        period_id = active_period[0]
        print(f"✅ Active Period: {active_period[1]}")
        print(f"   Semester: {active_period[2]}")
        print(f"   Academic Year: {active_period[3]}")
        print(f"   Status: {active_period[4]}")
        print()
        
        # Get enrolled sections
        sections = get_enrolled_sections(session, period_id)
        if not sections:
            print("❌ No sections enrolled in this period!")
            return
        
        print(f"📚 Found {len(sections)} enrolled sections:")
        print()
        
        total_evaluations_created = 0
        total_evaluations_existing = 0
        
        for section in sections:
            program_section_id = section[0]
            section_name = section[1]
            program_code = section[2]
            program_name = section[3]
            year_level = section[4]
            semester = section[5]
            student_count = section[6]
            
            print(f"📖 {program_code}-{section_name} ({year_level} - Sem {semester})")
            print(f"   Program: {program_name}")
            print(f"   Students: {student_count}")
            
            # Get students in section
            students = get_students_in_section(session, program_section_id, period_id)
            
            # Get class sections (courses) for this section
            class_sections = get_class_sections_for_program_section(session, program_section_id)
            
            if not class_sections:
                print(f"   ⚠️  No class sections (courses) found for this section!")
                print()
                continue
            
            print(f"   Courses: {len(class_sections)}")
            
            section_created = 0
            section_existing = 0
            
            # Generate evaluations for each student-course combination
            for student in students:
                student_id = student[0]
                student_number = student[1]
                
                for class_section in class_sections:
                    class_section_id = class_section[0]
                    course_code = class_section[1]
                    
                    # Check if evaluation already exists
                    if check_existing_evaluation(session, student_id, class_section_id, period_id):
                        section_existing += 1
                    else:
                        # Create evaluation
                        eval_id = create_evaluation(session, student_id, class_section_id, period_id)
                        section_created += 1
            
            print(f"   ✅ Created: {section_created} evaluations")
            print(f"   ℹ️  Already existed: {section_existing} evaluations")
            print()
            
            total_evaluations_created += section_created
            total_evaluations_existing += section_existing
        
        # Commit all changes
        session.commit()
        
        print("=" * 80)
        print("SUMMARY")
        print("=" * 80)
        print(f"✅ Total evaluations created: {total_evaluations_created}")
        print(f"ℹ️  Total evaluations already existed: {total_evaluations_existing}")
        print(f"📊 Total evaluations: {total_evaluations_created + total_evaluations_existing}")
        print()
        print("✅ Test evaluations generated successfully!")
        
    except Exception as e:
        session.rollback()
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

if __name__ == "__main__":
    main()
