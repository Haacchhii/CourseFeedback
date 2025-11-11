"""
Setup Sample Data - Class Sections and Enrollments
Creates realistic test data for the system
"""

import sys
from database.connection import engine
from sqlalchemy import text
from datetime import datetime

def setup_sample_data():
    """Create class sections and enrollments"""
    
    print("=" * 70)
    print("CREATING SAMPLE DATA")
    print("=" * 70)
    
    with engine.connect() as conn:
        trans = conn.begin()
        
        try:
            # Get instructor IDs
            instructors = conn.execute(text("""
                SELECT id, first_name, last_name, department
                FROM users
                WHERE role = 'instructor'
                ORDER BY id
            """)).fetchall()
            
            print(f"\n📚 Found {len(instructors)} instructors")
            
            # Get courses
            courses = conn.execute(text("""
                SELECT id, subject_code, subject_name, program_id, year_level, semester
                FROM courses
                WHERE year_level IN (1, 2, 3)
                LIMIT 20
            """)).fetchall()
            
            print(f"📖 Found {len(courses)} courses to assign")
            
            # Create class sections
            print("\n🏫 Creating class sections...")
            class_section_ids = []
            
            for i, course in enumerate(courses[:15]):  # Create 15 class sections
                instructor = instructors[i % len(instructors)]
                
                # Parse semester (convert "First Semester" to "1st Sem", etc.)
                semester_value = course.semester if course.semester else "1st Semester"
                
                result = conn.execute(text("""
                    INSERT INTO class_sections 
                    (course_id, instructor_id, class_code, semester, academic_year, max_students)
                    VALUES (:course_id, :instructor_id, :class_code, :semester, :academic_year, 40)
                    RETURNING id
                """), {
                    'course_id': course.id,
                    'instructor_id': instructor.id,
                    'class_code': f"{course.subject_code}-A",
                    'semester': semester_value,
                    'academic_year': '2024-2025'
                })
                
                section_id = result.scalar()
                class_section_ids.append(section_id)
                
                print(f"  ✓ {course.subject_code}-A: {course.subject_name}")
                print(f"    Instructor: {instructor.first_name} {instructor.last_name}")
            
            # Get students
            students = conn.execute(text("""
                SELECT id, student_number, year_level, program_id
                FROM students
                ORDER BY id
            """)).fetchall()
            
            print(f"\n👥 Found {students} students")
            
            # Create enrollments (each student enrolls in 3-5 classes)
            print("\n📝 Creating enrollments...")
            enrollment_count = 0
            
            for student in students:
                # Select appropriate class sections based on year level
                sections_for_year = [
                    sid for sid, course in zip(class_section_ids, courses[:15])
                    if course.year_level <= student.year_level
                ]
                
                # Enroll in first 4 sections
                for section_id in sections_for_year[:4]:
                    try:
                        conn.execute(text("""
                            INSERT INTO enrollments (student_id, class_section_id, status)
                            VALUES (:student_id, :section_id, 'active')
                        """), {
                            'student_id': student.id,
                            'section_id': section_id
                        })
                        enrollment_count += 1
                    except Exception:
                        pass  # Skip duplicates
            
            print(f"  ✓ Created {enrollment_count} enrollments")
            
            # Create an active evaluation period
            print("\n📅 Creating evaluation period...")
            
            conn.execute(text("""
                INSERT INTO evaluation_periods 
                (name, semester, academic_year, start_date, end_date, status, total_students, completed_evaluations)
                VALUES 
                (:name, :semester, :academic_year, :start_date, :end_date, 'active', :total_students, 0)
                ON CONFLICT DO NOTHING
            """), {
                'name': 'First Semester Evaluation 2024-2025',
                'semester': 'First Semester',
                'academic_year': '2024-2025',
                'start_date': '2024-09-01',
                'end_date': '2025-01-31',
                'total_students': len(students)
            })
            
            print("  ✓ Evaluation period created")
            
            # Commit
            trans.commit()
            
            print("\n" + "=" * 70)
            print("✅ SAMPLE DATA CREATED SUCCESSFULLY")
            print("=" * 70)
            
            # Show summary
            print("\n📊 DATA SUMMARY:")
            print("-" * 70)
            
            counts = {
                'class_sections': conn.execute(text("SELECT COUNT(*) FROM class_sections")).scalar(),
                'enrollments': conn.execute(text("SELECT COUNT(*) FROM enrollments")).scalar(),
                'evaluation_periods': conn.execute(text("SELECT COUNT(*) FROM evaluation_periods")).scalar()
            }
            
            print(f"Class Sections: {counts['class_sections']}")
            print(f"Enrollments: {counts['enrollments']}")
            print(f"Evaluation Periods: {counts['evaluation_periods']}")
            print("-" * 70)
            
            return True
            
        except Exception as e:
            trans.rollback()
            print(f"\n❌ ERROR: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    try:
        success = setup_sample_data()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
