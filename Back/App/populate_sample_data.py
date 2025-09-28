"""
Sample Data Population Script
Populates the database with realistic test data for development
"""

from database.connection import engine
from sqlalchemy import text
import random
from datetime import datetime, timedelta

def populate_sample_data():
    """Populate database with sample data for testing"""
    print("🔄 Populating sample data...")
    
    with engine.connect() as conn:
        
        # 1. Add Departments
        print("Adding departments...")
        departments = [
            ("Computer Science", "Department of Computer Science and Information Technology"),
            ("Engineering", "College of Engineering and Technology"), 
            ("Business Administration", "College of Business and Accountancy"),
            ("Liberal Arts", "College of Arts and Sciences")
        ]
        
        for dept_name, dept_desc in departments:
            conn.execute(text("""
                INSERT INTO departments (name, description, created_at)
                VALUES (:name, :desc, NOW())
                ON CONFLICT (name) DO NOTHING
            """), {"name": dept_name, "desc": dept_desc})
        
        # 2. Add Sample Students
        print("Adding students...")
        programs = ["BSIT", "BSCS", "BSCpE", "BSBA", "BSED", "AB-English"]
        
        for i in range(1, 51):  # 50 students
            conn.execute(text("""
                INSERT INTO students (
                    student_number, first_name, last_name, email, 
                    program, year_level, department_id, is_active, created_at
                ) VALUES (
                    :student_num, :first_name, :last_name, :email,
                    :program, :year_level, 1, true, NOW()
                )
                ON CONFLICT (email) DO NOTHING
            """), {
                "student_num": f"2024-{i:05d}",
                "first_name": f"Student{i}",
                "last_name": f"Test{i}",
                "email": f"student{i}@lpu.edu.ph",
                "program": random.choice(programs),
                "year_level": random.randint(1, 4)
            })
        
        # 3. Add Sample Courses
        print("Adding courses...")
        courses = [
            ("CS101", "Introduction to Programming", "Basic programming concepts and logic", 3, "1st Semester"),
            ("CS201", "Data Structures and Algorithms", "Advanced programming with data structures", 3, "2nd Semester"),
            ("CS301", "Database Systems", "Relational database design and SQL", 3, "1st Semester"),
            ("CS401", "Software Engineering", "Software development lifecycle and methodologies", 3, "2nd Semester"),
            ("MATH101", "College Algebra", "Fundamental algebraic concepts", 3, "1st Semester"),
            ("ENG101", "English Communication", "Written and oral communication skills", 3, "1st Semester"),
            ("PE101", "Physical Education", "Health and fitness activities", 2, "1st Semester"),
            ("HIST101", "Philippine History", "History and culture of the Philippines", 3, "2nd Semester")
        ]
        
        for code, name, desc, credits, semester in courses:
            conn.execute(text("""
                INSERT INTO courses (
                    code, name, description, credits, semester, 
                    academic_year, department_id, created_at
                ) VALUES (
                    :code, :name, :desc, :credits, :semester,
                    '2024-2025', 1, NOW()
                )
                ON CONFLICT (code, academic_year) DO NOTHING
            """), {
                "code": code,
                "name": name, 
                "desc": desc,
                "credits": credits,
                "semester": semester
            })
        
        # 4. Add Sample Evaluations
        print("Adding evaluations...")
        comments = [
            "Great instructor, very clear explanations!",
            "Course content was well-structured and engaging.",
            "Could improve on providing more practical examples.",
            "Excellent teaching methods and student interaction.",
            "The pace was perfect, not too fast or slow.",
            "More hands-on activities would be beneficial.",
            "Very knowledgeable professor with good communication skills.",
            "Course materials were comprehensive and helpful."
        ]
        
        # Get course and student IDs
        course_result = conn.execute(text("SELECT id FROM courses LIMIT 8"))
        course_ids = [row[0] for row in course_result]
        
        student_result = conn.execute(text("SELECT id FROM students LIMIT 50"))
        student_ids = [row[0] for row in student_result]
        
        # Create evaluations (each student evaluates 2-4 courses)
        for student_id in student_ids[:30]:  # 30 students submit evaluations
            num_evaluations = random.randint(2, 4)
            evaluated_courses = random.sample(course_ids, num_evaluations)
            
            for course_id in evaluated_courses:
                teaching_eff = random.randint(3, 5)
                course_content = random.randint(3, 5) 
                learning_env = random.randint(3, 5)
                assessment = random.randint(3, 5)
                instructor_know = random.randint(4, 5)
                
                overall_rating = round((teaching_eff + course_content + learning_env + assessment + instructor_know) / 5, 1)
                
                conn.execute(text("""
                    INSERT INTO evaluations (
                        student_id, course_id, rating, comment,
                        teaching_effectiveness, course_content, learning_environment,
                        assessment_methods, instructor_knowledge, created_at
                    ) VALUES (
                        :student_id, :course_id, :rating, :comment,
                        :teaching_eff, :course_content, :learning_env,
                        :assessment, :instructor_know, :created_at
                    )
                    ON CONFLICT DO NOTHING
                """), {
                    "student_id": student_id,
                    "course_id": course_id,
                    "rating": overall_rating,
                    "comment": random.choice(comments),
                    "teaching_eff": teaching_eff,
                    "course_content": course_content,
                    "learning_env": learning_env,
                    "assessment": assessment,
                    "instructor_know": instructor_know,
                    "created_at": datetime.now() - timedelta(days=random.randint(1, 30))
                })
        
        conn.commit()
        
        # 5. Show Summary
        print("\n✅ Sample data populated successfully!")
        
        # Get counts
        dept_count = conn.execute(text("SELECT COUNT(*) FROM departments")).scalar()
        student_count = conn.execute(text("SELECT COUNT(*) FROM students")).scalar()
        course_count = conn.execute(text("SELECT COUNT(*) FROM courses")).scalar()
        eval_count = conn.execute(text("SELECT COUNT(*) FROM evaluations")).scalar()
        
        print(f"📊 Data Summary:")
        print(f"   • Departments: {dept_count}")
        print(f"   • Students: {student_count}")
        print(f"   • Courses: {course_count}")
        print(f"   • Evaluations: {eval_count}")
        print(f"\n🎯 Ready for testing!")

if __name__ == "__main__":
    try:
        populate_sample_data()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()