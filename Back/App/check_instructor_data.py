"""
Check instructor data and class sections
"""
from database.connection import engine
from sqlalchemy import text

with engine.connect() as conn:
    print("=" * 70)
    print("INSTRUCTOR DATA CHECK")
    print("=" * 70)
    
    # Check instructors
    instructors = conn.execute(text("""
        SELECT i.id, i.user_id, i.name, i.department, u.email, u.role
        FROM instructors i
        JOIN users u ON i.user_id = u.id
        ORDER BY i.id
    """)).fetchall()
    
    print(f"\n✅ Total Instructors: {len(instructors)}")
    for instructor in instructors:
        print(f"  Instructor ID {instructor.id}: {instructor.name}")
        print(f"    User ID: {instructor.user_id}, Email: {instructor.email}, Role: {instructor.role}")
        
        # Check class sections for this instructor
        sections = conn.execute(text("""
            SELECT cs.id, cs.class_code, c.subject_code, c.subject_name
            FROM class_sections cs
            JOIN courses c ON cs.course_id = c.id
            WHERE cs.instructor_id = :user_id
        """), {'user_id': instructor.user_id}).fetchall()
        
        print(f"    Class Sections: {len(sections)}")
        for section in sections:
            print(f"      - {section.class_code}: {section.subject_code} - {section.subject_name}")
        
        # Check evaluations for this instructor
        eval_count = conn.execute(text("""
            SELECT COUNT(*)
            FROM evaluations e
            JOIN class_sections cs ON e.class_section_id = cs.id
            WHERE cs.instructor_id = :user_id
        """), {'user_id': instructor.user_id}).scalar()
        
        print(f"    Evaluations: {eval_count}")
        print()
    
    print("\n" + "=" * 70)
    print("OVERALL STATISTICS")
    print("=" * 70)
    
    # Total class sections
    total_sections = conn.execute(text("SELECT COUNT(*) FROM class_sections")).scalar()
    print(f"Total Class Sections: {total_sections}")
    
    # Sections with instructors
    assigned_sections = conn.execute(text("""
        SELECT COUNT(*) FROM class_sections WHERE instructor_id IS NOT NULL
    """)).scalar()
    print(f"Sections with Instructors: {assigned_sections}")
    
    # Sections without instructors
    unassigned_sections = total_sections - assigned_sections
    print(f"Sections without Instructors: {unassigned_sections}")
    
    # Total evaluations
    total_evals = conn.execute(text("SELECT COUNT(*) FROM evaluations")).scalar()
    print(f"Total Evaluations: {total_evals}")
