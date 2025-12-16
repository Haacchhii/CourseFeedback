"""Fix period_enrollments - create from evaluations data"""
from database.connection import SessionLocal
from sqlalchemy import text

db = SessionLocal()

print("=" * 60)
print("CREATING PERIOD ENROLLMENTS FROM EVALUATIONS")
print("=" * 60)

# Get the 9 class sections that have evaluations for period 12
sections = db.execute(text("""
    SELECT DISTINCT class_section_id, COUNT(*) as eval_count
    FROM evaluations 
    WHERE evaluation_period_id = 12
    GROUP BY class_section_id
""")).fetchall()

print(f"\nFound {len(sections)} class sections with evaluations:")
for s in sections:
    print(f"  Section ID {s[0]}: {s[1]} evaluations")

# Check current period_enrollments
pe_count = db.execute(text("SELECT COUNT(*) FROM period_enrollments WHERE evaluation_period_id = 12")).scalar()
print(f"\nCurrent period_enrollments for period 12: {pe_count}")

# Create period_enrollments for each section
if pe_count == 0:
    print("\nCreating period_enrollments...")
    for section_id, eval_count in sections:
        # Get student count for this section
        student_count = db.execute(text("""
            SELECT COUNT(DISTINCT student_id) FROM evaluations 
            WHERE class_section_id = :section_id AND evaluation_period_id = 12
        """), {"section_id": section_id}).scalar()
        
        db.execute(text("""
            INSERT INTO period_enrollments (evaluation_period_id, class_section_id, enrolled_count, created_at)
            VALUES (12, :section_id, :student_count, NOW())
        """), {"section_id": section_id, "student_count": student_count})
        print(f"  Created period_enrollment for section {section_id} with {student_count} students")
    
    db.commit()
    print("\n✅ Period enrollments created!")
else:
    print("\nPeriod enrollments already exist, skipping creation.")

# Verify the dashboard query now works
total_courses = db.execute(text("""
    SELECT COUNT(DISTINCT c.id)
    FROM period_enrollments pe
    JOIN class_sections cs ON pe.class_section_id = cs.id
    JOIN courses c ON cs.course_id = c.id
    WHERE pe.evaluation_period_id = 12
""")).scalar()
print(f"\n📊 Dashboard will now show: {total_courses} courses")

total_sections = db.execute(text("""
    SELECT COUNT(DISTINCT class_section_id)
    FROM period_enrollments
    WHERE evaluation_period_id = 12
""")).scalar()
print(f"📊 Total sections: {total_sections}")

db.close()
print("\n✅ Done! Refresh the staff dashboard.")
