from database.connection import get_db
from sqlalchemy import text

db = next(get_db())

# Test student ID 24 (Jose Irinco N. Iturralde)
student_id = 24

print("\n=== Step 1: Check if student exists ===")
student_result = db.execute(text("""
    SELECT s.id, u.first_name, u.last_name 
    FROM students s
    JOIN users u ON s.user_id = u.id
    WHERE u.id = :user_id
"""), {"user_id": student_id})
student_data = student_result.fetchone()
if student_data:
    actual_student_id = student_data[0]
    print(f"✓ Found student: {student_data[1]} {student_data[2]}, student_id={actual_student_id}")
else:
    print("✗ Student not found")
    exit(1)

print("\n=== Step 2: Check enrollments ===")
enrollments_result = db.execute(text("""
    SELECT 
        enr.id as enrollment_id,
        enr.student_id,
        enr.class_section_id,
        enr.evaluation_period_id,
        enr.status,
        cs.class_code,
        c.subject_name,
        ep.name as period_name,
        ep.status as period_status
    FROM enrollments enr
    JOIN class_sections cs ON enr.class_section_id = cs.id
    JOIN courses c ON cs.course_id = c.id
    LEFT JOIN evaluation_periods ep ON enr.evaluation_period_id = ep.id
    WHERE enr.student_id = :student_id
    ORDER BY ep.start_date DESC
"""), {"student_id": actual_student_id})

enrollments = enrollments_result.fetchall()
print(f"Found {len(enrollments)} enrollments:")
for enr in enrollments:
    print(f"  - {enr[5]}: {enr[6]} | Period: {enr[7]} ({enr[8]}) | Status: {enr[4]}")

print("\n=== Step 3: Check evaluation periods ===")
periods_result = db.execute(text("""
    SELECT id, name, status, start_date, end_date
    FROM evaluation_periods
    ORDER BY start_date DESC
"""))
periods = periods_result.fetchall()
print(f"Found {len(periods)} evaluation periods:")
for p in periods:
    print(f"  - ID {p[0]}: {p[1]} | Status: {p[2]} | {p[3]} to {p[4]}")

print("\n=== Step 4: Test evaluation history query ===")
query = """
    SELECT 
        e.id as evaluation_id,
        e.submission_date as submission_date,
        e.rating_overall,
        e.sentiment,
        e.sentiment_score,
        e.text_feedback,
        e.is_anomaly,
        c.id as course_id,
        c.subject_code,
        c.subject_name,
        cs.id as class_section_id,
        cs.class_code,
        cs.semester,
        cs.academic_year,
        u.first_name || ' ' || u.last_name as instructor_name,
        ep.id as period_id,
        ep.name as period_name,
        ep.semester as period_semester,
        ep.academic_year as period_academic_year,
        ep.start_date as period_start,
        ep.end_date as period_end,
        ep.status as period_status,
        p.program_name
    FROM enrollments enr
    JOIN class_sections cs ON enr.class_section_id = cs.id
    JOIN courses c ON cs.course_id = c.id
    JOIN evaluation_periods ep ON enr.evaluation_period_id = ep.id
    LEFT JOIN evaluations e ON e.class_section_id = cs.id 
        AND e.student_id = :student_id
        AND e.evaluation_period_id = ep.id
    LEFT JOIN users u ON cs.instructor_id = u.id
    LEFT JOIN programs p ON c.program_id = p.id
    WHERE enr.student_id = :student_id
    AND enr.evaluation_period_id IS NOT NULL
    ORDER BY ep.start_date DESC, cs.class_code, e.created_at DESC
"""

history_result = db.execute(text(query), {"student_id": actual_student_id})
history = history_result.fetchall()
print(f"\nFound {len(history)} history records:")
for h in history:
    eval_status = "✓ Evaluated" if h[1] else "✗ No Response"
    print(f"  - {h[9]} ({h[11]}) | Period: {h[16]} | {eval_status}")

print("\n=== Step 5: Test periods query ===")
periods_query = """
    SELECT DISTINCT
        ep.id,
        ep.name,
        ep.semester,
        ep.academic_year,
        ep.start_date,
        ep.end_date,
        ep.status,
        COUNT(e.id) as evaluation_count
    FROM evaluation_periods ep
    LEFT JOIN evaluations e ON ep.id = e.evaluation_period_id 
        AND e.student_id = :student_id
    WHERE ep.id IN (
        SELECT DISTINCT evaluation_period_id 
        FROM enrollments 
        WHERE student_id = :student_id 
        AND evaluation_period_id IS NOT NULL
    )
    GROUP BY ep.id, ep.name, ep.semester, ep.academic_year, 
             ep.start_date, ep.end_date, ep.status
    ORDER BY ep.start_date DESC
"""

periods_result = db.execute(text(periods_query), {"student_id": actual_student_id})
available_periods = periods_result.fetchall()
print(f"\nFound {len(available_periods)} available periods for filtering:")
for p in available_periods:
    print(f"  - {p[1]} | Status: {p[6]} | Evaluations: {p[7]}")

print("\n=== Test Complete ===")
