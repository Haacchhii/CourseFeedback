from database.connection import engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

print('='*80)
print('TESTING PERIOD-FILTERED COMPLETION RATES')
print('='*80)

# Get active period
period = db.execute(text("""
    SELECT id, name FROM evaluation_periods WHERE status = 'active' LIMIT 1
""")).fetchone()

if not period:
    print('No active period found!')
    db.close()
    exit()

period_id = period[0]
print(f'\nActive Period: ID={period_id}, Name="{period[1]}"')

# Test WITHOUT period filter (old buggy way)
print(f'\n1. WITHOUT period filter (OLD - BUGGY):')
result_old = db.execute(text(f"""
    SELECT 
        cs.id,
        cs.class_code,
        c.subject_name,
        COUNT(DISTINCT en.student_id) as enrolled,
        COUNT(DISTINCT e.id) as evals,
        CASE 
            WHEN COUNT(DISTINCT en.student_id) > 0 
            THEN ROUND((COUNT(DISTINCT e.id)::NUMERIC / COUNT(DISTINCT en.student_id) * 100), 1)
            ELSE 0
        END as rate
    FROM class_sections cs
    INNER JOIN courses c ON cs.course_id = c.id
    LEFT JOIN enrollments en ON cs.id = en.class_section_id AND en.status = 'active' AND en.evaluation_period_id = {period_id}
    LEFT JOIN evaluations e ON cs.id = e.class_section_id AND e.status = 'completed'
    WHERE cs.id IN (135, 141, 142, 143)
    GROUP BY cs.id, cs.class_code, c.subject_name
    ORDER BY cs.id
""")).fetchall()

for r in result_old:
    print(f'  Section {r[0]:3d}: {r[3]:2d} enrolled, {r[4]:3d} evals = {r[5]:6.1f}% ({"⚠️ OVERFLOW!" if r[5] > 100 else "OK"})')

# Test WITH period filter (new fixed way)
print(f'\n2. WITH period filter (NEW - FIXED):')
result_new = db.execute(text(f"""
    SELECT 
        cs.id,
        cs.class_code,
        c.subject_name,
        COUNT(DISTINCT en.student_id) as enrolled,
        COUNT(DISTINCT e.id) as evals,
        CASE 
            WHEN COUNT(DISTINCT en.student_id) > 0 
            THEN ROUND((COUNT(DISTINCT e.id)::NUMERIC / COUNT(DISTINCT en.student_id) * 100), 1)
            ELSE 0
        END as rate
    FROM class_sections cs
    INNER JOIN courses c ON cs.course_id = c.id
    LEFT JOIN enrollments en ON cs.id = en.class_section_id AND en.status = 'active' AND en.evaluation_period_id = {period_id}
    LEFT JOIN evaluations e ON cs.id = e.class_section_id AND e.status = 'completed' AND e.evaluation_period_id = {period_id}
    WHERE cs.id IN (135, 141, 142, 143)
    GROUP BY cs.id, cs.class_code, c.subject_name
    ORDER BY cs.id
""")).fetchall()

for r in result_new:
    print(f'  Section {r[0]:3d}: {r[3]:2d} enrolled, {r[4]:3d} evals = {r[5]:6.1f}% ({"✅ FIXED" if r[5] <= 100 else "⚠️ STILL ISSUE"})')

# Show the difference
print(f'\n3. COMPARISON (sections with past evaluations):')
for old, new in zip(result_old, result_new):
    if old[4] != new[4]:  # If evaluation counts differ
        print(f'  Section {old[0]}: {old[1]} - {old[2][:40]}')
        print(f'    OLD: {old[4]} evaluations ({old[5]}%)')
        print(f'    NEW: {new[4]} evaluations ({new[5]}%)')
        print(f'    DIFFERENCE: {old[4] - new[4]} evaluations from other periods removed')

db.close()
print('\n' + '='*80)
