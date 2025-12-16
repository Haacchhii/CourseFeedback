"""
Generate Realistic Evaluation Data for BSCS-DS Students
This script creates evaluation records for 23 students with proper sentiment analysis
and anomaly detection data to reflect in staff dashboards.
"""

import os
import sys
import random
from datetime import datetime, timedelta
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text
from database.connection import SessionLocal

# Realistic comments for sentiment analysis
POSITIVE_COMMENTS = [
    "The instructor explains concepts very clearly and makes the subject interesting.",
    "Excellent teaching methods! I learned a lot from this course.",
    "Very knowledgeable instructor who is always willing to help students.",
    "The course content is well-organized and practical.",
    "Great balance of theory and hands-on activities.",
    "The instructor makes complex topics easy to understand.",
    "I appreciate the real-world examples used in class.",
    "Very engaging lectures that keep students attentive.",
    "The instructor is patient and answers all questions thoroughly.",
    "Best course this semester! Highly recommend this instructor.",
    "The projects helped me apply what I learned effectively.",
    "Clear communication and well-prepared lessons.",
    "The instructor creates a positive learning environment.",
    "I feel more confident in this subject now.",
    "Great use of technology and modern teaching tools.",
]

NEUTRAL_COMMENTS = [
    "The course was okay. Some topics could be explained better.",
    "Average teaching quality. Nothing exceptional but adequate.",
    "The content is good but pacing could be improved.",
    "Lectures are informative but could be more engaging.",
    "Course met expectations but didn't exceed them.",
    "The instructor is competent but could interact more with students.",
    "Material is covered well but examples are sometimes lacking.",
    "Acceptable course delivery with room for improvement.",
    "Standard teaching approach. Gets the job done.",
    "Course is fine but additional resources would help.",
]

NEGATIVE_COMMENTS = [
    "The lessons are hard to follow and need better organization.",
    "More practical examples would help understand the concepts.",
    "The pacing is too fast for complex topics.",
    "Needs improvement in explaining difficult concepts.",
    "Would appreciate more interaction during lectures.",
]

SUGGESTIONS = [
    "More hands-on projects would be helpful.",
    "Please provide more examples during lectures.",
    "Consider adding group activities.",
    "Recording lectures for review would be beneficial.",
    "More practice exercises before exams.",
    "Would appreciate more office hours.",
    "Adding real-world case studies would help.",
    "Please slow down during complex topics.",
    "",  # Some evaluations have no suggestions
    "",
    "",
]

def generate_evaluations():
    """Generate evaluation data for all BSCS-DS students"""
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("🎓 GENERATING EVALUATION DATA FOR BSCS-DS STUDENTS")
        print("=" * 60)
        
        # Get active evaluation period
        period_result = db.execute(text("""
            SELECT id, name FROM evaluation_periods 
            WHERE status = 'active' 
            ORDER BY start_date DESC LIMIT 1
        """))
        period = period_result.fetchone()
        
        if not period:
            print("❌ No active evaluation period found!")
            print("Creating a temporary active period...")
            db.execute(text("""
                INSERT INTO evaluation_periods (name, semester, academic_year, start_date, end_date, status, created_at)
                VALUES ('Midterm Evaluation 2025', '1st', '2025-2026', 
                        CURRENT_DATE - INTERVAL '7 days', 
                        CURRENT_DATE + INTERVAL '14 days', 
                        'active', NOW())
                ON CONFLICT DO NOTHING
            """))
            db.commit()
            period_result = db.execute(text("SELECT id, name FROM evaluation_periods WHERE status = 'active' LIMIT 1"))
            period = period_result.fetchone()
        
        period_id = period[0]
        print(f"✅ Using evaluation period: {period[1]} (ID: {period_id})")
        
        # Get all BSCS-DS students
        students_result = db.execute(text("""
            SELECT s.id, s.student_number, u.first_name, u.last_name
            FROM students s
            JOIN users u ON s.user_id = u.id
            JOIN programs p ON s.program_id = p.id
            WHERE p.program_code = 'BSCS-DS'
            ORDER BY s.id
        """))
        students = students_result.fetchall()
        
        if not students:
            print("❌ No BSCS-DS students found!")
            return
        
        print(f"✅ Found {len(students)} BSCS-DS students")
        
        # Get class sections with enrollments for these students
        sections_result = db.execute(text("""
            SELECT DISTINCT cs.id, cs.class_code, c.subject_name
            FROM class_sections cs
            JOIN courses c ON cs.course_id = c.id
            JOIN enrollments e ON e.class_section_id = cs.id
            JOIN students s ON e.student_id = s.id
            JOIN programs p ON s.program_id = p.id
            WHERE p.program_code = 'BSCS-DS'
            ORDER BY cs.id
        """))
        sections = sections_result.fetchall()
        
        if not sections:
            print("❌ No class sections found with BSCS-DS student enrollments!")
            return
        
        print(f"✅ Found {len(sections)} class sections with enrollments")
        
        # Clear existing evaluations for these students (to avoid duplicates)
        student_ids = [s[0] for s in students]
        print(f"\n🗑️  Clearing existing evaluations for {len(student_ids)} students...")
        
        # Use ANY array syntax for PostgreSQL
        db.execute(text("""
            DELETE FROM evaluations 
            WHERE student_id = ANY(:student_ids)
        """), {"student_ids": student_ids})
        db.commit()
        
        # Generate evaluations
        evaluations_created = 0
        positive_count = 0
        neutral_count = 0
        negative_count = 0
        anomaly_count = 0
        
        print(f"\n📝 Generating evaluations...")
        
        for student in students:
            student_id = student[0]
            student_number = student[1]
            student_name = f"{student[2]} {student[3]}"
            
            # Get enrollments for this student
            enrollments_result = db.execute(text("""
                SELECT e.class_section_id, cs.class_code, c.subject_name
                FROM enrollments e
                JOIN class_sections cs ON e.class_section_id = cs.id
                JOIN courses c ON cs.course_id = c.id
                WHERE e.student_id = :student_id AND e.status = 'active'
            """), {"student_id": student_id})
            enrollments = enrollments_result.fetchall()
            
            if not enrollments:
                print(f"  ⚠️  {student_name}: No active enrollments")
                continue
            
            for enrollment in enrollments:
                class_section_id = enrollment[0]
                class_code = enrollment[1]
                subject_name = enrollment[2]
                
                # Determine sentiment type (realistic distribution: 65% positive, 25% neutral, 10% negative)
                sentiment_roll = random.random()
                if sentiment_roll < 0.65:
                    sentiment = "positive"
                    sentiment_score = round(random.uniform(0.7, 0.95), 2)
                    comment = random.choice(POSITIVE_COMMENTS)
                    rating_base = random.randint(3, 4)
                    positive_count += 1
                elif sentiment_roll < 0.90:
                    sentiment = "neutral"
                    sentiment_score = round(random.uniform(0.4, 0.69), 2)
                    comment = random.choice(NEUTRAL_COMMENTS)
                    rating_base = random.randint(2, 3)
                    neutral_count += 1
                else:
                    sentiment = "negative"
                    sentiment_score = round(random.uniform(0.1, 0.39), 2)
                    comment = random.choice(NEGATIVE_COMMENTS)
                    rating_base = random.randint(1, 2)
                    negative_count += 1
                
                # Generate ratings with slight variation
                rating_teaching = min(4, max(1, rating_base + random.randint(-1, 1)))
                rating_content = min(4, max(1, rating_base + random.randint(-1, 1)))
                rating_engagement = min(4, max(1, rating_base + random.randint(-1, 1)))
                rating_overall = min(4, max(1, rating_base + random.randint(0, 1)))
                
                # JSONB ratings (question-based format)
                ratings_json = {
                    "1": rating_teaching,
                    "2": rating_content,
                    "3": rating_engagement,
                    "4": rating_overall,
                    "5": min(4, max(1, rating_base + random.randint(-1, 1))),
                    "6": min(4, max(1, rating_base + random.randint(-1, 1))),
                }
                
                # Anomaly detection (2% chance of being flagged as anomaly)
                is_anomaly = random.random() < 0.02
                anomaly_score = None
                anomaly_reason = None
                if is_anomaly:
                    anomaly_score = round(random.uniform(0.7, 0.95), 2)
                    anomaly_reason = random.choice([
                        "Inconsistent rating pattern detected",
                        "Unusual response time pattern",
                        "Rating significantly deviates from course average"
                    ])
                    anomaly_count += 1
                
                suggestion = random.choice(SUGGESTIONS)
                
                # Random submission date within the evaluation period
                days_ago = random.randint(0, 7)
                submission_date = datetime.now() - timedelta(days=days_ago, 
                                                             hours=random.randint(0, 23),
                                                             minutes=random.randint(0, 59))
                
                # Insert evaluation
                db.execute(text("""
                    INSERT INTO evaluations (
                        student_id, class_section_id, evaluation_period_id,
                        rating_teaching, rating_content, rating_engagement, rating_overall,
                        text_feedback, suggestions, ratings,
                        sentiment, sentiment_score, sentiment_confidence,
                        is_anomaly, anomaly_score, anomaly_reason,
                        status, processing_status, processed_at, submission_date
                    ) VALUES (
                        :student_id, :class_section_id, :period_id,
                        :rating_teaching, :rating_content, :rating_engagement, :rating_overall,
                        :text_feedback, :suggestions, :ratings::jsonb,
                        :sentiment, :sentiment_score, :sentiment_confidence,
                        :is_anomaly, :anomaly_score, :anomaly_reason,
                        'completed', 'completed', NOW(), :submission_date
                    )
                """), {
                    "student_id": student_id,
                    "class_section_id": class_section_id,
                    "period_id": period_id,
                    "rating_teaching": rating_teaching,
                    "rating_content": rating_content,
                    "rating_engagement": rating_engagement,
                    "rating_overall": rating_overall,
                    "text_feedback": comment,
                    "suggestions": suggestion if suggestion else None,
                    "ratings": str(ratings_json).replace("'", '"'),
                    "sentiment": sentiment,
                    "sentiment_score": sentiment_score,
                    "sentiment_confidence": round(random.uniform(0.75, 0.95), 2),
                    "is_anomaly": is_anomaly,
                    "anomaly_score": anomaly_score,
                    "anomaly_reason": anomaly_reason,
                    "submission_date": submission_date
                })
                
                evaluations_created += 1
            
            print(f"  ✅ {student_name}: {len(enrollments)} evaluations created")
        
        db.commit()
        
        print("\n" + "=" * 60)
        print("📊 EVALUATION GENERATION SUMMARY")
        print("=" * 60)
        print(f"✅ Total evaluations created: {evaluations_created}")
        print(f"   🟢 Positive: {positive_count} ({positive_count/evaluations_created*100:.1f}%)")
        print(f"   🟡 Neutral: {neutral_count} ({neutral_count/evaluations_created*100:.1f}%)")
        print(f"   🔴 Negative: {negative_count} ({negative_count/evaluations_created*100:.1f}%)")
        print(f"   ⚠️  Anomalies flagged: {anomaly_count}")
        print("=" * 60)
        
        # Verify the data
        verify_result = db.execute(text("""
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN sentiment = 'positive' THEN 1 END) as positive,
                COUNT(CASE WHEN sentiment = 'neutral' THEN 1 END) as neutral,
                COUNT(CASE WHEN sentiment = 'negative' THEN 1 END) as negative,
                COUNT(CASE WHEN is_anomaly = true THEN 1 END) as anomalies,
                AVG(rating_overall) as avg_rating
            FROM evaluations e
            JOIN students s ON e.student_id = s.id
            JOIN programs p ON s.program_id = p.id
            WHERE p.program_code = 'BSCS-DS'
        """))
        stats = verify_result.fetchone()
        
        print("\n📈 VERIFICATION FROM DATABASE:")
        print(f"   Total evaluations: {stats[0]}")
        print(f"   Positive: {stats[1]}, Neutral: {stats[2]}, Negative: {stats[3]}")
        print(f"   Anomalies: {stats[4]}")
        print(f"   Average rating: {float(stats[5]):.2f}/4.0")
        
        print("\n✅ Evaluation data is now ready for staff dashboard!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    generate_evaluations()
