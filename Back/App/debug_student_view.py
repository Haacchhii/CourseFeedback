"""
Debug script to trace why students aren't seeing evaluations
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from database.connection import get_db

def debug_student_view(student_user_id=11):
    """Debug what a specific student should see"""
    db = next(get_db())
    
    try:
        print(f"\n{'='*60}")
        print(f"DEBUGGING STUDENT VIEW FOR USER ID: {student_user_id}")
        print(f"{'='*60}\n")
        
        # Step 1: Get student record
        print("STEP 1: Finding student record...")
        student = db.execute(text("""
            SELECT s.id, s.user_id, s.student_number, s.program_id, s.year_level,
                   u.email, u.first_name, u.last_name
            FROM students s
            JOIN users u ON s.user_id = u.id
            WHERE s.user_id = :user_id OR s.id = :user_id
        """), {"user_id": student_user_id}).fetchone()
        
        if not student:
            print(f"❌ No student found for user_id={student_user_id}")
            return
        
        student_id = student[0]
        print(f"✅ Found student:")
        print(f"   - Student ID: {student_id}")
        print(f"   - User ID: {student[1]}")
        print(f"   - Name: {student[6]} {student[7]}")
        print(f"   - Email: {student[5]}")
        print(f"   - Program ID: {student[3]}, Year Level: {student[4]}")
        
        # Step 2: Check active evaluation period
        print(f"\nSTEP 2: Checking active evaluation period...")
        period = db.execute(text("""
            SELECT id, name, start_date, end_date, status
            FROM evaluation_periods
            WHERE status = 'Open'
            AND CURRENT_DATE BETWEEN start_date AND end_date
        """)).fetchone()
        
        if not period:
            print("❌ No active evaluation period found")
            return
        
        period_id = period[0]
        print(f"✅ Active period: {period[1]} (ID: {period_id})")
        print(f"   - Status: {period[4]}")
        print(f"   - Dates: {period[2]} to {period[3]}")
        
        # Step 3: Check enrollments
        print(f"\nSTEP 3: Checking student enrollments...")
        enrollments = db.execute(text("""
            SELECT e.id, e.class_section_id, e.evaluation_period_id, e.status,
                   cs.class_code, c.subject_code, c.subject_name
            FROM enrollments e
            JOIN class_sections cs ON e.class_section_id = cs.id
            JOIN courses c ON cs.course_id = c.id
            WHERE e.student_id = :student_id
        """), {"student_id": student_id}).fetchall()
        
        print(f"Found {len(enrollments)} total enrollments:")
        for enr in enrollments:
            print(f"   - {enr[5]} {enr[6]} ({enr[4]})")
            print(f"     Enrollment ID: {enr[0]}, Section ID: {enr[1]}")
            print(f"     Period ID: {enr[2]}, Status: {enr[3]}")
        
        # Step 4: Check which enrollments match the active period
        print(f"\nSTEP 4: Enrollments linked to active period {period_id}...")
        active_enrollments = db.execute(text("""
            SELECT e.id, e.class_section_id, cs.class_code, c.subject_code, c.subject_name
            FROM enrollments e
            JOIN class_sections cs ON e.class_section_id = cs.id
            JOIN courses c ON cs.course_id = c.id
            WHERE e.student_id = :student_id
            AND e.evaluation_period_id = :period_id
            AND e.status = 'active'
        """), {"student_id": student_id, "period_id": period_id}).fetchall()
        
        if not active_enrollments:
            print(f"❌ No enrollments linked to period {period_id}")
            print(f"\n💡 PROBLEM: Student's enrollments don't have evaluation_period_id = {period_id}")
            print(f"   This means the admin hasn't enrolled this student's program section yet!")
        else:
            print(f"✅ Found {len(active_enrollments)} enrollments in active period:")
            for enr in active_enrollments:
                print(f"   - {enr[3]} {enr[4]} ({enr[2]})")
        
        # Step 5: Check evaluation records
        print(f"\nSTEP 5: Checking evaluation records for period {period_id}...")
        evaluations = db.execute(text("""
            SELECT ev.id, ev.class_section_id, ev.evaluation_period_id, 
                   ev.submission_date, ev.status,
                   cs.class_code, c.subject_code, c.subject_name
            FROM evaluations ev
            JOIN class_sections cs ON ev.class_section_id = cs.id
            JOIN courses c ON cs.course_id = c.id
            WHERE ev.student_id = :student_id
            AND ev.evaluation_period_id = :period_id
        """), {"student_id": student_id, "period_id": period_id}).fetchall()
        
        if not evaluations:
            print(f"❌ No evaluation records found for period {period_id}")
        else:
            print(f"✅ Found {len(evaluations)} evaluation records:")
            for ev in evaluations:
                status = "✅ Completed" if ev[3] else "⏳ Pending"
                print(f"   - {ev[6]} {ev[7]} ({ev[5]}): {status}")
                print(f"     Eval ID: {ev[0]}, Submission Date: {ev[3]}")
        
        # Step 6: Run the actual student query
        print(f"\nSTEP 6: Running actual student endpoint query...")
        results = db.execute(text("""
            SELECT DISTINCT
                c.id, c.subject_code, c.subject_name,
                cs.id as class_section_id, cs.class_code,
                cs.semester, cs.academic_year,
                p.program_name,
                u.first_name || ' ' || u.last_name as instructor_name,
                CASE 
                    WHEN e.id IS NOT NULL AND e.submission_date IS NOT NULL THEN true 
                    ELSE false 
                END as already_evaluated,
                e.id as evaluation_id,
                ep.id as evaluation_period_id,
                ep.name as evaluation_period_name,
                ep.end_date as period_end_date
            FROM enrollments enr
            JOIN class_sections cs ON enr.class_section_id = cs.id
            JOIN courses c ON cs.course_id = c.id
            JOIN evaluation_periods ep ON enr.evaluation_period_id = ep.id
            LEFT JOIN programs p ON c.program_id = p.id
            LEFT JOIN users u ON cs.instructor_id = u.id
            LEFT JOIN evaluations e ON cs.id = e.class_section_id 
                AND e.student_id = :student_id
                AND e.evaluation_period_id = ep.id
            WHERE enr.student_id = :student_id
            AND enr.status = 'active'
            AND enr.evaluation_period_id IS NOT NULL
            AND ep.status = 'Open'
            AND CURRENT_DATE BETWEEN ep.start_date AND ep.end_date
            ORDER BY c.subject_name
        """), {"student_id": student_id}).fetchall()
        
        if not results:
            print("❌ Query returned 0 courses")
            print("\n💡 DIAGNOSIS:")
            print("   The student query joins enrollments with evaluation_periods.")
            print("   If no courses show up, it means:")
            print("   1. Student has no enrollments with evaluation_period_id set, OR")
            print("   2. The evaluation period is not 'active', OR")
            print("   3. Current date is not within the period dates")
        else:
            print(f"✅ Query returned {len(results)} courses:")
            for course in results:
                already_eval = "✅ Completed" if course[9] else "⏳ Available"
                print(f"   - {course[1]} {course[2]}: {already_eval}")
        
        print(f"\n{'='*60}")
        print("DIAGNOSIS COMPLETE")
        print(f"{'='*60}\n")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    # You can pass a different student ID as argument
    student_id = int(sys.argv[1]) if len(sys.argv) > 1 else 11
    debug_student_view(student_id)
