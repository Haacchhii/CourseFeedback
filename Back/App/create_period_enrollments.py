"""Create period enrollments for BSCS-DS students"""
from database.connection import SessionLocal
from sqlalchemy import text

db = SessionLocal()

# Get the 23 students and their class sections
students = db.execute(text("""
    SELECT DISTINCT ss.student_id, ss.class_section_id
    FROM section_students ss
    JOIN students s ON ss.student_id = s.id
    JOIN programs p ON s.program_id = p.id
    WHERE p.code = 'BSCS-DS'
""")).fetchall()

print(f'Found {len(students)} section_student records to create period enrollments')

# Create period enrollments for each student-section combo
created = 0
for student_id, class_section_id in students:
    try:
        db.execute(text("""
            INSERT INTO period_enrollments (student_id, class_section_id, evaluation_period_id, status)
            VALUES (:student_id, :class_section_id, 12, 'active')
            ON CONFLICT DO NOTHING
        """), {'student_id': student_id, 'class_section_id': class_section_id})
        created += 1
    except Exception as e:
        print(f'Error for student {student_id}, section {class_section_id}: {e}')

db.commit()

# Verify
pe_count = db.execute(text('SELECT COUNT(*) FROM period_enrollments WHERE evaluation_period_id = 12')).scalar()
print(f'Period Enrollments for period 12: {pe_count}')

# Verify courses now show up
courses = db.execute(text("""
    SELECT COUNT(DISTINCT c.id)
    FROM period_enrollments pe
    JOIN class_sections cs ON pe.class_section_id = cs.id
    JOIN courses c ON cs.course_id = c.id
    WHERE pe.evaluation_period_id = 12
""")).scalar()
print(f'Total Courses (should appear in dashboard): {courses}')

db.close()
print('Done!')
