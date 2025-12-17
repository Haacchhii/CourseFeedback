"""
Diagnostic script to check why students don't appear in non-respondents list.
Run this script to identify missing data for student enrollments.

Usage:
    python diagnose_non_respondents.py [program_code]
    
Example:
    python diagnose_non_respondents.py BSCYBER
    python diagnose_non_respondents.py  # Check all programs
"""

from database.connection import SessionLocal
from sqlalchemy import text
import sys

def diagnose_non_respondents(program_code=None):
    db = SessionLocal()
    
    print("=" * 70)
    print("NON-RESPONDENTS DIAGNOSTIC REPORT")
    print("=" * 70)
    
    # 1. Check active evaluation period
    print("\n📅 STEP 1: Active Evaluation Period")
    print("-" * 50)
    period = db.execute(text("""
        SELECT id, name, status, start_date, end_date 
        FROM evaluation_periods 
        WHERE status = 'active' 
        LIMIT 1
    """)).fetchone()
    
    if period:
        print(f"✅ Active period found: ID={period[0]}, Name='{period[1]}'")
        print(f"   Status: {period[2]}, Dates: {period[3]} to {period[4]}")
        period_id = period[0]
    else:
        print("❌ NO ACTIVE EVALUATION PERIOD FOUND!")
        print("   This is required for students to appear in non-respondents.")
        db.close()
        return
    
    # 2. Check programs
    print("\n🎓 STEP 2: Programs")
    print("-" * 50)
    if program_code:
        programs = db.execute(text("""
            SELECT id, program_code, program_name FROM programs WHERE program_code = :code
        """), {"code": program_code}).fetchall()
    else:
        programs = db.execute(text("""
            SELECT id, program_code, program_name FROM programs ORDER BY program_code
        """)).fetchall()
    
    if not programs:
        print(f"❌ No programs found{' for code: ' + program_code if program_code else ''}")
        db.close()
        return
    
    for prog in programs:
        print(f"  • {prog[1]}: {prog[2]} (ID: {prog[0]})")
    
    # 3. For each program, check students
    for prog_id, prog_code, prog_name in programs:
        print(f"\n{'=' * 70}")
        print(f"📋 PROGRAM: {prog_code} - {prog_name}")
        print("=" * 70)
        
        # 3a. Count students in this program
        students = db.execute(text("""
            SELECT s.id, s.student_number, u.first_name, u.last_name, u.email, u.is_active, s.year_level
            FROM students s
            JOIN users u ON s.user_id = u.id
            WHERE s.program_id = :program_id
            ORDER BY s.student_number
        """), {"program_id": prog_id}).fetchall()
        
        print(f"\n👥 Students in program: {len(students)}")
        
        if not students:
            print("   ⚠️ No students found in this program")
            continue
        
        # Show first 10 students
        for i, s in enumerate(students[:10]):
            active_status = "✅" if s[5] else "❌"
            print(f"   {active_status} {s[1]}: {s[2]} {s[3]} (Year {s[6]})")
        if len(students) > 10:
            print(f"   ... and {len(students) - 10} more students")
        
        # 3b. Check section_students assignments
        print(f"\n📌 Section Assignments (section_students):")
        section_students = db.execute(text("""
            SELECT ss.student_id, ps.section_name, ps.program_id
            FROM section_students ss
            JOIN program_sections ps ON ss.section_id = ps.id
            JOIN students s ON ss.student_id = s.id
            WHERE s.program_id = :program_id
        """), {"program_id": prog_id}).fetchall()
        
        if section_students:
            print(f"   ✅ {len(section_students)} student-section assignments found")
            sections = {}
            for ss in section_students:
                section_name = ss[1]
                if section_name not in sections:
                    sections[section_name] = 0
                sections[section_name] += 1
            for sec, count in sections.items():
                print(f"      • {sec}: {count} students")
        else:
            print("   ⚠️ NO students assigned to program sections!")
            print("      FIX: Go to Admin → Program Sections → Add Students")
        
        # 3c. Check enrollments
        print(f"\n📚 Course Enrollments (enrollments table):")
        enrollments = db.execute(text("""
            SELECT 
                e.student_id, 
                e.class_section_id, 
                e.evaluation_period_id,
                e.status,
                cs.class_code,
                c.subject_code
            FROM enrollments e
            JOIN students s ON e.student_id = s.id
            JOIN class_sections cs ON e.class_section_id = cs.id
            JOIN courses c ON cs.course_id = c.id
            WHERE s.program_id = :program_id
            ORDER BY e.student_id, c.subject_code
        """), {"program_id": prog_id}).fetchall()
        
        if enrollments:
            print(f"   ✅ {len(enrollments)} enrollments found")
            
            # Count by period status
            with_period = sum(1 for e in enrollments if e[2] == period_id)
            null_period = sum(1 for e in enrollments if e[2] is None)
            other_period = sum(1 for e in enrollments if e[2] is not None and e[2] != period_id)
            
            print(f"      • Linked to active period ({period_id}): {with_period}")
            print(f"      • No period (NULL): {null_period}")
            print(f"      • Other periods: {other_period}")
            
            if with_period == 0 and null_period == 0:
                print("\n   ⚠️ No enrollments for the active period!")
                print("      FIX: Go to Evaluation Period Management → Enroll Program Section")
        else:
            print("   ❌ NO ENROLLMENTS FOUND!")
            print("      Students must be enrolled in class sections to appear in non-respondents.")
            print("\n   💡 To fix this:")
            print("      1. Ensure students are in a Program Section")
            print("      2. Ensure students are enrolled in Class Sections")
            print("      3. Enroll the Program Section in the Evaluation Period")
        
        # 3d. Check if any evaluations exist
        print(f"\n📝 Evaluations for period {period_id}:")
        evals = db.execute(text("""
            SELECT COUNT(*) 
            FROM evaluations ev
            JOIN students s ON ev.student_id = s.id
            WHERE s.program_id = :program_id
            AND ev.evaluation_period_id = :period_id
        """), {"program_id": prog_id, "period_id": period_id}).scalar()
        
        print(f"   Total evaluation records: {evals}")
        
        # 3e. Check what the non-respondents query would return
        print(f"\n🔍 Non-Respondents Query Result:")
        non_resp = db.execute(text("""
            SELECT DISTINCT s.id, s.student_number, u.first_name, u.last_name
            FROM students s
            JOIN users u ON s.user_id = u.id
            JOIN enrollments e ON s.id = e.student_id
            WHERE s.program_id = :program_id
            AND u.is_active = true
            AND (e.evaluation_period_id = :period_id OR e.evaluation_period_id IS NULL)
        """), {"program_id": prog_id, "period_id": period_id}).fetchall()
        
        if non_resp:
            print(f"   ✅ {len(non_resp)} students would appear in non-respondents")
        else:
            print("   ❌ NO students would appear in non-respondents!")
            print("\n   🔧 ROOT CAUSE: Students don't have enrollments linked to the active period")
    
    # Final summary
    print("\n" + "=" * 70)
    print("📊 SUMMARY & RECOMMENDED ACTIONS")
    print("=" * 70)
    print("""
If students are not appearing in non-respondents:

1. ✅ Create students via User Management (you've done this)

2. ➡️  Assign students to a Program Section:
   Admin → Program Sections → [Select Section] → Add Students

3. ➡️  Enroll students in Class Sections:
   Admin → Course Management → [Select Course] → Create Section → Enroll Students
   OR use bulk enrollment features

4. ➡️  Link Program Section to Evaluation Period:
   Admin → Evaluation Period Management → [Select Period] → Enroll Program Section
   
This will:
   - Update enrollments.evaluation_period_id
   - Create pending evaluation records
   - Make students appear in non-respondents list
""")
    
    db.close()

if __name__ == "__main__":
    program_code = sys.argv[1] if len(sys.argv) > 1 else None
    diagnose_non_respondents(program_code)
