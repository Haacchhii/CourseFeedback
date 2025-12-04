"""
Simplified: Generate test evaluations based on existing enrollments for active period
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/course_feedback')
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

def main():
    session = Session()
    
    try:
        print("=" * 80)
        print("GENERATING TEST EVALUATIONS FOR ACTIVE PERIOD")
        print("=" * 80)
        print()
        
        # Get active period
        period = session.execute(text("""
            SELECT id, name, semester, academic_year
            FROM evaluation_periods
            WHERE status = 'Open'
            ORDER BY created_at DESC LIMIT 1
        """)).fetchone()
        
        if not period:
            print("❌ No open evaluation period found!")
            return
        
        period_id = period[0]
        print(f"✅ Active Period: {period[1]}")
        print(f"   Semester: {period[2]}, Academic Year: {period[3]}")
        print()
        
        # Get all enrollments for this period that don't have evaluations yet
        query = text("""
            SELECT 
                e.student_id,
                e.class_section_id,
                s.student_number,
                u.first_name,
                u.last_name,
                c.subject_code,
                c.subject_name
            FROM enrollments e
            INNER JOIN students s ON e.student_id = s.id
            INNER JOIN users u ON s.user_id = u.id
            INNER JOIN class_sections cs ON e.class_section_id = cs.id
            INNER JOIN courses c ON cs.course_id = c.id
            WHERE e.evaluation_period_id = :period_id
            AND NOT EXISTS (
                SELECT 1 FROM evaluations ev
                WHERE ev.student_id = e.student_id
                AND ev.class_section_id = e.class_section_id
                AND ev.evaluation_period_id = :period_id
            )
            ORDER BY u.last_name, u.first_name, c.subject_code
        """)
        
        enrollments = session.execute(query, {"period_id": period_id}).fetchall()
        
        print(f"📊 Found {len(enrollments)} enrollments needing evaluations")
        print()
        
        if len(enrollments) == 0:
            print("✅ All enrollments already have evaluations!")
            return
        
        # Create evaluations
        created = 0
        for enr in enrollments:
            student_id = enr[0]
            class_section_id = enr[1]
            student_number = enr[2]
            first_name = enr[3]
            last_name = enr[4]
            course_code = enr[5]
            
            # Create evaluation
            session.execute(text("""
                INSERT INTO evaluations (
                    student_id,
                    class_section_id,
                    evaluation_period_id,
                    status,
                    created_at,
                    updated_at
                )
                VALUES (
                    :student_id,
                    :class_section_id,
                    :period_id,
                    'pending',
                    NOW(),
                    NOW()
                )
            """), {
                "student_id": student_id,
                "class_section_id": class_section_id,
                "period_id": period_id
            })
            
            created += 1
            if created % 10 == 0:
                print(f"   Created {created} evaluations...")
        
        session.commit()
        
        print()
        print("=" * 80)
        print(f"✅ Successfully created {created} evaluations!")
        print("=" * 80)
        
        # Show summary by student
        summary = session.execute(text("""
            SELECT 
                u.first_name || ' ' || u.last_name as student_name,
                s.student_number,
                COUNT(*) as evaluation_count
            FROM evaluations ev
            INNER JOIN students s ON ev.student_id = s.id
            INNER JOIN users u ON s.user_id = u.id
            WHERE ev.evaluation_period_id = :period_id
            GROUP BY u.first_name, u.last_name, s.student_number
            ORDER BY u.last_name, u.first_name
            LIMIT 10
        """), {"period_id": period_id}).fetchall()
        
        print()
        print("Sample students with evaluations:")
        for row in summary:
            print(f"  {row[0]} ({row[1]}): {row[2]} evaluations")
        
    except Exception as e:
        session.rollback()
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

if __name__ == "__main__":
    main()
