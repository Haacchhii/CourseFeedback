"""
Fix script to create missing enrollments for students in a program section.
This script will:
1. Find students assigned to program sections
2. Create enrollments for their courses (based on their program)
3. Link enrollments to the active evaluation period

Usage:
    python fix_missing_enrollments.py [program_code]
    
Example:
    python fix_missing_enrollments.py BSCYBER
    python fix_missing_enrollments.py  # Fix all programs
"""

from database.connection import SessionLocal
from sqlalchemy import text
import sys

def fix_missing_enrollments(program_code=None):
    db = SessionLocal()
    
    print("=" * 70)
    print("FIX MISSING ENROLLMENTS")
    print("=" * 70)
    
    # 1. Get active evaluation period
    period = db.execute(text("""
        SELECT id, name FROM evaluation_periods WHERE status = 'active' LIMIT 1
    """)).fetchone()
    
    if not period:
        print("❌ No active evaluation period. Cannot proceed.")
        db.close()
        return
    
    period_id = period[0]
    print(f"✅ Using active period: {period[1]} (ID: {period_id})")
    
    # 2. Get programs to fix
    if program_code:
        programs = db.execute(text("""
            SELECT id, program_code, program_name FROM programs WHERE program_code = :code
        """), {"code": program_code}).fetchall()
    else:
        programs = db.execute(text("SELECT id, program_code, program_name FROM programs")).fetchall()
    
    total_enrollments_created = 0
    
    for prog_id, prog_code, prog_name in programs:
        print(f"\n📋 Processing: {prog_code} - {prog_name}")
        
        # 3. Find students in this program who are assigned to program sections
        students = db.execute(text("""
            SELECT DISTINCT s.id, s.student_number, u.first_name, u.last_name
            FROM students s
            JOIN users u ON s.user_id = u.id
            JOIN section_students ss ON s.id = ss.student_id
            WHERE s.program_id = :program_id
            AND u.is_active = true
        """), {"program_id": prog_id}).fetchall()
        
        if not students:
            print(f"   ⚠️ No students in program sections")
            continue
        
        print(f"   Found {len(students)} students in program sections")
        
        # 4. Find class sections for this program's courses
        class_sections = db.execute(text("""
            SELECT DISTINCT cs.id, c.subject_code, cs.class_code
            FROM class_sections cs
            JOIN courses c ON cs.course_id = c.id
            WHERE c.program_id = :program_id
            AND cs.status = 'active'
        """), {"program_id": prog_id}).fetchall()
        
        if not class_sections:
            print(f"   ⚠️ No active class sections for this program's courses")
            continue
        
        print(f"   Found {len(class_sections)} active class sections")
        
        # 5. Create missing enrollments
        enrollments_created = 0
        for student in students:
            student_id = student[0]
            
            for cs in class_sections:
                cs_id = cs[0]
                
                # Check if enrollment already exists
                existing = db.execute(text("""
                    SELECT id FROM enrollments 
                    WHERE student_id = :student_id 
                    AND class_section_id = :cs_id
                """), {"student_id": student_id, "cs_id": cs_id}).fetchone()
                
                if not existing:
                    # Create enrollment
                    db.execute(text("""
                        INSERT INTO enrollments (student_id, class_section_id, evaluation_period_id, status, enrolled_at)
                        VALUES (:student_id, :cs_id, :period_id, 'active', NOW())
                    """), {
                        "student_id": student_id,
                        "cs_id": cs_id,
                        "period_id": period_id
                    })
                    enrollments_created += 1
                else:
                    # Update existing enrollment to link to period if NULL
                    db.execute(text("""
                        UPDATE enrollments 
                        SET evaluation_period_id = :period_id
                        WHERE student_id = :student_id 
                        AND class_section_id = :cs_id
                        AND evaluation_period_id IS NULL
                    """), {
                        "student_id": student_id,
                        "cs_id": cs_id,
                        "period_id": period_id
                    })
        
        db.commit()
        print(f"   ✅ Created {enrollments_created} new enrollments")
        total_enrollments_created += enrollments_created
        
        # 6. Also create pending evaluation records
        print("   Creating pending evaluation records...")
        result = db.execute(text("""
            INSERT INTO evaluations (student_id, class_section_id, evaluation_period_id, status, created_at)
            SELECT DISTINCT e.student_id, e.class_section_id, :period_id, 'pending', NOW()
            FROM enrollments e
            JOIN students s ON e.student_id = s.id
            WHERE s.program_id = :program_id
            AND e.evaluation_period_id = :period_id
            AND NOT EXISTS (
                SELECT 1 FROM evaluations ev
                WHERE ev.student_id = e.student_id
                AND ev.class_section_id = e.class_section_id
                AND ev.evaluation_period_id = :period_id
            )
            RETURNING id
        """), {"program_id": prog_id, "period_id": period_id})
        
        evals_created = len(result.fetchall())
        db.commit()
        print(f"   ✅ Created {evals_created} pending evaluation records")
    
    print("\n" + "=" * 70)
    print(f"✅ COMPLETED: Created {total_enrollments_created} total enrollments")
    print("=" * 70)
    print("\nStudents should now appear in the Non-Respondents page.")
    
    db.close()

if __name__ == "__main__":
    program_code = sys.argv[1] if len(sys.argv) > 1 else None
    fix_missing_enrollments(program_code)
