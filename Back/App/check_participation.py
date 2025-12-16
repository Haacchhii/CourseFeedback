"""Check participation rate data"""
from database.connection import SessionLocal
from sqlalchemy import text

db = SessionLocal()

# Check enrollments with period 12
enrolled = db.execute(text("SELECT COUNT(DISTINCT id) FROM enrollments WHERE evaluation_period_id = 12 AND status = 'active'")).scalar()
print(f'Enrollments for period 12: {enrolled}')

# Check students who evaluated
evaluated = db.execute(text("SELECT COUNT(DISTINCT student_id) FROM evaluations WHERE evaluation_period_id = 12 AND status = 'completed'")).scalar()
print(f'Students who evaluated: {evaluated}')

# Participation rate
if enrolled > 0:
    rate = round((evaluated / enrolled * 100), 1)
    print(f'Participation rate: {rate}%')
else:
    print('No enrollments found - checking total students in evaluations')
    # Alternative: count unique student-section combos
    total_eval_count = db.execute(text("SELECT COUNT(*) FROM evaluations WHERE evaluation_period_id = 12")).scalar()
    print(f'Total evaluations: {total_eval_count}')

# Check period_enrollments enrolled_count
pe_enrolled = db.execute(text("SELECT SUM(enrolled_count) FROM period_enrollments WHERE evaluation_period_id = 12")).scalar()
print(f'Period enrollments total enrolled: {pe_enrolled}')

db.close()
