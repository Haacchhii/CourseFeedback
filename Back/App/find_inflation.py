from database.connection import engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

print('=' * 80)
print('FINDING SECTIONS WITH HIGH RESPONSE RATES')
print('=' * 80)

# Find sections with inflated counts
print('\nFinding sections where query gives wrong counts...\n')

sections = db.execute(text("""
    SELECT 
        cs.id,
        cs.class_code,
        c.subject_name,
        COUNT(DISTINCT en.student_id) as enrolled,
        COUNT(DISTINCT e.id) as evals_with_bad_join,
        (SELECT COUNT(*) FROM evaluations e2 
         WHERE e2.class_section_id = cs.id AND e2.status = 'completed') as actual_completed
    FROM class_sections cs
    INNER JOIN courses c ON cs.course_id = c.id
    LEFT JOIN enrollments en ON cs.id = en.class_section_id AND en.status = 'active'
    LEFT JOIN evaluations e ON cs.id = e.class_section_id AND en.student_id = e.student_id AND e.status = 'completed'
    GROUP BY cs.id, cs.class_code, c.subject_name
    HAVING COUNT(DISTINCT en.student_id) > 0
    ORDER BY 
        CASE 
            WHEN COUNT(DISTINCT en.student_id) > 0 
            THEN ROUND((COUNT(DISTINCT e.id)::NUMERIC / COUNT(DISTINCT en.student_id) * 100), 1)
            ELSE 0
        END DESC
    LIMIT 10
""")).fetchall()

print(f'Top 10 sections by response rate:\n')
for s in sections:
    enrolled = s[3]
    bad_count = s[4]
    actual = s[5]
    bad_rate = (bad_count / enrolled * 100) if enrolled > 0 else 0
    actual_rate = (actual / enrolled * 100) if enrolled > 0 else 0
    
    print(f'Section {s[0]}: {s[1]} - {s[2]}')
    print(f'  Enrolled: {enrolled}')
    print(f'  Current query counts: {bad_count} ({bad_rate:.0f}%)')
    print(f'  Actual completed: {actual} ({actual_rate:.0f}%)')
    print(f'  DIFFERENCE: {bad_count - actual} evaluations')
    
    if bad_count != actual:
        # Check for issue
        print(f'  ⚠️ MISMATCH DETECTED!')
        
        # Check if students are enrolled in multiple sections
        cross_section = db.execute(text(f"""
            SELECT e.student_id, COUNT(*) as eval_count, 
                   STRING_AGG(DISTINCT cs2.class_code, ', ') as other_sections
            FROM evaluations e
            JOIN class_sections cs2 ON e.class_section_id = cs2.id
            WHERE e.student_id IN (
                SELECT student_id FROM enrollments WHERE class_section_id = {s[0]}
            )
            AND e.status = 'completed'
            GROUP BY e.student_id
            HAVING COUNT(*) > 1
        """)).fetchall()
        
        if cross_section:
            print(f'  Issue: {len(cross_section)} students have evaluations in multiple sections')
            for cs in cross_section[:3]:
                print(f'    - Student {cs[0]}: {cs[1]} evaluations in sections: {cs[2]}')
    print()

db.close()
print('=' * 80)
