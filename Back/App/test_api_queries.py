"""Test what the actual API endpoints return"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
import json

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

def main():
    session = Session()
    
    try:
        print("=" * 80)
        print("TESTING API QUERY RESULTS")
        print("=" * 80)
        print()
        
        # Test 1: Evaluations query (what /api/secretary/evaluations returns)
        print("1. EVALUATIONS QUERY (checking evaluation_period_id filter):")
        
        # Get active period
        active_period = session.execute(text("""
            SELECT id, name, status FROM evaluation_periods WHERE status = 'active' LIMIT 1
        """)).fetchone()
        
        if active_period:
            print(f"   Active Period: ID={active_period[0]}, Name={active_period[1]}")
            
            # Check how many evaluations have this period_id
            count = session.execute(text("""
                SELECT COUNT(*) 
                FROM evaluations 
                WHERE evaluation_period_id = :period_id
                AND status = 'completed'
            """), {"period_id": active_period[0]}).scalar()
            
            print(f"   Evaluations with evaluation_period_id={active_period[0]}: {count}")
        else:
            print("   ❌ No active period found!")
        
        print()
        
        # Test 2: Check evaluation_period_id values in evaluations
        print("2. EVALUATION_PERIOD_ID DISTRIBUTION:")
        dist = session.execute(text("""
            SELECT evaluation_period_id, COUNT(*) as count
            FROM evaluations
            WHERE status = 'completed'
            GROUP BY evaluation_period_id
        """)).fetchall()
        
        for row in dist:
            period_id = row[0] if row[0] else "NULL"
            print(f"   Period ID {period_id}: {row[1]} evaluations")
        
        print()
        
        # Test 3: Sentiment analysis query
        print("3. SENTIMENT ANALYSIS (checking submission_date):")
        sentiment_count = session.execute(text("""
            SELECT sentiment, COUNT(*) as count
            FROM evaluations
            WHERE status = 'completed'
            AND sentiment IS NOT NULL
            GROUP BY sentiment
        """)).fetchall()
        
        print(f"   Total with sentiment: {sum(r[1] for r in sentiment_count)}")
        for row in sentiment_count:
            print(f"   {row[0]}: {row[1]}")
        
        # Check submission dates
        date_check = session.execute(text("""
            SELECT 
                COUNT(*) FILTER (WHERE submission_date IS NULL) as null_dates,
                COUNT(*) FILTER (WHERE submission_date IS NOT NULL) as has_dates,
                MIN(submission_date) as earliest,
                MAX(submission_date) as latest
            FROM evaluations
            WHERE status = 'completed'
        """)).fetchone()
        
        print(f"   With submission_date: {date_check[1]}")
        print(f"   NULL submission_date: {date_check[0]}")
        if date_check[2]:
            print(f"   Date range: {date_check[2]} to {date_check[3]}")
        
        print()
        
        # Test 4: Courses query (overallRating)
        print("4. COURSES QUERY (checking avg rating calculation):")
        courses = session.execute(text("""
            SELECT 
                c.subject_code,
                COUNT(DISTINCT e.id) as eval_count,
                AVG(e.rating_overall) as avg_rating
            FROM class_sections cs
            INNER JOIN courses c ON cs.course_id = c.id
            LEFT JOIN evaluations e ON cs.id = e.class_section_id 
                AND e.status = 'completed'
            GROUP BY c.id, c.subject_code
            HAVING COUNT(DISTINCT e.id) > 0
            LIMIT 5
        """)).fetchall()
        
        print(f"   Courses with evaluations: {len(courses)}")
        for row in courses:
            print(f"   {row[0]}: {row[1]} evaluations, Avg: {row[2]:.2f}")
        
        print()
        print("=" * 80)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

if __name__ == "__main__":
    main()
