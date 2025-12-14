"""
Check if students are already enrolled in recent sections
"""
from sqlalchemy import text
from sqlalchemy.orm import Session
from database.connection import engine

def check_enrollments():
    with Session(engine) as db:
        # Get recent sections (IDs 295-303 from your logs)
        print("\n" + "="*100)
        print("Recent Class Sections (295-303)")
        print("="*100)
        
        sections = db.execute(text("""
            SELECT cs.id, cs.class_code, c.subject_code, cs.semester, cs.academic_year,
                   COUNT(e.id) as enrollment_count
            FROM class_sections cs
            JOIN courses c ON cs.course_id = c.id
            LEFT JOIN enrollments e ON e.class_section_id = cs.id
            WHERE cs.id BETWEEN 295 AND 303
            GROUP BY cs.id, cs.class_code, c.subject_code, cs.semester, cs.academic_year
            ORDER BY cs.id
        """)).fetchall()
        
        for s in sections:
            print(f"Section {s[0]}: {s[1]} ({s[2]}) - {s[4]} Sem {s[3]} - Enrollments: {s[5]}")
        
        # Check students from program section 48
        print("\n" + "="*100)
        print("Students in Program Section 48 (BSIT 1-A)")
        print("="*100)
        
        students = db.execute(text("""
            SELECT s.id, u.email, u.first_name, u.last_name,
                   COUNT(e.id) as total_enrollments,
                   COUNT(CASE WHEN cs.id BETWEEN 295 AND 303 THEN 1 END) as recent_enrollments
            FROM section_students ss
            JOIN users u ON ss.student_id = u.id
            JOIN students s ON s.user_id = u.id
            LEFT JOIN enrollments e ON e.student_id = s.id
            LEFT JOIN class_sections cs ON e.class_section_id = cs.id
            WHERE ss.section_id = 48
            GROUP BY s.id, u.email, u.first_name, u.last_name
        """)).fetchall()
        
        for st in students:
            print(f"Student {st[0]}: {st[2]} {st[3]} ({st[1]})")
            print(f"  Total enrollments: {st[4]}, Recent (295-303): {st[5]}")
        
        # Detailed enrollment check
        print("\n" + "="*100)
        print("Detailed Enrollment Check for Section 48 Students")
        print("="*100)
        
        details = db.execute(text("""
            SELECT s.id as student_id, u.first_name, u.last_name,
                   cs.id as section_id, cs.class_code, c.subject_code,
                   e.status, e.enrolled_at
            FROM section_students ss
            JOIN users u ON ss.student_id = u.id
            JOIN students s ON s.user_id = u.id
            LEFT JOIN enrollments e ON e.student_id = s.id
            LEFT JOIN class_sections cs ON e.class_section_id = cs.id
            LEFT JOIN courses c ON cs.course_id = c.id
            WHERE ss.section_id = 48
            AND (cs.id IS NULL OR cs.id BETWEEN 295 AND 303)
            ORDER BY s.id, cs.id
        """)).fetchall()
        
        current_student = None
        for d in details:
            if d[0] != current_student:
                current_student = d[0]
                print(f"\nStudent {d[0]}: {d[1]} {d[2]}")
            
            if d[3] is None:
                print(f"  No recent enrollments")
            else:
                print(f"  Section {d[3]}: {d[4]} ({d[5]}) - Status: {d[6]}, Enrolled: {d[7]}")

if __name__ == "__main__":
    check_enrollments()
