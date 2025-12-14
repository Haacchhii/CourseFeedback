"""
Check the latest class sections created
"""
from sqlalchemy import text
from sqlalchemy.orm import Session
from database.connection import engine

def check_latest():
    with Session(engine) as db:
        result = db.execute(text("""
            SELECT cs.id, cs.class_code, c.subject_code, cs.semester, cs.academic_year, cs.created_at,
                   COUNT(e.id) as enrollments
            FROM class_sections cs
            JOIN courses c ON cs.course_id = c.id
            LEFT JOIN enrollments e ON e.class_section_id = cs.id
            GROUP BY cs.id, cs.class_code, c.subject_code, cs.semester, cs.academic_year, cs.created_at
            ORDER BY cs.id DESC
            LIMIT 20
        """)).fetchall()
        
        print("\n" + "="*120)
        print("Latest 20 Class Sections")
        print("="*120)
        print(f"{'ID':<6} {'Code':<25} {'Subject':<15} {'Sem':<5} {'Year':<12} {'Created':<20} {'Enrollments':<12}")
        print("="*120)
        
        for s in result:
            created = s[5].strftime('%Y-%m-%d %H:%M') if s[5] else 'N/A'
            print(f"{s[0]:<6} {s[1]:<25} {s[2]:<15} {s[3]:<5} {s[4]:<12} {created:<20} {s[6]:<12}")
        
        print("="*120)

if __name__ == "__main__":
    check_latest()
