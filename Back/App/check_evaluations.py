from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()
engine = create_engine(os.getenv('DATABASE_URL'))

with engine.connect() as conn:
    # Get active period
    period = conn.execute(text("""
        SELECT id, name FROM evaluation_periods WHERE status = 'Open' LIMIT 1
    """)).fetchone()
    
    if period:
        period_id = period[0]
        print(f"Active Period: {period[1]} (ID: {period_id})")
        print()
        
        # Count enrollments
        enr_count = conn.execute(text("""
            SELECT COUNT(*) FROM enrollments WHERE evaluation_period_id = :pid
        """), {"pid": period_id}).scalar()
        
        # Count evaluations
        eval_count = conn.execute(text("""
            SELECT COUNT(*) FROM evaluations WHERE evaluation_period_id = :pid
        """), {"pid": period_id}).scalar()
        
        print(f"📊 Enrollments: {enr_count}")
        print(f"📝 Evaluations: {eval_count}")
        print()
        
        # Sample evaluations
        print("Sample evaluations:")
        evals = conn.execute(text("""
            SELECT 
                u.first_name || ' ' || u.last_name as student,
                c.subject_code,
                ev.status,
                ev.created_at
            FROM evaluations ev
            JOIN students s ON ev.student_id = s.id
            JOIN users u ON s.user_id = u.id
            JOIN class_sections cs ON ev.class_section_id = cs.id
            JOIN courses c ON cs.course_id = c.id
            WHERE ev.evaluation_period_id = :pid
            ORDER BY ev.created_at DESC
            LIMIT 10
        """), {"pid": period_id}).fetchall()
        
        for e in evals:
            print(f"  {e[0]}: {e[1]} - {e[2]} (created: {e[3]})")
        
        print()
        
        # Count by status
        print("Evaluations by status:")
        statuses = conn.execute(text("""
            SELECT status, COUNT(*) as count
            FROM evaluations
            WHERE evaluation_period_id = :pid
            GROUP BY status
        """), {"pid": period_id}).fetchall()
        
        for s in statuses:
            print(f"  {s[0]}: {s[1]}")
