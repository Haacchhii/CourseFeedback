"""
Update evaluation ratings to include all 31 questions with proper keys.
This script updates existing evaluations with only 6 questions to have all 31 questions.
"""
import os
import sys
import random
import json

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from database.connection import SessionLocal
from sqlalchemy import text

# All 31 question IDs matching the questionnaire config
QUESTION_IDS = [
    # Category I: Relevance of Course (questions 1-6)
    "relevance_subject_knowledge",
    "relevance_practical_skills",
    "relevance_team_work",
    "relevance_leadership",
    "relevance_communication",
    "relevance_positive_attitude",
    # Category II: Course Organization and ILOs (questions 7-11)
    "org_curriculum",
    "org_ilos_known",
    "org_ilos_clear",
    "org_ilos_relevant",
    "org_no_overlapping",
    # Category III: Teaching - Learning (questions 12-18)
    "teaching_tlas_useful",
    "teaching_ila_useful",
    "teaching_tlas_sequenced",
    "teaching_applicable",
    "teaching_motivated",
    "teaching_team_work",
    "teaching_independent",
    # Category IV: Assessment (questions 19-24)
    "assessment_start",
    "assessment_all_topics",
    "assessment_number",
    "assessment_distribution",
    "assessment_allocation",
    "assessment_feedback",
    # Category V: Learning Environment (questions 25-30)
    "environment_classrooms",
    "environment_library",
    "environment_laboratory",
    "environment_computer",
    "environment_internet",
    "environment_facilities_availability",
    # Category VI: Counseling (question 31)
    "counseling_available"
]

def update_evaluation_ratings():
    """Update all evaluations with full 31-question ratings."""
    db = SessionLocal()
    
    try:
        # Get all evaluations
        result = db.execute(text("""
            SELECT id, rating_teaching, rating_content, rating_engagement, rating_overall
            FROM evaluations
            ORDER BY id
        """)).fetchall()
        
        print(f"Found {len(result)} evaluations to update")
        
        for row in result:
            eval_id = row[0]
            rating_teaching = row[1] or 3
            rating_content = row[2] or 3
            rating_engagement = row[3] or 3
            rating_overall = row[4] or 3
            
            # Use base ratings to generate all 31 question ratings
            random.seed(eval_id)  # Consistent random for each evaluation
            
            ratings_dict = {}
            
            # Category I: Relevance of Course (questions 1-6) - based on rating_content
            for i, q_id in enumerate(QUESTION_IDS[0:6]):
                ratings_dict[q_id] = min(4, max(1, rating_content + random.choice([-1, 0, 0, 1])))
            
            # Category II: Course Organization (questions 7-11) - based on rating_overall
            for i, q_id in enumerate(QUESTION_IDS[6:11]):
                ratings_dict[q_id] = min(4, max(1, rating_overall + random.choice([-1, 0, 0, 1])))
            
            # Category III: Teaching-Learning (questions 12-18) - based on rating_teaching
            for i, q_id in enumerate(QUESTION_IDS[11:18]):
                ratings_dict[q_id] = min(4, max(1, rating_teaching + random.choice([-1, 0, 0, 1])))
            
            # Category IV: Assessment (questions 19-24) - based on rating_overall
            for i, q_id in enumerate(QUESTION_IDS[18:24]):
                ratings_dict[q_id] = min(4, max(1, rating_overall + random.choice([-1, 0, 0, 1])))
            
            # Category V: Learning Environment (questions 25-30) - based on rating_engagement
            for i, q_id in enumerate(QUESTION_IDS[24:30]):
                ratings_dict[q_id] = min(4, max(1, rating_engagement + random.choice([-1, 0, 0, 1])))
            
            # Category VI: Counseling (question 31) - based on rating_teaching
            ratings_dict[QUESTION_IDS[30]] = min(4, max(1, rating_teaching + random.choice([-1, 0, 1])))
            
            # Update the evaluation
            db.execute(text("""
                UPDATE evaluations
                SET ratings = CAST(:ratings AS jsonb)
                WHERE id = :eval_id
            """), {
                "eval_id": eval_id,
                "ratings": json.dumps(ratings_dict)
            })
            
            if eval_id % 50 == 0:
                print(f"Updated {eval_id} evaluations...")
        
        db.commit()
        print(f"\n✅ Successfully updated {len(result)} evaluations with 31-question ratings!")
        
        # Verify update
        check = db.execute(text("""
            SELECT id, ratings 
            FROM evaluations 
            LIMIT 1
        """)).fetchone()
        
        if check:
            print(f"\nSample updated evaluation ID={check[0]}:")
            ratings = check[1]
            print(f"Number of questions: {len(ratings)}")
            print(f"First 5 keys: {list(ratings.keys())[:5]}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error updating evaluations: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    update_evaluation_ratings()
