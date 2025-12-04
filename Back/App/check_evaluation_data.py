"""Check evaluation data structure"""
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/course_feedback')
engine = create_engine(DATABASE_URL)
db = engine.connect()

print("=" * 80)
print("CHECKING EVALUATION DATA")
print("=" * 80)

# Check completed evaluations
result = db.execute(text("""
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN rating_overall > 0 THEN 1 END) as with_ratings,
        COUNT(CASE WHEN sentiment_score IS NOT NULL THEN 1 END) as with_sentiment,
        COUNT(CASE WHEN is_anomaly IS NOT NULL THEN 1 END) as with_anomaly_flag,
        COUNT(CASE WHEN comments IS NOT NULL AND comments != '' THEN 1 END) as with_comments
    FROM evaluations
    WHERE status = 'completed'
""")).fetchone()

print(f"\n✅ Completed Evaluations: {result[0]}")
print(f"   - With ratings (>0): {result[1]}")
print(f"   - With sentiment_score: {result[2]}")
print(f"   - With is_anomaly flag: {result[3]}")
print(f"   - With comments: {result[4]}")

# Sample data
samples = db.execute(text("""
    SELECT 
        id, status, rating_overall, rating_teaching, 
        sentiment_score, is_anomaly, 
        CASE WHEN comments IS NULL THEN 'NULL' 
             WHEN comments = '' THEN 'EMPTY' 
             ELSE 'HAS_COMMENT' END as comment_status
    FROM evaluations
    WHERE status = 'completed'
    LIMIT 5
""")).fetchall()

print("\n📋 Sample Data:")
for s in samples:
    print(f"   ID={s[0]}: Overall={s[2]}, Teaching={s[3]}, Sentiment={s[4]}, Anomaly={s[5]}, Comments={s[6]}")

# Check if courses have evaluation data
courses_with_evals = db.execute(text("""
    SELECT 
        c.id,
        c.subject_code,
        COUNT(e.id) as eval_count,
        AVG(e.rating_overall) as avg_rating
    FROM courses c
    LEFT JOIN class_sections cs ON c.id = cs.course_id
    LEFT JOIN evaluations e ON cs.id = e.class_section_id AND e.status = 'completed'
    GROUP BY c.id, c.subject_code
    HAVING COUNT(e.id) > 0
    LIMIT 10
""")).fetchall()

print(f"\n📚 Courses with evaluations: {len(courses_with_evals)}")
for course in courses_with_evals:
    print(f"   {course[1]}: {course[2]} evaluations, Avg: {course[3]:.2f}" if course[3] else f"   {course[1]}: {course[2]} evaluations, Avg: 0.00")

print("\n" + "=" * 80)
