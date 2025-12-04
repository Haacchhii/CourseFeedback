"""
Generate test evaluation RESPONSES (answers) for enrolled students
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
import random
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/course_feedback')
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

# Realistic rating patterns
RATING_PATTERNS = {
    'excellent': [5, 5, 5, 5, 4, 5, 5, 4, 5, 5],  # Mostly 5s
    'very_good': [4, 5, 4, 4, 5, 4, 4, 5, 4, 4],  # Mix of 4s and 5s
    'good': [4, 4, 3, 4, 3, 4, 4, 3, 4, 4],       # Mostly 4s with some 3s
    'average': [3, 3, 4, 3, 3, 2, 3, 4, 3, 3],    # Mostly 3s
    'poor': [2, 2, 3, 2, 2, 1, 2, 3, 2, 2],       # Mostly 2s
}

COMMENTS = {
    'excellent': [
        "Excellent instructor! Very knowledgeable and engaging.",
        "Best professor I've had. Clear explanations and very helpful.",
        "Amazing teaching style. Makes difficult topics easy to understand.",
        "Very passionate about the subject. Highly recommended!",
        "Outstanding teacher. Always available for questions.",
    ],
    'very_good': [
        "Great instructor. Course material was well presented.",
        "Very good teacher. Explanations are clear and concise.",
        "Enjoyed the class. Learned a lot from this course.",
        "Good teaching methods. Fair grading system.",
        "Knowledgeable instructor. Course was well organized.",
    ],
    'good': [
        "Good teacher overall. Some topics could be explained better.",
        "Decent course. Instructor knows the material well.",
        "Fair instructor. Course met my expectations.",
        "Good class. Would recommend to others.",
        "Instructor is helpful during consultation hours.",
    ],
    'average': [
        "Course was okay. Some parts were confusing.",
        "Average teaching style. Could improve on engagement.",
        "Learned the basics. Needs more practical examples.",
        "Fair course. Some topics need more clarity.",
        "Okay instructor. Course pace was sometimes too fast.",
    ],
    'poor': [
        "Difficult to understand the lessons.",
        "Course needs better organization.",
        "More examples would be helpful.",
        "Lectures can be improved.",
        "Would appreciate more detailed explanations.",
    ]
}

def get_pattern_category():
    """Randomly choose a rating pattern weighted towards positive"""
    weights = {
        'excellent': 40,
        'very_good': 35,
        'good': 15,
        'average': 8,
        'poor': 2
    }
    categories = list(weights.keys())
    return random.choices(categories, weights=list(weights.values()))[0]

def generate_responses(num_questions=10):
    """Generate realistic responses for evaluation questions"""
    category = get_pattern_category()
    base_ratings = RATING_PATTERNS[category].copy()
    
    # Add slight variation
    responses = {}
    for i in range(1, num_questions + 1):
        if i <= len(base_ratings):
            rating = base_ratings[i-1]
            # Add occasional variation
            if random.random() < 0.2:  # 20% chance
                rating = max(1, min(5, rating + random.choice([-1, 0, 1])))
            responses[f'q{i}'] = rating
        else:
            # For additional questions, use average of previous ratings
            avg = sum(base_ratings) / len(base_ratings)
            responses[f'q{i}'] = max(1, min(5, int(avg + random.choice([-1, 0, 1]))))
    
    # Add comment
    if random.random() < 0.6:  # 60% chance of leaving a comment
        responses['comment'] = random.choice(COMMENTS[category])
    else:
        responses['comment'] = ""
    
    return responses, category

def main():
    session = Session()
    
    try:
        print("=" * 80)
        print("GENERATING EVALUATION RESPONSES FOR ENROLLED STUDENTS")
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
                c.subject_code
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
            return
        
        # Determine how many to complete (leave some pending for demo)
        total = len(pending)
        complete_count = int(total * 0.7)  # Complete 70%, leave 30% pending
        to_complete = pending[:complete_count]
        
        print(f"Will complete {complete_count} evaluations (leaving {total - complete_count} pending)")
        print()
        
        completed = 0
        rating_distribution = {'excellent': 0, 'very_good': 0, 'good': 0, 'average': 0, 'poor': 0}
        
        for eval_record in to_complete:
            eval_id = eval_record[0]
            student_name = eval_record[1]
            subject_code = eval_record[2]
            
            # Generate responses
            responses, category = generate_responses(10)
            rating_distribution[category] += 1
            
            # Calculate average ratings
            avg_rating = sum([responses[f'q{i}'] for i in range(1, 11)]) / 10
            
            # Update evaluation with responses (skip ratings JSONB for now)
            session.execute(text("""
                UPDATE evaluations
                SET 
                    rating_teaching = :rating_teaching,
                    rating_content = :rating_content,
                    rating_engagement = :rating_engagement,
                    rating_overall = :rating_overall,
                    text_feedback = :text_feedback,
                    comments = :comments,
                    status = 'completed',
                    submission_date = NOW(),
                    created_at = NOW()
                WHERE id = :eval_id
            """), {
                'eval_id': eval_id,
                'rating_teaching': round(avg_rating),
                'rating_content': round(avg_rating),
                'rating_engagement': round(avg_rating),
                'rating_overall': round(avg_rating),
                'text_feedback': responses['comment'],
                'comments': responses['comment']
            })
            
            completed += 1
            if completed % 10 == 0:
                print(f"   Completed {completed}/{complete_count} evaluations...")
        
        session.commit()
        
        print()
        print("=" * 80)
        print(f"✅ Successfully generated {completed} evaluation responses!")
        print("=" * 80)
        print()
        
        print("Rating Distribution:")
        for category, count in rating_distribution.items():
            percentage = (count / completed * 100) if completed > 0 else 0
            print(f"  {category.replace('_', ' ').title()}: {count} ({percentage:.1f}%)")
        
        print()
        
        # Show summary
        summary = session.execute(text("""
            SELECT 
                status,
                COUNT(*) as count,
                ROUND(AVG(rating_overall::numeric), 2) as avg_rating
            FROM evaluations
            WHERE evaluation_period_id = :period_id
            GROUP BY status
        """), {"period_id": period_id}).fetchall()
        
        print("Evaluation Status Summary:")
        for row in summary:
            avg_rating = row[2] if row[2] else 0
            print(f"  {row[0].upper()}: {row[1]} evaluations (Avg Rating: {avg_rating:.2f}/5.00)")
        
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
            print(f"  {s[0]}: {s[1]} - {rating}/5 ({comment_status})")
        
    except Exception as e:
        session.rollback()
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

if __name__ == "__main__":
    main()
