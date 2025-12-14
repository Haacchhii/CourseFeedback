"""
List all program sections with student counts
"""
from sqlalchemy import text
from sqlalchemy.orm import Session
from database.connection import engine

def list_program_sections():
    with Session(engine) as db:
        result = db.execute(text("""
            SELECT 
                ps.id,
                ps.section_name,
                p.program_code,
                ps.year_level,
                ps.semester,
                ps.school_year,
                COUNT(ss.id) as student_count,
                COUNT(CASE WHEN s.id IS NOT NULL THEN 1 END) as with_student_record
            FROM program_sections ps
            LEFT JOIN programs p ON ps.program_id = p.id
            LEFT JOIN section_students ss ON ss.section_id = ps.id
            LEFT JOIN users u ON ss.student_id = u.id
            LEFT JOIN students s ON s.user_id = u.id
            WHERE ps.is_active = true
            GROUP BY ps.id, ps.section_name, p.program_code, ps.year_level, ps.semester, ps.school_year
            ORDER BY ps.id
        """))
        
        sections = result.fetchall()
        
        print("\n" + "="*100)
        print(f"{'ID':<6} {'Section':<15} {'Program':<10} {'Year':<6} {'Sem':<5} {'School Year':<12} {'Users':<8} {'With Record':<12}")
        print("="*100)
        
        for s in sections:
            print(f"{s[0]:<6} {s[1]:<15} {s[2]:<10} {s[3]:<6} {s[4]:<5} {s[5]:<12} {s[6]:<8} {s[7]:<12}")
        
        print("="*100)
        print(f"\nTotal: {len(sections)} active program sections")
        print("\nLegend:")
        print("  Users: Total users assigned to this section")
        print("  With Record: Users who have 'students' table records (can be auto-enrolled)")
        print("\nTo debug a specific section, run: python debug_auto_enroll.py")
        print("="*100)

if __name__ == "__main__":
    list_program_sections()
