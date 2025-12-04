from database.connection import engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

print('='*80)
print('CHECKING FOR MULTI-PERIOD EVALUATION DATA')
print('='*80)

# Check evaluation counts by period
print('\n1. Evaluations per period:')
periods = db.execute(text("""
    SELECT 
        ep.id,
        ep.name,
        ep.status,
        COUNT(e.id) as eval_count
    FROM evaluation_periods ep
    LEFT JOIN evaluations e ON ep.id = e.evaluation_period_id AND e.status = 'completed'
    GROUP BY ep.id, ep.name, ep.status
    ORDER BY ep.id DESC
    LIMIT 5
""")).fetchall()
for p in periods:
    print(f'  Period {p[0]:2d}: {p[1]:35s} ({p[2]:10s}) - {p[3]:3d} completed evaluations')

# Check if any sections have evaluations from multiple periods
print('\n2. Sections with evaluations from multiple periods:')
multi = db.execute(text("""
    SELECT 
        cs.id,
        cs.class_code,
        c.subject_name,
        COUNT(DISTINCT e.evaluation_period_id) as period_count,
        COUNT(*) as total_evals
    FROM class_sections cs
    JOIN courses c ON cs.course_id = c.id
    JOIN evaluations e ON cs.id = e.class_section_id
    WHERE e.status = 'completed'
    GROUP BY cs.id, cs.class_code, c.subject_name
    HAVING COUNT(DISTINCT e.evaluation_period_id) > 1
    ORDER BY period_count DESC, total_evals DESC
    LIMIT 10
""")).fetchall()

if multi:
    print(f'  Found {len(multi)} sections:')
    for m in multi:
        print(f'    Section {m[0]}: {m[1]} - {m[2][:40]}')
        print(f'      {m[3]} different periods, {m[4]} total evaluations')
else:
    print('  No sections with multi-period evaluations found')

# Get active period and check a specific problematic section
print('\n3. Checking specific section that shows overflow:')
active_period = db.execute(text("""
    SELECT id, name FROM evaluation_periods WHERE status = 'active' LIMIT 1
""")).fetchone()

if active_period:
    print(f'  Active period: {active_period[0]} - {active_period[1]}')
    
    # Pick a section that might have issues (let's check multiple)
    for section_id in [141, 142, 143, 144, 145]:
        counts = db.execute(text(f"""
            SELECT
                (SELECT COUNT(*) FROM enrollments 
                 WHERE class_section_id = {section_id} 
                 AND status = 'active' 
                 AND evaluation_period_id = {active_period[0]}) as enrolled,
                (SELECT COUNT(*) FROM evaluations 
                 WHERE class_section_id = {section_id} 
                 AND status = 'completed') as all_period_evals,
                (SELECT COUNT(*) FROM evaluations 
                 WHERE class_section_id = {section_id} 
                 AND status = 'completed'
                 AND evaluation_period_id = {active_period[0]}) as current_period_evals
        """)).fetchone()
        
        if counts[0] > 0:  # Has enrollments
            old_rate = (counts[1] / counts[0] * 100) if counts[0] > 0 else 0
            new_rate = (counts[2] / counts[0] * 100) if counts[0] > 0 else 0
            if old_rate != new_rate:
                print(f'\n  Section {section_id}:')
                print(f'    Enrolled: {counts[0]} students')
                print(f'    Without period filter: {counts[1]} evals = {old_rate:.0f}%')
                print(f'    With period filter: {counts[2]} evals = {new_rate:.0f}%')
                print(f'    {"⚠️ OVERFLOW FIXED!" if old_rate > 100 else "✅ Both OK"}')

db.close()
print('\n' + '='*80)
