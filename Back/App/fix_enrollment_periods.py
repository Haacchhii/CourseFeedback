"""
Fix enrollments that are missing evaluation_period_id.
Run this once to update all existing enrollments.
"""
import os
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv('DATABASE_URL')
print('Connecting to database...')
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Get active period ID
    result = conn.execute(text("SELECT id, name FROM evaluation_periods WHERE status = 'active' LIMIT 1"))
    period = result.fetchone()
    
    if period:
        print(f'Active period: ID={period[0]}, Name={period[1]}')
        
        # Count enrollments without period
        count_result = conn.execute(text("SELECT COUNT(*) FROM enrollments WHERE evaluation_period_id IS NULL"))
        missing_count = count_result.fetchone()[0]
        print(f'Enrollments without evaluation_period_id: {missing_count}')
        
        if missing_count > 0:
            # Update all enrollments that don't have evaluation_period_id
            update_result = conn.execute(
                text("UPDATE enrollments SET evaluation_period_id = :period_id WHERE evaluation_period_id IS NULL"),
                {'period_id': period[0]}
            )
            conn.commit()
            print(f'Updated {update_result.rowcount} enrollments with evaluation_period_id={period[0]}')
        else:
            print('No enrollments need updating.')
    else:
        print('No active evaluation period found!')
