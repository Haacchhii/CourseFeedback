"""
Fix #1: Check Evaluation Data Structure
"""
from database.connection import get_db
from sqlalchemy import text

db = next(get_db())

# Fix 1: Check responses column type
print('=== FIX #1: CHECKING EVALUATION DATA STRUCTURE ===')
result = db.execute(text("""
    SELECT 
      column_name,
      data_type,
      character_maximum_length
    FROM information_schema.columns
    WHERE table_name = 'evaluations'
    AND column_name IN ('responses', 'ratings', 'comments')
    ORDER BY column_name;
"""))

print('\nEvaluations Table Columns:')
for row in result:
    max_len = f' (max: {row[2]})' if row[2] else ''
    print(f'  {row[0]}: {row[1]}{max_len}')

# Check sample data
print('\n--- Sample Evaluation Data ---')
sample = db.execute(text("""
    SELECT 
      id,
      student_id,
      class_section_id,
      evaluation_period_id,
      ratings,
      comments,
      ml_sentiment,
      submission_date
    FROM evaluations
    ORDER BY id DESC
    LIMIT 3;
"""))

for row in sample:
    print(f'\nEvaluation ID {row[0]}:')
    print(f'  Student: {row[1]}, Section: {row[2]}, Period: {row[3]}')
    print(f'  Ratings type: {type(row[4]).__name__ if row[4] else "NULL"}')
    print(f'  Comments type: {type(row[5]).__name__ if row[5] else "NULL"}')
    if row[4]:
        import json
        ratings_data = row[4] if isinstance(row[4], dict) else json.loads(row[4])
        print(f'  Ratings keys: {list(ratings_data.keys())[:5]}...')
        print(f'  Total questions: {len(ratings_data)}')
    print(f'  ML Sentiment: {row[6]}')
    print(f'  Submitted: {row[7]}')

db.close()
print('\n✅ Fix #1 Analysis Complete')
