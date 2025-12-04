"""
Generate realistic evaluation responses for the 31-question evaluation system
Rating Scale: 1-4 (1=Strongly Disagree, 2=Disagree, 3=Agree, 4=Strongly Agree)
Categories: 6 categories with 31 total questions
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
import random
import json
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/course_feedback')
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

# All 31 question IDs from questionnaireConfig.js
QUESTION_IDS = [
    # Category 1: Relevance of Course (6 questions)
    'relevance_subject_knowledge', 'relevance_practical_skills', 'relevance_team_work',
    'relevance_leadership', 'relevance_communication', 'relevance_positive_attitude',
    
    # Category 2: Course Organization and ILOs (5 questions)
    'org_curriculum', 'org_ilos_known', 'org_ilos_clear', 'org_ilos_relevant', 'org_no_overlapping',
    
    # Category 3: Teaching - Learning (7 questions)
    'teaching_tlas_useful', 'teaching_ila_useful', 'teaching_tlas_sequenced', 'teaching_applicable',
    'teaching_motivated', 'teaching_team_work', 'teaching_independent',
    
    # Category 4: Assessment (6 questions)
    'assessment_start', 'assessment_all_topics', 'assessment_number', 'assessment_distribution',
    'assessment_allocation', 'assessment_feedback',
    
    # Category 5: Learning Environment (6 questions)
    'environment_classrooms', 'environment_library', 'environment_laboratory', 'environment_computer',
    'environment_internet', 'environment_facilities_availability',
    
    # Category 6: Counseling (1 question)
    'counseling_available'
]

# Realistic rating patterns for 1-4 scale
RATING_PATTERNS = {
    'excellent': [4, 4, 4, 4, 4, 3, 4, 4, 4, 4, 4, 4, 3, 4, 4, 4, 4, 4, 4, 3, 4, 4, 4, 4, 4, 4, 4, 3, 4, 4, 4],  # Mostly 4s
    'very_good': [4, 3, 4, 3, 4, 4, 3, 4, 4, 3, 4, 3, 4, 3, 4, 4, 3, 4, 3, 4, 4, 3, 4, 3, 4, 4, 3, 4, 3, 4, 4],  # Mix of 3s and 4s
    'good': [3, 3, 4, 3, 3, 3, 4, 3, 3, 4, 3, 3, 3, 4, 3, 3, 3, 4, 3, 3, 3, 4, 3, 3, 3, 4, 3, 3, 3, 4, 3],       # Mostly 3s
    'average': [3, 2, 3, 3, 2, 3, 3, 2, 3, 3, 2, 3, 3, 2, 3, 3, 2, 3, 3, 2, 3, 3, 2, 3, 3, 2, 3, 3, 2, 3, 3],    # Mix of 2s and 3s
    'needs_improvement': [2, 2, 3, 2, 2, 2, 3, 2, 2, 2, 3, 2, 2, 2, 3, 2, 2, 2, 3, 2, 2, 2, 3, 2, 2, 2, 3, 2, 2, 2, 2], # Mostly 2s
}

COMMENTS = {
    'excellent': [
        "Excellent instructor! Very knowledgeable and engaging throughout the semester.",
        "Best professor I've had. Clear explanations and very helpful during consultations.",
        "Amazing teaching style. Makes difficult topics easy to understand.",
        "Very passionate about the subject. Highly recommended!",
        "Outstanding teacher. Always available for questions and provides great feedback.",
        "The course was well-organized and the instructor was exceptional.",
        "Learned a lot from this course. The instructor is very dedicated.",
        "Great learning experience. The instructor made the subject interesting.",
    ],
    'very_good': [
        "Great instructor. Course material was well presented and easy to follow.",
        "Very good teacher. Explanations are clear and assessment methods are fair.",
        "Enjoyed the class. Learned a lot from this course.",
        "Good teaching methods. Fair grading system and helpful feedback.",
        "Knowledgeable instructor. Course was well organized and engaging.",
        "The instructor was supportive and made learning enjoyable.",
        "Good course overall. The practical activities were very helpful.",
    ],
    'good': [
        "Good teacher overall. Some topics could be explained better.",
        "Decent course. Instructor knows the material well.",
        "Fair instructor. Course met my expectations.",
        "Good class. Would recommend to others.",
        "Instructor is helpful during consultation hours.",
        "The course was informative and well-structured.",
        "Good learning environment. The facilities were adequate.",
    ],
    'average': [
        "Course was okay. Some parts were confusing and need clarification.",
        "Average teaching style. Could improve on student engagement.",
        "Learned the basics. Needs more practical examples and activities.",
        "Fair course. Some topics need more clarity and better organization.",
        "Okay instructor. Course pace was sometimes too fast.",
        "The assessments were fair but feedback could be more timely.",
    ],
    'needs_improvement': [
        "Difficult to understand some lessons. More examples would help.",
        "Course needs better organization and clearer explanations.",
        "More practical activities and examples would be beneficial.",
        "Lectures can be improved with better teaching methods.",
        "Would appreciate more detailed explanations and better pacing.",
        "The course material was challenging without adequate support.",
    ]
}

def get_pattern_category():
    """Randomly choose a rating pattern weighted towards positive feedback"""
    weights = {
        'excellent': 35,
        'very_good': 40,
        'good': 15,
        'average': 8,
        'needs_improvement': 2
    }
    categories = list(weights.keys())
    return random.choices(categories, weights=list(weights.values()))[0]

def generate_responses():
    """Generate realistic responses for all 31 evaluation questions (1-4 scale)"""
    category = get_pattern_category()
    base_ratings = RATING_PATTERNS[category].copy()
    
    # Create responses dictionary
    responses = {}
    for i, question_id in enumerate(QUESTION_IDS):
        rating = base_ratings[i]
        # Add slight variation (20% chance to vary by ±1)
        if random.random() < 0.2:
            rating = max(1, min(4, rating + random.choice([-1, 0, 1])))
        responses[question_id] = rating
    
    # Add comment (60% chance of leaving a comment)
    comment = ""
    if random.random() < 0.6:
        comment = random.choice(COMMENTS[category])
    
    return responses, category, comment

def main():
    session = Session()
    
    try:
        print("=" * 80)
        print("GENERATING REALISTIC EVALUATION RESPONSES (31 Questions, 1-4 Scale)")
        print("=" * 80)
        print()
        
        # Get active period
        period = session.execute(text("""
            SELECT id, name FROM evaluation_periods WHERE status = 'Open' LIMIT 1
        """)).fetchone()
        
        if not period:
            print("❌ No open evaluation period found!")
            return
        
        period_id = period[0]
        print(f"✅ Active Period: {period[1]}")
        print()
        
        # Get pending evaluations
        pending = session.execute(text("""
            SELECT 
                ev.id,
                u.first_name || ' ' || u.last_name as student_name,
                c.subject_code,
                ev.status
            FROM evaluations ev
            JOIN students s ON ev.student_id = s.id
            JOIN users u ON s.user_id = u.id
            JOIN class_sections cs ON ev.class_section_id = cs.id
            JOIN courses c ON cs.course_id = c.id
            WHERE ev.evaluation_period_id = :period_id
            AND ev.status = 'pending'
            ORDER BY RANDOM()
        """), {"period_id": period_id}).fetchall()
        
        print(f"📝 Found {len(pending)} pending evaluations")
        print()
        
        if len(pending) == 0:
            print("✅ All evaluations already completed!")
            
            # Show current stats
            stats = session.execute(text("""
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                    ROUND(AVG(rating_overall::numeric), 2) as avg_rating
                FROM evaluations
                WHERE evaluation_period_id = :period_id
            """), {"period_id": period_id}).fetchone()
            
            print(f"Current Stats:")
            print(f"  Total: {stats[0]}")
            print(f"  Completed: {stats[1]}")
            print(f"  Pending: {stats[2]}")
            print(f"  Average Rating: {stats[3]}/4.00")
            return
        
        # Determine how many to complete (leave 20-30% pending for realistic demo)
        total = len(pending)
        complete_percentage = random.uniform(0.70, 0.80)  # 70-80% completion rate
        complete_count = int(total * complete_percentage)
        to_complete = pending[:complete_count]
        
        print(f"Will complete {complete_count} evaluations (leaving {total - complete_count} pending)")
        print(f"Completion rate: {complete_percentage*100:.1f}%")
        print()
        
        completed = 0
        rating_distribution = {
            'excellent': 0,
            'very_good': 0,
            'good': 0,
            'average': 0,
            'needs_improvement': 0
        }
        
        for eval_record in to_complete:
            eval_id = eval_record[0]
            student_name = eval_record[1]
            subject_code = eval_record[2]
            
            # Generate responses for all 31 questions
            responses, category, comment = generate_responses()
            rating_distribution[category] += 1
            
            # Calculate averages (all questions have equal weight)
            rating_values = list(responses.values())
            avg_rating = sum(rating_values) / len(rating_values)
            
            # Convert responses to JSON
            ratings_json = json.dumps(responses)
            
            # Update evaluation
            session.execute(text("""
                UPDATE evaluations
                SET 
                    ratings = CAST(:ratings AS jsonb),
                    text_feedback = :text_feedback,
                    rating_teaching = :rating_teaching,
                    rating_content = :rating_content,
                    rating_engagement = :rating_engagement,
                    rating_overall = :rating_overall,
                    status = 'completed',
                    submission_date = NOW(),
                    created_at = NOW()
                WHERE id = :eval_id
            """), {
                'eval_id': eval_id,
                'ratings': ratings_json,
                'text_feedback': comment,
                'rating_teaching': int(round(avg_rating)),
                'rating_content': int(round(avg_rating)),
                'rating_engagement': int(round(avg_rating)),
                'rating_overall': int(round(avg_rating))
            })
            
            completed += 1
            if completed % 10 == 0:
                print(f"   ✓ Completed {completed}/{complete_count} evaluations...")
        
        session.commit()
        
        print()
        print("=" * 80)
        print(f"✅ Successfully generated {completed} evaluation responses!")
        print("=" * 80)
        print()
        
        print("Rating Distribution:")
        for category, count in rating_distribution.items():
            percentage = (count / completed * 100) if completed > 0 else 0
            bar = '█' * int(percentage / 2)
            print(f"  {category.replace('_', ' ').title():<20} {count:>3} ({percentage:>5.1f}%) {bar}")
        
        print()
        
        # Show final summary
        summary = session.execute(text("""
            SELECT 
                status,
                COUNT(*) as count,
                ROUND(AVG(rating_overall::numeric), 2) as avg_rating
            FROM evaluations
            WHERE evaluation_period_id = :period_id
            GROUP BY status
            ORDER BY status DESC
        """), {"period_id": period_id}).fetchall()
        
        print("Final Evaluation Status:")
        for row in summary:
            avg_rating = row[2] if row[2] else 0
            print(f"  {row[0].upper():<12} {row[1]:>3} evaluations (Avg: {avg_rating:.2f}/4.00)")
        
        print()
        print("Sample completed evaluations:")
        samples = session.execute(text("""
            SELECT 
                u.first_name || ' ' || u.last_name as student,
                c.subject_code,
                ev.rating_overall as avg_rating,
                CASE 
                    WHEN text_feedback IS NOT NULL AND text_feedback != '' THEN 'Yes'
                    ELSE 'No'
                END as has_comment
            FROM evaluations ev
            JOIN students s ON ev.student_id = s.id
            JOIN users u ON s.user_id = u.id
            JOIN class_sections cs ON ev.class_section_id = cs.id
            JOIN courses c ON cs.course_id = c.id
            WHERE ev.evaluation_period_id = :period_id
            AND ev.status = 'completed'
            ORDER BY RANDOM()
            LIMIT 5
        """), {"period_id": period_id}).fetchall()
        
        for s in samples:
            comment_status = "with comment" if s[3] == 'Yes' else "no comment"
            rating = s[2] if s[2] else 0
            print(f"  {s[0]:<30} {s[1]:<10} {rating}/4 ({comment_status})")
        
        print()
        print("✅ Demo data generated successfully for thesis presentation!")
        print("   - 31 questions per evaluation")
        print("   - 1-4 rating scale (Strongly Disagree to Strongly Agree)")
        print("   - Realistic distribution with 70-80% completion rate")
        print("   - Weighted towards positive feedback (realistic)")
        
    except Exception as e:
        session.rollback()
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

if __name__ == "__main__":
    main()
