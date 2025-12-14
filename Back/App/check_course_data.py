"""
Check course data to verify program_id and year_level
"""
from sqlalchemy import text
from sqlalchemy.orm import Session
from database.connection import engine

def check_courses():
    with Session(engine) as db:
        result = db.execute(text("""
            SELECT 
                c.id,
                c.subject_code,
                c.subject_name,
                c.program_id,
                c.year_level,
                c.semester,
                p.program_code,
                COUNT(DISTINCT cs.id) as section_count
            FROM courses c
            LEFT JOIN programs p ON c.program_id = p.id
            LEFT JOIN class_sections cs ON cs.course_id = c.id
            GROUP BY c.id, c.subject_code, c.subject_name, c.program_id, c.year_level, c.semester, p.program_code
            ORDER BY p.program_code, c.year_level, c.semester, c.subject_code
            LIMIT 50
        """))
        
        courses = result.fetchall()
        
        print("\n" + "="*120)
        print(f"{'ID':<6} {'Code':<15} {'Name':<35} {'Prog ID':<8} {'Program':<12} {'Year':<6} {'Sem':<5} {'Sections':<10}")
        print("="*120)
        
        for c in courses:
            prog_id = str(c[3]) if c[3] else 'NULL'
            year = str(c[4]) if c[4] else 'NULL'
            sem = str(c[5]) if c[5] else 'NULL'
            program = c[6] if c[6] else 'NULL'
            
            print(f"{c[0]:<6} {c[1]:<15} {c[2][:33]:<35} {prog_id:<8} {program:<12} {year:<6} {sem:<5} {c[7]:<10}")
        
        print("="*120)
        print(f"\nTotal: {len(courses)} courses")
        print("\n⚠️  Check if courses have NULL program_id or year_level!")
        print("    Courses with NULL values won't match students in fallback mode.")
        print("="*120)

if __name__ == "__main__":
    check_courses()
