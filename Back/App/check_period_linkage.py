"""
Check what is linked to evaluation periods
"""

from database.connection import get_db
from sqlalchemy import text

db = next(get_db())

print("="*80)
print("CHECKING EVALUATION PERIOD RELATIONSHIPS")
print("="*80)

# 1. Check evaluation_periods table structure
print("\n1. EVALUATION_PERIODS TABLE STRUCTURE:")
columns = db.execute(text("""
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'evaluation_periods'
    ORDER BY ordinal_position
""")).fetchall()

for col in columns:
    print(f"   - {col[0]}: {col[1]} (nullable: {col[2]})")

# 2. Check evaluations table - does it have evaluation_period_id?
print("\n2. EVALUATIONS TABLE - evaluation_period_id column:")
eval_period_col = db.execute(text("""
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'evaluations' AND column_name = 'evaluation_period_id'
""")).fetchone()

if eval_period_col:
    print(f"   ✅ EXISTS: {eval_period_col[0]} ({eval_period_col[1]}, nullable: {eval_period_col[2]})")
    
    # Count evaluations with and without period linkage
    linked = db.execute(text("""
        SELECT COUNT(*) FROM evaluations WHERE evaluation_period_id IS NOT NULL
    """)).scalar()
    
    not_linked = db.execute(text("""
        SELECT COUNT(*) FROM evaluations WHERE evaluation_period_id IS NULL
    """)).scalar()
    
    print(f"   - Evaluations WITH period link: {linked}")
    print(f"   - Evaluations WITHOUT period link: {not_linked}")
else:
    print("   ❌ DOES NOT EXIST")

# 3. Check enrollments table - does it have evaluation_period_id?
print("\n3. ENROLLMENTS TABLE - evaluation_period_id column:")
enr_period_col = db.execute(text("""
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'enrollments' AND column_name = 'evaluation_period_id'
""")).fetchone()

if enr_period_col:
    print(f"   ✅ EXISTS: {enr_period_col[0]} ({enr_period_col[1]}, nullable: {enr_period_col[2]})")
    
    # Count enrollments with and without period linkage
    linked = db.execute(text("""
        SELECT COUNT(*) FROM enrollments WHERE evaluation_period_id IS NOT NULL
    """)).scalar()
    
    not_linked = db.execute(text("""
        SELECT COUNT(*) FROM enrollments WHERE evaluation_period_id IS NULL
    """)).scalar()
    
    print(f"   - Enrollments WITH period link: {linked}")
    print(f"   - Enrollments WITHOUT period link: {not_linked}")
else:
    print("   ❌ DOES NOT EXIST")

# 4. Show actual data examples
print("\n4. SAMPLE DATA - Evaluations:")
sample_evals = db.execute(text("""
    SELECT 
        e.id,
        e.student_id,
        e.class_section_id,
        e.evaluation_period_id,
        e.submission_date,
        ep.name as period_name
    FROM evaluations e
    LEFT JOIN evaluation_periods ep ON e.evaluation_period_id = ep.id
    LIMIT 5
""")).fetchall()

for row in sample_evals:
    print(f"   Eval ID {row[0]}: student={row[1]}, section={row[2]}, period_id={row[3]}, period_name={row[5]}")

print("\n5. SAMPLE DATA - Enrollments:")
sample_enr = db.execute(text("""
    SELECT 
        e.id,
        e.student_id,
        e.class_section_id,
        e.evaluation_period_id,
        e.enrollment_date,
        ep.name as period_name
    FROM enrollments e
    LEFT JOIN evaluation_periods ep ON e.evaluation_period_id = ep.id
    LIMIT 5
""")).fetchall()

for row in sample_enr:
    print(f"   Enroll ID {row[0]}: student={row[1]}, section={row[2]}, period_id={row[3]}, period_name={row[5]}")

# 6. Check foreign key relationships
print("\n6. FOREIGN KEY CONSTRAINTS:")
fks = db.execute(text("""
    SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'evaluation_periods'
    ORDER BY tc.table_name
""")).fetchall()

if fks:
    for fk in fks:
        print(f"   {fk[0]}.{fk[1]} -> {fk[2]}.{fk[3]}")
else:
    print("   No foreign key constraints found pointing to evaluation_periods")

# 7. Explanation
print("\n" + "="*80)
print("EXPLANATION:")
print("="*80)
print("""
The system has TWO tables that should reference evaluation_periods:

1. EVALUATIONS table
   - This tracks individual student evaluation submissions
   - MUST have evaluation_period_id to know WHEN the evaluation was done
   
2. ENROLLMENTS table  
   - This tracks which students are enrolled in which class sections
   - SHOULD have evaluation_period_id to know WHICH PERIOD they're enrolled for
   
WHY ENROLLMENTS NEED evaluation_period_id:
   - Students get enrolled for a specific evaluation period
   - Same student can take same course in different periods
   - We need to know "Student X is taking Course Y in Fall 2025 period"
   - Without this link, we can't show students which courses to evaluate NOW
   
EXAMPLE:
   Student John takes CS101 in:
   - Fall 2025 period -> creates enrollment with period_id = 1
   - Spring 2026 period -> creates enrollment with period_id = 2
   
   Without period linkage, we can't tell which enrollment is for which period!
""")

print("="*80)
