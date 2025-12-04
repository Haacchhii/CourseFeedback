"""
Add evaluation_period_id column to evaluations table
Run this script to add the missing column that the code expects
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from database.connection import get_db

def apply_migration():
    """Apply the evaluation_period_id migration"""
    db = next(get_db())
    
    try:
        print("Starting migration: Add evaluation_period_id to evaluations table...")
        
        # Step 1: Add the column
        print("Step 1: Adding evaluation_period_id column...")
        db.execute(text("""
            ALTER TABLE evaluations 
            ADD COLUMN IF NOT EXISTS evaluation_period_id INTEGER
        """))
        db.commit()
        print("✓ Column added")
        
        # Step 2: Add foreign key
        print("Step 2: Adding foreign key constraint...")
        db.execute(text("""
            ALTER TABLE evaluations
            DROP CONSTRAINT IF EXISTS fk_evaluations_evaluation_period;
            
            ALTER TABLE evaluations
            ADD CONSTRAINT fk_evaluations_evaluation_period
            FOREIGN KEY (evaluation_period_id) 
            REFERENCES evaluation_periods(id) 
            ON DELETE SET NULL
        """))
        db.commit()
        print("✓ Foreign key added")
        
        # Step 3: Create index
        print("Step 3: Creating index...")
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_evaluations_period 
            ON evaluations(evaluation_period_id)
        """))
        db.commit()
        print("✓ Index created")
        
        # Step 4: Backfill existing data
        print("Step 4: Backfilling existing evaluations with period data...")
        result = db.execute(text("""
            UPDATE evaluations ev
            SET evaluation_period_id = enr.evaluation_period_id
            FROM enrollments enr
            WHERE ev.student_id = enr.student_id
            AND ev.class_section_id = enr.class_section_id
            AND ev.evaluation_period_id IS NULL
            AND enr.evaluation_period_id IS NOT NULL
        """))
        db.commit()
        print(f"✓ Backfilled {result.rowcount} evaluations")
        
        # Step 5: Add status column
        print("Step 5: Adding status column...")
        db.execute(text("""
            ALTER TABLE evaluations
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed'
        """))
        db.commit()
        print("✓ Status column added")
        
        # Step 6: Add created_at column
        print("Step 6: Adding created_at column...")
        db.execute(text("""
            ALTER TABLE evaluations
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()
        """))
        db.commit()
        print("✓ Created_at column added")
        
        # Verification
        print("\nVerifying migration...")
        result = db.execute(text("""
            SELECT 
                COUNT(*) as total_evaluations,
                COUNT(evaluation_period_id) as with_period,
                COUNT(*) - COUNT(evaluation_period_id) as without_period
            FROM evaluations
        """)).fetchone()
        
        print(f"\nMigration complete!")
        print(f"Total evaluations: {result[0]}")
        print(f"With period linkage: {result[1]}")
        print(f"Without period linkage: {result[2]}")
        
        if result[2] > 0:
            print(f"\n⚠️  Warning: {result[2]} evaluations could not be linked to a period.")
            print("This is normal for evaluations submitted before the enrollment system was implemented.")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    apply_migration()
