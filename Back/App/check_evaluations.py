"""Check evaluation data in database"""
from database.connection import SessionLocal
from sqlalchemy import text

db = SessionLocal()

# Check evaluations
result = db.execute(text('SELECT COUNT(*), status, processing_status FROM evaluations GROUP BY status, processing_status')).fetchall()
print('=== Evaluations by Status ===')
for r in result:
    print(f'Count: {r[0]}, Status: {r[1]}, Processing: {r[2]}')

# Check a sample evaluation
sample = db.execute(text('SELECT id, student_id, class_section_id, rating_teaching, rating_content, rating_engagement, rating_overall, text_feedback, sentiment FROM evaluations LIMIT 5')).fetchall()
print('\n=== Sample Evaluations ===')
for s in sample:
    fb = s[7][:50] if s[7] else 'NULL'
    print(f'ID: {s[0]}, Ratings: {s[3]}/{s[4]}/{s[5]}/{s[6]}, Feedback: {fb}, Sentiment: {s[8]}')

# Check if there are blank evaluations
blank = db.execute(text("SELECT COUNT(*) FROM evaluations WHERE text_feedback IS NULL OR text_feedback = ''")).fetchone()
print(f'\n=== Blank Feedback Count: {blank[0]} ===')

# Check evaluation period - correct column name
period = db.execute(text('SELECT id, name, status, start_date, end_date FROM evaluation_periods')).fetchall()
print('\n=== Evaluation Periods ===')
for p in period:
    print(f'ID: {p[0]}, Name: {p[1]}, Status: {p[2]}, Start: {p[3]}, End: {p[4]}')

# Check which period the evaluations are linked to
eval_periods = db.execute(text('SELECT evaluation_period_id, COUNT(*) FROM evaluations GROUP BY evaluation_period_id')).fetchall()
print('\n=== Evaluations by Period ===')
for ep in eval_periods:
    print(f'Period ID: {ep[0]}, Count: {ep[1]}')

# Check the instructor dashboard query - what courses should show
print('\n=== Checking instructor/staff course visibility ===')
instructor_courses = db.execute(text('''
    SELECT cs.id, c.name as course_name, cs.section_name, 
           COUNT(DISTINCT e.id) as eval_count
    FROM class_sections cs
    JOIN courses c ON cs.course_id = c.id
    LEFT JOIN evaluations e ON e.class_section_id = cs.id
    GROUP BY cs.id, c.name, cs.section_name
    HAVING COUNT(DISTINCT e.id) > 0
    ORDER BY c.name
''')).fetchall()
for ic in instructor_courses:
    print(f'Section ID: {ic[0]}, Course: {ic[1]}, Section: {ic[2]}, Evals: {ic[3]}')

db.close()
