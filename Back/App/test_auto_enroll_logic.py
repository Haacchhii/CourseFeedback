"""
Test script to verify auto-enrollment query logic
This will help identify why students aren't being enrolled
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
import sys

# Database connection
DATABASE_URL = "postgresql://postgres:12345@localhost:5432/course_feedback_db"

try:
    engine = create_engine(DATABASE_URL)

    with Session(engine) as db:
        # Test query 1: Check if we have program sections
        print("=" * 60)
        print("TEST 1: Program Sections")
        print("=" * 60)
        result = db.execute(text("""
            SELECT id, section_name, program_id, year_level, semester, school_year, is_active
            FROM program_sections
            ORDER BY id
            LIMIT 10
        """))
        sections = result.fetchall()
        print(f"Found {len(sections)} program sections:")
        for s in sections:
            print(f"  ID: {s[0]}, Name: {s[1]}, Program: {s[2]}, Year: {s[3]}, Semester: {s[4]}, School Year: {s[5]}, Active: {s[6]}")

        if not sections:
            print("❌ No program sections found!")
            sys.exit(1)

        # Test query 2: Check section_students for a specific section
        print("\n" + "=" * 60)
        print("TEST 2: Students in Section_Students table")
        print("=" * 60)
        test_section_id = sections[0][0]  # Use first section
        print(f"Testing with section_id: {test_section_id}")

        result = db.execute(text("""
            SELECT ss.id, ss.section_id, ss.student_id, u.email, u.first_name, u.last_name, u.role, u.is_active
            FROM section_students ss
            JOIN users u ON ss.student_id = u.id
            WHERE ss.section_id = :section_id
        """), {"section_id": test_section_id})
        section_students = result.fetchall()
        print(f"Found {len(section_students)} students in section_students for section {test_section_id}:")
        for ss in section_students:
            print(f"  SectionStudent ID: {ss[0]}, User ID: {ss[2]}, Email: {ss[3]}, Name: {ss[4]} {ss[5]}, Role: {ss[6]}, Active: {ss[7]}")

        # Test query 3: Check if these users have corresponding student records
        print("\n" + "=" * 60)
        print("TEST 3: Matching Student Records")
        print("=" * 60)
        result = db.execute(text("""
            SELECT s.id as student_id, s.user_id, s.student_number, s.program_id, s.year_level, u.email
            FROM section_students ss
            JOIN users u ON ss.student_id = u.id
            JOIN students s ON s.user_id = u.id
            WHERE ss.section_id = :section_id
            AND u.is_active = true
            AND u.role = 'student'
        """), {"section_id": test_section_id})
        matching_students = result.fetchall()
        print(f"Found {len(matching_students)} students with matching student records:")
        for ms in matching_students:
            print(f"  Student ID: {ms[0]}, User ID: {ms[1]}, Student#: {ms[2]}, Program: {ms[3]}, Year: {ms[4]}, Email: {ms[5]}")

        # Test query 4: Check all students in the students table
        print("\n" + "=" * 60)
        print("TEST 4: All Active Students in Database")
        print("=" * 60)
        result = db.execute(text("""
            SELECT s.id, s.user_id, s.student_number, s.program_id, s.year_level, u.email, u.first_name, u.last_name
            FROM students s
            JOIN users u ON s.user_id = u.id
            WHERE u.is_active = true
            AND u.role = 'student'
            ORDER BY s.id
            LIMIT 20
        """))
        all_students = result.fetchall()
        print(f"Found {len(all_students)} active students in database:")
        for st in all_students:
            print(f"  Student ID: {st[0]}, User ID: {st[1]}, Student#: {st[2]}, Email: {st[5]}, Name: {st[6]} {st[7]}")

        # Test query 5: Check if users in section_students have student records
        print("\n" + "=" * 60)
        print("TEST 5: Section Students WITHOUT Student Records (This is the problem!)")
        print("=" * 60)
        result = db.execute(text("""
            SELECT ss.student_id, u.email, u.first_name, u.last_name, u.role
            FROM section_students ss
            JOIN users u ON ss.student_id = u.id
            LEFT JOIN students s ON s.user_id = u.id
            WHERE ss.section_id = :section_id
            AND s.id IS NULL
        """), {"section_id": test_section_id})
        missing_students = result.fetchall()
        if missing_students:
            print(f"⚠️ Found {len(missing_students)} users in section_students WITHOUT student records:")
            for ms in missing_students:
                print(f"  User ID: {ms[0]}, Email: {ms[1]}, Name: {ms[2]} {ms[3]}, Role: {ms[4]}")
            print("\n💡 This is likely why auto-enrollment is failing!")
            print("   Users need to have corresponding records in the 'students' table.")
        else:
            print("✅ All users in section_students have student records")

        print("\n" + "=" * 60)
        print("SUMMARY")
        print("=" * 60)
        print(f"Program Sections: {len(sections)}")
        print(f"Users in section_students (for section {test_section_id}): {len(section_students)}")
        print(f"Users with matching student records: {len(matching_students)}")
        print(f"Users WITHOUT student records: {len(missing_students)}")

        if len(matching_students) == 0:
            print("\n❌ PROBLEM IDENTIFIED:")
            print("   - Users are assigned to program sections in 'section_students'")
            print("   - BUT these users don't have corresponding 'student' records")
            print("   - The auto-enrollment query requires the 'students' table")
            print("   - Solution: Either create student records or modify the query")
        else:
            print("\n✅ Query should work for auto-enrollment")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
