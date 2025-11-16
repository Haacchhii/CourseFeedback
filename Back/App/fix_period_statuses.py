"""
Fix evaluation period statuses in database
Updates 'active'/'draft'/'closed' to 'Open'/'Closed'
"""
import os
from dotenv import load_dotenv
import psycopg

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')
if DATABASE_URL and DATABASE_URL.startswith('postgresql+psycopg://'):
    DATABASE_URL = DATABASE_URL.replace('postgresql+psycopg://', 'postgresql://')

def fix_period_statuses():
    """Update evaluation period statuses to match frontend expectations"""
    try:
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                # Update active/draft to Open
                cur.execute("""
                    UPDATE evaluation_periods 
                    SET status = 'Open' 
                    WHERE status IN ('active', 'draft')
                """)
                open_count = cur.rowcount
                
                # Update closed to Closed
                cur.execute("""
                    UPDATE evaluation_periods 
                    SET status = 'Closed' 
                    WHERE status = 'closed'
                """)
                closed_count = cur.rowcount
                
                conn.commit()
                
                print(f"✅ Updated {open_count} periods to 'Open' status")
                print(f"✅ Updated {closed_count} periods to 'Closed' status")
                print(f"✅ Total periods updated: {open_count + closed_count}")
                
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == '__main__':
    print("Fixing evaluation period statuses...")
    fix_period_statuses()
