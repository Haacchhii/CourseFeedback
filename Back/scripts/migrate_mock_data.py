"""
Data Migration Script
Migrates mock data from capstone frontend to PostgreSQL database
Run this after setting up Firebase and PostgreSQL
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import get_raw_connection
from config.firebase_config import FirebaseAuth
import bcrypt

# Mock data from your capstone project
mock_students = [
    {"email": "maria.santos.bsit1@lpubatangas.edu.ph", "name": "Maria Santos", "program": "BSIT", "year_level": 1},
    {"email": "juan.dela.cruz.bsit2@lpubatangas.edu.ph", "name": "Juan Dela Cruz", "program": "BSIT", "year_level": 2},
    {"email": "ana.reyes.bsit3@lpubatangas.edu.ph", "name": "Ana Reyes", "program": "BSIT", "year_level": 3},
    {"email": "carlos.garcia.bsit4@lpubatangas.edu.ph", "name": "Carlos Garcia", "program": "BSIT", "year_level": 4},
    {"email": "sophia.martinez.bscsds1@lpubatangas.edu.ph", "name": "Sophia Martinez", "program": "BSCS-DS", "year_level": 1},
    {"email": "miguel.lopez.bscsds2@lpubatangas.edu.ph", "name": "Miguel Lopez", "program": "BSCS-DS", "year_level": 2},
    {"email": "isabella.torres.bscsds3@lpubatangas.edu.ph", "name": "Isabella Torres", "program": "BSCS-DS", "year_level": 3},
    {"email": "daniel.rivera.bscs1@lpubatangas.edu.ph", "name": "Daniel Rivera", "program": "BSCS", "year_level": 1},
    {"email": "camila.flores.bscs2@lpubatangas.edu.ph", "name": "Camila Flores", "program": "BSCS", "year_level": 2},
    {"email": "alex.morales.bscs3@lpubatangas.edu.ph", "name": "Alex Morales", "program": "BSCS", "year_level": 3},
    {"email": "lucas.hernandez.bscy1@lpubatangas.edu.ph", "name": "Lucas Hernandez", "program": "BSCY", "year_level": 1},
    {"email": "maya.cruz.bscy2@lpubatangas.edu.ph", "name": "Maya Cruz", "program": "BSCY", "year_level": 2},
    {"email": "ethan.ramos.bscy3@lpubatangas.edu.ph", "name": "Ethan Ramos", "program": "BSCY", "year_level": 3},
    {"email": "zoe.valdez.bma1@lpubatangas.edu.ph", "name": "Zoe Valdez", "program": "BMA", "year_level": 1},
    {"email": "ryan.perez.bma2@lpubatangas.edu.ph", "name": "Ryan Perez", "program": "BMA", "year_level": 2},
    {"email": "luna.castillo.bma3@lpubatangas.edu.ph", "name": "Luna Castillo", "program": "BMA", "year_level": 3},
    {"email": "diego.mendoza.bma4@lpubatangas.edu.ph", "name": "Diego Mendoza", "program": "BMA", "year_level": 4}
]

mock_department_heads = [
    {"email": "melodydimaano@lpubatangas.edu.ph", "name": "Melody Dimaano", "department": "Computer Science"}
]

mock_courses = [
    # BSIT Courses
    {"courseCode": "BSIT101", "courseName": "Introduction to Computing", "classCode": "ITCO-1001-A", "instructor": "Dr. Maria Santos", "semester": "First Semester 2025", "program": "BSIT", "year_level": 1},
    {"courseCode": "BSIT102", "courseName": "Computer Programming 1", "classCode": "CPRO-1001-A", "instructor": "Prof. Juan Carlos", "semester": "First Semester 2025", "program": "BSIT", "year_level": 1},
    {"courseCode": "BSIT201", "courseName": "Data Structures and Algorithms", "classCode": "DSAL-2001-A", "instructor": "Dr. Alex Morales", "semester": "First Semester 2025", "program": "BSIT", "year_level": 2},
    {"courseCode": "BSIT301", "courseName": "Information Management", "classCode": "INFM-3001-A", "instructor": "Dr. Elena Rodriguez", "semester": "First Semester 2025", "program": "BSIT", "year_level": 3},
    {"courseCode": "BSIT401", "courseName": "Applications Development and Emerging Technologies", "classCode": "ADET-4001-A", "instructor": "Dr. Patricia Moreno", "semester": "First Semester 2025", "program": "BSIT", "year_level": 4},
    
    # BSCS-DS Courses
    {"courseCode": "CSDS101", "courseName": "Introduction to Computing", "classCode": "ITCO-1001-B", "instructor": "Dr. Maria Santos", "semester": "First Semester 2025", "program": "BSCS-DS", "year_level": 1},
    {"courseCode": "CSDS201", "courseName": "Systems Analysis and Design", "classCode": "SYAN-2001-B", "instructor": "Prof. Luna Castillo", "semester": "First Semester 2025", "program": "BSCS-DS", "year_level": 2},
    {"courseCode": "CSDS205", "courseName": "Computational Statistics", "classCode": "STAT-2002-A", "instructor": "Dr. Ricardo Delgado", "semester": "Second Semester 2025", "program": "BSCS-DS", "year_level": 2},
    
    # Add more courses as needed...
]

def migrate_data():
    """Main migration function"""
    print("🚀 Starting data migration...")
    
    try:
        conn = get_raw_connection()
        cursor = conn.cursor()
        
        # 1. Migrate Department Heads
        print("👥 Migrating department heads...")
        for head in mock_department_heads:
            try:
                # Hash password
                password_hash = bcrypt.hashpw("changeme".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                
                # Create Firebase user
                firebase_user = FirebaseAuth.create_user(
                    email=head['email'],
                    password="changeme",
                    display_name=head['name']
                )
                
                # Insert user
                cursor.execute(
                    "INSERT INTO users (email, password_hash, role, firebase_uid) VALUES (%s, %s, %s, %s) RETURNING id",
                    (head['email'], password_hash, 'department_head', firebase_user.uid if firebase_user else None)
                )
                user_id = cursor.fetchone()['id']
                
                # Insert department head
                first_name, last_name = head['name'].split(' ', 1)
                cursor.execute(
                    "INSERT INTO department_heads (user_id, first_name, last_name, department, programs) VALUES (%s, %s, %s, %s, %s)",
                    (user_id, first_name, last_name, head['department'], [1, 2, 3, 4, 5])  # All programs
                )
                
                print(f"✅ Created department head: {head['email']}")
                
            except Exception as e:
                print(f"❌ Failed to create department head {head['email']}: {e}")
        
        # 2. Migrate Students
        print("🎓 Migrating students...")
        for student in mock_students:
            try:
                # Hash password
                password_hash = bcrypt.hashpw("changeme".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                
                # Create Firebase user
                firebase_user = FirebaseAuth.create_user(
                    email=student['email'],
                    password="changeme",
                    display_name=student['name']
                )
                
                # Insert user
                cursor.execute(
                    "INSERT INTO users (email, password_hash, role, firebase_uid) VALUES (%s, %s, %s, %s) RETURNING id",
                    (student['email'], password_hash, 'student', firebase_user.uid if firebase_user else None)
                )
                user_id = cursor.fetchone()['id']
                
                # Get program ID
                cursor.execute("SELECT id FROM programs WHERE code = %s", (student['program'],))
                program_result = cursor.fetchone()
                if not program_result:
                    print(f"⚠️ Program {student['program']} not found, skipping student {student['email']}")
                    continue
                program_id = program_result['id']
                
                # Insert student
                first_name, last_name = student['name'].split(' ', 1)
                student_id = student['email'].split('@')[0]  # Use email prefix as student ID
                
                cursor.execute(
                    "INSERT INTO students (user_id, student_id, first_name, last_name, program_id, year_level) VALUES (%s, %s, %s, %s, %s, %s)",
                    (user_id, student_id, first_name, last_name, program_id, student['year_level'])
                )
                
                print(f"✅ Created student: {student['email']}")
                
            except Exception as e:
                print(f"❌ Failed to create student {student['email']}: {e}")
        
        # 3. Migrate Courses and Class Sections
        print("📚 Migrating courses...")
        for course in mock_courses:
            try:
                # Get program ID
                cursor.execute("SELECT id FROM programs WHERE code = %s", (course['program'],))
                program_result = cursor.fetchone()
                if not program_result:
                    print(f"⚠️ Program {course['program']} not found, skipping course {course['courseCode']}")
                    continue
                program_id = program_result['id']
                
                # Insert course
                semester_num = 1 if 'First' in course['semester'] else 2
                cursor.execute(
                    """INSERT INTO courses (course_code, course_name, program_id, year_level, semester) 
                       VALUES (%s, %s, %s, %s, %s) 
                       ON CONFLICT (course_code) DO NOTHING RETURNING id""",
                    (course['courseCode'], course['courseName'], program_id, course['year_level'], semester_num)
                )
                
                result = cursor.fetchone()
                if result:
                    course_id = result['id']
                else:
                    cursor.execute("SELECT id FROM courses WHERE course_code = %s", (course['courseCode'],))
                    course_id = cursor.fetchone()['id']
                
                # Insert class section
                cursor.execute(
                    """INSERT INTO class_sections (course_id, class_code, instructor_name, semester, academic_year) 
                       VALUES (%s, %s, %s, %s, %s) 
                       ON CONFLICT (class_code) DO NOTHING""",
                    (course_id, course['classCode'], course['instructor'], course['semester'], '2024-2025')
                )
                
                print(f"✅ Created course: {course['courseCode']} - {course['courseName']}")
                
            except Exception as e:
                print(f"❌ Failed to create course {course['courseCode']}: {e}")
        
        # Commit all changes
        conn.commit()
        print("✅ Data migration completed successfully!")
        
        # Print summary
        cursor.execute("SELECT COUNT(*) as count FROM users WHERE role = 'student'")
        student_count = cursor.fetchone()['count']
        cursor.execute("SELECT COUNT(*) as count FROM users WHERE role = 'department_head'")
        head_count = cursor.fetchone()['count']
        cursor.execute("SELECT COUNT(*) as count FROM courses")
        course_count = cursor.fetchone()['count']
        
        print(f"\n📊 Migration Summary:")
        print(f"   - Students: {student_count}")
        print(f"   - Department Heads: {head_count}")
        print(f"   - Courses: {course_count}")
        
    except Exception as e:
        if 'conn' in locals():
            conn.rollback()
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    migrate_data()
