"""
COMPLETE SYSTEM AUDIT - Course Feedback System
Checks database schema, models, routes, and data consistency
"""
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
import json

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
inspector = inspect(engine)

def print_section(title):
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)

def main():
    session = Session()
    
    try:
        print("\n" + "█" * 80)
        print("█" + " " * 78 + "█")
        print("█" + "  COMPLETE SYSTEM AUDIT - COURSE FEEDBACK SYSTEM".center(78) + "█")
        print("█" + " " * 78 + "█")
        print("█" * 80)
        
        # ============================================================
        # 1. DATABASE SCHEMA CHECK
        # ============================================================
        print_section("1. DATABASE SCHEMA CHECK")
        
        # Check all tables exist
        tables = inspector.get_table_names()
        required_tables = [
            'users', 'students', 'courses', 'class_sections', 'enrollments',
            'evaluations', 'evaluation_periods', 'programs', 'secretaries',
            'department_heads'
        ]
        
        print("\n📋 Required Tables:")
        for table in required_tables:
            status = "✅" if table in tables else "❌ MISSING"
            print(f"   {status} {table}")
        
        # Check evaluations table columns
        print("\n📊 Evaluations Table Columns:")
        eval_columns = {col['name']: col['type'] for col in inspector.get_columns('evaluations')}
        critical_columns = [
            'id', 'student_id', 'class_section_id', 'evaluation_period_id',
            'rating_overall', 'rating_teaching', 'rating_content', 'rating_engagement',
            'sentiment', 'sentiment_score', 'is_anomaly', 'text_feedback',
            'status', 'processing_status', 'submission_date', 'ratings'
        ]
        
        for col in critical_columns:
            if col in eval_columns:
                print(f"   ✅ {col}: {eval_columns[col]}")
            else:
                print(f"   ❌ MISSING: {col}")
        
        # ============================================================
        # 2. DATA CONSISTENCY CHECK
        # ============================================================
        print_section("2. DATA CONSISTENCY CHECK")
        
        # Check evaluation periods
        periods = session.execute(text("""
            SELECT id, name, status, 
                   COUNT(*) OVER() as total_periods,
                   COUNT(*) FILTER (WHERE status = 'active') OVER() as active_count
            FROM evaluation_periods
            ORDER BY id DESC
            LIMIT 3
        """)).fetchall()
        
        print("\n📅 Evaluation Periods:")
        if periods:
            print(f"   Total Periods: {periods[0][3]}")
            print(f"   Active Periods: {periods[0][4]}")
            print("\n   Recent Periods:")
            for p in periods:
                print(f"   - ID {p[0]}: {p[1]} (Status: {p[2]})")
        else:
            print("   ❌ NO PERIODS FOUND")
        
        # Check evaluations status distribution
        print("\n📝 Evaluations Status Distribution:")
        eval_status = session.execute(text("""
            SELECT 
                status,
                processing_status,
                COUNT(*) as count,
                COUNT(*) FILTER (WHERE evaluation_period_id IS NOT NULL) as with_period,
                COUNT(*) FILTER (WHERE rating_overall > 0) as with_rating,
                COUNT(*) FILTER (WHERE sentiment IS NOT NULL) as with_sentiment
            FROM evaluations
            GROUP BY status, processing_status
        """)).fetchall()
        
        if eval_status:
            for row in eval_status:
                print(f"   Status='{row[0]}', ProcessingStatus='{row[1]}':")
                print(f"      Count: {row[2]}")
                print(f"      With Period: {row[3]}")
                print(f"      With Rating: {row[4]}")
                print(f"      With Sentiment: {row[5]}")
        else:
            print("   ❌ NO EVALUATIONS FOUND")
        
        # Check enrollments
        print("\n👥 Enrollments Status:")
        enroll_check = session.execute(text("""
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'active') as active,
                COUNT(*) FILTER (WHERE evaluation_period_id IS NOT NULL) as with_period,
                COUNT(DISTINCT evaluation_period_id) as unique_periods
            FROM enrollments
        """)).fetchone()
        
        print(f"   Total Enrollments: {enroll_check[0]}")
        print(f"   Active Enrollments: {enroll_check[1]}")
        print(f"   With Period ID: {enroll_check[2]}")
        print(f"   Unique Periods: {enroll_check[3]}")
        
        # ============================================================
        # 3. MODEL-DATABASE MISMATCH CHECK
        # ============================================================
        print_section("3. MODEL-DATABASE MISMATCH CHECK")
        
        # This would require importing models and comparing
        # Checking critical known issues
        print("\n🔍 Known Critical Checks:")
        
        # Check if Evaluation model would work with queries
        test_queries = [
            ("Evaluation.status filter", "SELECT COUNT(*) FROM evaluations WHERE status = 'completed'"),
            ("Evaluation.evaluation_period_id filter", "SELECT COUNT(*) FROM evaluations WHERE evaluation_period_id IS NOT NULL"),
            ("Evaluation.sentiment filter", "SELECT COUNT(*) FROM evaluations WHERE sentiment = 'positive'"),
            ("Join evaluations-enrollments", """
                SELECT COUNT(*) FROM evaluations e 
                JOIN enrollments en ON e.student_id = en.student_id 
                AND e.class_section_id = en.class_section_id
            """),
        ]
        
        for name, query in test_queries:
            try:
                result = session.execute(text(query)).scalar()
                print(f"   ✅ {name}: {result} rows")
            except Exception as e:
                print(f"   ❌ {name}: {str(e)[:100]}")
        
        # ============================================================
        # 4. API ENDPOINT DATA CHECK
        # ============================================================
        print_section("4. API ENDPOINT DATA CHECK")
        
        # Simulate what API endpoints would return
        print("\n🌐 Secretary/DeptHead Endpoints Data Availability:")
        
        # Courses endpoint
        courses_data = session.execute(text("""
            SELECT 
                COUNT(DISTINCT cs.id) as sections_count,
                COUNT(DISTINCT c.id) as courses_count,
                COUNT(DISTINCT e.id) as evaluations_count,
                AVG(e.rating_overall) as avg_rating
            FROM class_sections cs
            INNER JOIN courses c ON cs.course_id = c.id
            LEFT JOIN evaluations e ON cs.id = e.class_section_id 
                AND e.status = 'completed'
        """)).fetchone()
        
        print(f"\n   📚 Courses Page:")
        print(f"      Class Sections: {courses_data[0]}")
        print(f"      Unique Courses: {courses_data[1]}")
        print(f"      Completed Evaluations: {courses_data[2]}")
        avg_rating = courses_data[3] if courses_data[3] else 0.0
        print(f"      Average Rating: {avg_rating:.2f}")
        
        # Evaluations endpoint (active period only)
        active_period = session.execute(text("""
            SELECT id FROM evaluation_periods WHERE status = 'active' LIMIT 1
        """)).scalar()
        
        if active_period:
            eval_data = session.execute(text("""
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE sentiment = 'positive') as positive,
                    COUNT(*) FILTER (WHERE sentiment = 'neutral') as neutral,
                    COUNT(*) FILTER (WHERE sentiment = 'negative') as negative
                FROM evaluations
                WHERE evaluation_period_id = :period_id
                AND status = 'completed'
            """), {"period_id": active_period}).fetchone()
            
            print(f"\n   📝 Evaluations Page (Period {active_period}):")
            print(f"      Total: {eval_data[0]}")
            print(f"      Positive: {eval_data[1]}")
            print(f"      Neutral: {eval_data[2]}")
            print(f"      Negative: {eval_data[3]}")
        else:
            print(f"\n   ❌ Evaluations Page: NO ACTIVE PERIOD")
        
        # Sentiment Analysis
        sentiment_data = session.execute(text("""
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE submission_date IS NOT NULL) as with_date,
                MIN(submission_date) as earliest,
                MAX(submission_date) as latest
            FROM evaluations
            WHERE status = 'completed'
            AND sentiment IS NOT NULL
        """)).fetchone()
        
        print(f"\n   📈 Sentiment Analysis Page:")
        print(f"      Total with Sentiment: {sentiment_data[0]}")
        print(f"      With Submission Date: {sentiment_data[1]}")
        if sentiment_data[2]:
            print(f"      Date Range: {sentiment_data[2]} to {sentiment_data[3]}")
        
        # Anomalies
        anomaly_count = session.execute(text("""
            SELECT COUNT(*) FROM evaluations WHERE is_anomaly = true
        """)).scalar()
        
        print(f"\n   ⚠️ Anomalies Page:")
        print(f"      Detected Anomalies: {anomaly_count}")
        
        # Completion Rates
        completion_data = session.execute(text("""
            WITH section_stats AS (
                SELECT 
                    cs.id,
                    COUNT(DISTINCT en.student_id) as enrolled,
                    COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.id END) as completed,
                    ROUND((COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.id END)::numeric / 
                           NULLIF(COUNT(DISTINCT en.student_id), 0) * 100), 1) as rate
                FROM class_sections cs
                LEFT JOIN enrollments en ON cs.id = en.class_section_id AND en.status = 'active'
                LEFT JOIN evaluations e ON cs.id = e.class_section_id AND en.student_id = e.student_id
                GROUP BY cs.id
                HAVING COUNT(DISTINCT en.student_id) > 0
            )
            SELECT 
                COUNT(DISTINCT id) as sections_with_enrollments,
                SUM(enrolled) as total_enrolled,
                SUM(completed) as total_completed,
                AVG(rate) as avg_completion_rate
            FROM section_stats
        """)).fetchone()
        
        print(f"\n   📊 Completion Tracker:")
        print(f"      Sections with Enrollments: {completion_data[0]}")
        print(f"      Total Enrolled: {completion_data[1]}")
        print(f"      Total Completed: {completion_data[2]}")
        avg_rate = completion_data[3] if completion_data[3] else 0.0
        print(f"      Avg Completion Rate: {avg_rate:.1f}%")
        
        # ============================================================
        # 5. CRITICAL ISSUES SUMMARY
        # ============================================================
        print_section("5. CRITICAL ISSUES SUMMARY")
        
        issues = []
        warnings = []
        
        # Check for missing tables
        missing_tables = [t for t in required_tables if t not in tables]
        if missing_tables:
            issues.append(f"Missing tables: {', '.join(missing_tables)}")
        
        # Check for missing columns
        missing_cols = [c for c in critical_columns if c not in eval_columns]
        if missing_cols:
            issues.append(f"Missing evaluations columns: {', '.join(missing_cols)}")
        
        # Check active period
        if not active_period:
            issues.append("No active evaluation period - most endpoints will return empty data")
        
        # Check data completeness
        if eval_status and eval_status[0][2] == 0:
            issues.append("No evaluations in database")
        
        if enroll_check[1] == 0:
            warnings.append("No active enrollments found")
        
        if sentiment_data[0] == 0:
            warnings.append("No sentiment data populated")
        
        if anomaly_count == 0:
            warnings.append("No anomalies detected (acceptable for demo)")
        
        if issues:
            print("\n❌ CRITICAL ISSUES:")
            for i, issue in enumerate(issues, 1):
                print(f"   {i}. {issue}")
        else:
            print("\n✅ NO CRITICAL ISSUES FOUND")
        
        if warnings:
            print("\n⚠️ WARNINGS:")
            for i, warning in enumerate(warnings, 1):
                print(f"   {i}. {warning}")
        
        # ============================================================
        # 6. RECOMMENDATIONS
        # ============================================================
        print_section("6. RECOMMENDATIONS")
        
        print("\n💡 System Health:")
        if not issues and not warnings:
            print("   ✅ System is healthy and ready for use")
        elif issues:
            print("   ❌ Critical issues need immediate attention")
        else:
            print("   ⚠️ System functional but has minor issues")
        
        print("\n📝 Action Items:")
        if not active_period:
            print("   1. Set an evaluation period to status='active'")
        if sentiment_data[0] == 0:
            print("   2. Run sentiment analysis on completed evaluations")
        if eval_status and eval_status[0][2] < 50:
            print("   3. Generate more test evaluation data")
        
        print("\n" + "█" * 80)
        print("█" + "  AUDIT COMPLETE".center(78) + "█")
        print("█" * 80 + "\n")
        
    except Exception as e:
        print(f"\n❌ AUDIT ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

if __name__ == "__main__":
    main()
