"""Fix period_enrollments table - create records from existing evaluations"""
from database.connection import SessionLocal
from sqlalchemy import text

db = SessionLocal()

print("=" * 60)
print("FIXING PERIOD ENROLLMENTS")
print("=" * 60)

# First, check current state
pe_count = db.execute(text('SELECT COUNT(*) FROM period_enrollments')).fetchone()[0]
print(f"\nCurrent period_enrollments count: {pe_count}")

# Check table schemas
print("\n=== Table Schemas ===")
for table in ['section_students', 'enrollments', 'period_enrollments', 'evaluations']:
    cols = db.execute(text(f"""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = '{table}' ORDER BY ordinal_position
    """)).fetchall()
    print(f"{table}: {[c[0] for c in cols]}")

# Get existing evaluations to know which student-section combos need period enrollments
print("\n=== Creating period enrollments from evaluations ===")

# Get unique student_id, class_section_id combinations from evaluations
eval_combos = db.execute(text("""
    SELECT DISTINCT student_id, class_section_id, evaluation_period_id
    FROM evaluations
    WHERE evaluation_period_id = 12
""")).fetchall()

print(f"Found {len(eval_combos)} unique student-section-period combinations in evaluations")

# Create period_enrollments for each
created = 0
for student_id, class_section_id, period_id in eval_combos:
    # Check if already exists
    exists = db.execute(text("""
        SELECT 1 FROM period_enrollments 
        WHERE student_id = :student_id 
        AND class_section_id = :class_section_id 
        AND evaluation_period_id = :period_id
    """), {
        'student_id': student_id,
        'class_section_id': class_section_id,
        'period_id': period_id
    }).fetchone()
    
    if not exists:
        db.execute(text("""
            INSERT INTO period_enrollments (student_id, class_section_id, evaluation_period_id, status, created_at)
            VALUES (:student_id, :class_section_id, :period_id, 'active', NOW())
        """), {
            'student_id': student_id,
            'class_section_id': class_section_id,
            'period_id': period_id
        })
        created += 1

db.commit()
print(f"Created {created} new period_enrollment records")

# Verify
pe_count = db.execute(text('SELECT COUNT(*) FROM period_enrollments WHERE evaluation_period_id = 12')).fetchone()[0]
print(f"\nPeriod enrollments for period 12: {pe_count}")

# Verify courses count
courses = db.execute(text("""
    SELECT COUNT(DISTINCT c.id)
    FROM period_enrollments pe
    JOIN class_sections cs ON pe.class_section_id = cs.id
    JOIN courses c ON cs.course_id = c.id
    WHERE pe.evaluation_period_id = 12
""")).fetchone()[0]
print(f"Total Courses (should now show in dashboard): {courses}")

# Verify sections count
sections = db.execute(text("""
    SELECT COUNT(DISTINCT class_section_id)
    FROM period_enrollments
    WHERE evaluation_period_id = 12
""")).fetchone()[0]
print(f"Total Sections: {sections}")

# Verify enrolled students
enrolled = db.execute(text("""
    SELECT COUNT(DISTINCT student_id)
    FROM period_enrollments
    WHERE evaluation_period_id = 12
""")).fetchone()[0]
print(f"Total Enrolled Students: {enrolled}")

db.close()
print("\n✅ Period enrollments fixed! Refresh the staff dashboard.")
