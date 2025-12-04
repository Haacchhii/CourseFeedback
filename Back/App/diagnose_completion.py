from database.connection import engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

print('=' * 80)
print('COMPLETION RATE DIAGNOSIS')
print('=' * 80)

# Section 135 analysis
print('\n1. SECTION 135 - Current query (with join):')
result = db.execute(text("""
    SELECT 
        COUNT(DISTINCT en.student_id) as enrolled,
        COUNT(DISTINCT e.id) as evals_with_join
    FROM class_sections cs
    LEFT JOIN enrollments en ON cs.id = en.class_section_id AND en.status = 'active'
    LEFT JOIN evaluations e ON cs.id = e.class_section_id AND en.student_id = e.student_id AND e.status = 'completed'
    WHERE cs.id = 135
""")).fetchone()
print(f'   Enrolled: {result[0]}, Evaluations counted: {result[1]}')
if result[0] > 0:
    print(f'   Completion rate: {result[1]/result[0]*100:.1f}%')

print('\n2. SECTION 135 - Correct query (without enrollment join on evaluations):')
result2 = db.execute(text("""
    SELECT 
        COUNT(DISTINCT en.student_id) as enrolled,
        COUNT(DISTINCT e.id) as evals_direct
    FROM class_sections cs
    LEFT JOIN enrollments en ON cs.id = en.class_section_id AND en.status = 'active'
    LEFT JOIN evaluations e ON cs.id = e.class_section_id AND e.status = 'completed'
    WHERE cs.id = 135
""")).fetchone()
print(f'   Enrolled: {result2[0]}, Evaluations counted: {result2[1]}')
if result2[0] > 0:
    print(f'   Completion rate: {result2[1]/result2[0]*100:.1f}%')

print('\n3. EVALUATIONS WITH ZERO OR NULL RATING:')
zeros = db.execute(text("""
    SELECT id, student_id, status, rating_overall, submission_date
    FROM evaluations 
    WHERE class_section_id = 135
    AND (rating_overall = 0 OR rating_overall IS NULL)
    ORDER BY id
""")).fetchall()
if zeros:
    print(f'   Found {len(zeros)} evaluations with 0 or NULL rating:')
    for z in zeros:
        print(f'   - Eval {z[0]}: student={z[1]}, status={z[2]}, rating={z[3]}, date={z[4]}')
else:
    print('   No evaluations with 0 or NULL rating')

print('\n4. ALL EVALUATIONS FOR SECTION 135:')
all_evals = db.execute(text("""
    SELECT id, student_id, status, rating_overall, submission_date
    FROM evaluations
    WHERE class_section_id = 135
    ORDER BY id
""")).fetchall()
print(f'   Total: {len(all_evals)} evaluations')
for ev in all_evals:
    print(f'   - Eval {ev[0]}: student={ev[1]}, status={ev[2]}, rating={ev[3]}, date={ev[4]}')

print('\n5. PENDING (NOT SUBMITTED) EVALUATIONS:')
pending = db.execute(text("""
    SELECT id, student_id, status, rating_overall, submission_date
    FROM evaluations
    WHERE class_section_id = 135
    AND status = 'pending'
    ORDER BY id
""")).fetchall()
if pending:
    print(f'   Found {len(pending)} pending evaluations (should NOT be counted):')
    for p in pending:
        print(f'   - Eval {p[0]}: student={p[1]}, status={p[2]}, rating={p[3]}, date={p[4]}')
else:
    print('   No pending evaluations')

db.close()
print('\n' + '=' * 80)
