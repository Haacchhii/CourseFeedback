"""Check what data we actually have in evaluations"""
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)
db = engine.connect()

print("=" * 80)
print("EVALUATION DATA DIAGNOSIS")
print("=" * 80)
print()

# Check for evaluation_period_id column
print("1. Checking evaluation_period_id column:")
result = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'evaluations' AND column_name = 'evaluation_period_id'")).fetchall()
print(f"   evaluation_period_id exists: {len(result) > 0}")
print()

# Check sample evaluation with all fields
print("2. Sample evaluation data:")
result = db.execute(text("""
    SELECT 
        id, student_id, class_section_id, status,
        rating_overall, sentiment, sentiment_score,
        is_anomaly, text_feedback, submission_date
    FROM evaluations 
    WHERE status = 'completed'
    LIMIT 1
""")).fetchone()
if result:
    print(f"   ID: {result[0]}")
    print(f"   Status: {result[3]}")
    print(f"   Rating Overall: {result[4]}")
    print(f"   Sentiment (categorical): {result[5]}")
    print(f"   Sentiment Score: {result[6]}")
    print(f"   Is Anomaly: {result[7]}")
    print(f"   Has text_feedback: {result[8] is not None}")
    print(f"   Submission Date: {result[9]}")
print()

# Check how to link evaluations to periods
print("3. Checking evaluation-period linkage:")
result = db.execute(text("""
    SELECT COUNT(DISTINCT e.id) as eval_count,
           COUNT(DISTINCT en.evaluation_period_id) as periods
    FROM evaluations e
    LEFT JOIN enrollments en ON e.student_id = en.student_id 
        AND e.class_section_id = en.class_section_id
    WHERE e.status = 'completed'
""")).fetchone()
print(f"   Completed evaluations: {result[0]}")
print(f"   Linked to periods: {result[1]}")
print()

# Check sentiment distribution
print("4. Sentiment data:")
result = db.execute(text("""
    SELECT 
        COUNT(*) FILTER (WHERE sentiment IS NOT NULL) as has_categorical,
        COUNT(*) FILTER (WHERE sentiment_score IS NOT NULL) as has_score,
        COUNT(*) as total
    FROM evaluations
    WHERE status = 'completed'
""")).fetchone()
print(f"   With categorical sentiment: {result[0]}")
print(f"   With sentiment_score: {result[1]}")
print(f"   Total completed: {result[2]}")
print()

# Check anomaly data
print("5. Anomaly data:")
result = db.execute(text("""
    SELECT 
        COUNT(*) FILTER (WHERE is_anomaly = true) as anomalies,
        COUNT(*) as total
    FROM evaluations
    WHERE status = 'completed'
""")).fetchone()
print(f"   Anomalies detected: {result[0]}")
print(f"   Total completed: {result[1]}")
print()

print("=" * 80)
