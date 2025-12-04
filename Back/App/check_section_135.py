"""
Check Section 135 Evaluations Data
Verify what data exists for the section shown in screenshot
"""
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
        # Get section 135 details (from screenshot: Comp 6-BSIT-3A)
        print("\n" + "=" * 70)
        print("CHECKING SECTION 135 - Applications Development and Emerging Tech")
        print("=" * 70)
        
        # Find the section
        section_data = session.execute(text("""
            SELECT cs.id, cs.class_code, c.subject_code, c.subject_name, cs.semester, cs.academic_year
            FROM class_sections cs
            JOIN courses c ON cs.course_id = c.id
            WHERE cs.id = 135
        """)).fetchone()
        
        if not section_data:
            print("❌ Section 135 not found!")
            return
        
        print(f"\n📚 Section Info:")
        print(f"   ID: {section_data[0]}")
        print(f"   Class Code: {section_data[1]}")
        print(f"   Course: {section_data[2]} - {section_data[3]}")
        print(f"   Semester: {section_data[4]}")
        print(f"   Academic Year: {section_data[5]}")
        
        # Check enrollments
        enrollments = session.execute(text("""
            SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'active')
            FROM enrollments
            WHERE class_section_id = 135
        """)).fetchone()
        
        print(f"\n👥 Enrollments:")
        print(f"   Total: {enrollments[0]}")
        print(f"   Active: {enrollments[1]}")
        
        # Check evaluations
        evals = session.execute(text("""
            SELECT 
                id,
                student_id,
                status,
                rating_overall,
                rating_teaching,
                rating_content,
                rating_engagement,
                ratings,
                sentiment,
                submission_date
            FROM evaluations
            WHERE class_section_id = 135
            ORDER BY status DESC, id
        """)).fetchall()
        
        print(f"\n📝 Evaluations: {len(evals)} total")
        print()
        
        completed_count = 0
        completed_with_ratings = 0
        
        for i, ev in enumerate(evals, 1):
            print(f"   Evaluation {i}:")
            print(f"      ID: {ev[0]}")
            print(f"      Student ID: {ev[1]}")
            print(f"      Status: {ev[2]}")
            print(f"      Rating Overall: {ev[3]}")
            print(f"      Rating Teaching: {ev[4]}")
            print(f"      Rating Content: {ev[5]}")
            print(f"      Rating Engagement: {ev[6]}")
            
            if ev[2] == 'completed':
                completed_count += 1
                
            # Check JSONB ratings
            if ev[7]:
                ratings_dict = ev[7] if isinstance(ev[7], dict) else json.loads(ev[7])
                print(f"      JSONB Ratings: {len(ratings_dict)} questions")
                print(f"      Sample: {dict(list(ratings_dict.items())[:3])}")
                if ev[2] == 'completed':
                    completed_with_ratings += 1
            else:
                print(f"      JSONB Ratings: NULL/Empty ❌")
            
            print(f"      Sentiment: {ev[8]}")
            print(f"      Submitted: {ev[9]}")
            print()
        
        print("\n" + "=" * 70)
        print(f"SUMMARY:")
        print(f"   Total Evaluations: {len(evals)}")
        print(f"   Completed: {completed_count}")
        print(f"   Completed with JSONB ratings: {completed_with_ratings}")
        print("=" * 70)
        
        # Test the actual query used by backend
        print("\n" + "=" * 70)
        print("TESTING BACKEND QUERY:")
        print("=" * 70)
        
        backend_query = session.execute(text("""
            SELECT 
                e.id,
                e.rating_overall,
                e.ratings
            FROM evaluations e
            WHERE e.class_section_id = 135
            AND e.status = 'completed'
        """)).fetchall()
        
        print(f"\nBackend query returns: {len(backend_query)} evaluations")
        
        if backend_query:
            ratings_sum = sum(ev[1] for ev in backend_query if ev[1] is not None)
            ratings_count = sum(1 for ev in backend_query if ev[1] is not None)
            avg_rating = ratings_sum / ratings_count if ratings_count > 0 else 0.0
            
            print(f"Overall rating calculation: {ratings_sum}/{ratings_count} = {avg_rating:.2f}")
            print(f"\nFirst evaluation:")
            print(f"   ID: {backend_query[0][0]}")
            print(f"   rating_overall: {backend_query[0][1]}")
            print(f"   ratings (JSONB): {backend_query[0][2]}")
        else:
            print("❌ No completed evaluations found by backend query!")
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

if __name__ == "__main__":
    main()
