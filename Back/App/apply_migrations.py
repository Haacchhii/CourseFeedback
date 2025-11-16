"""
Apply database migrations to Supabase PostgreSQL
"""
import os
from dotenv import load_dotenv
import psycopg

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')
# Remove SQLAlchemy dialect prefix if present
if DATABASE_URL and DATABASE_URL.startswith('postgresql+psycopg://'):
    DATABASE_URL = DATABASE_URL.replace('postgresql+psycopg://', 'postgresql://')

def apply_migration(migration_file, description):
    """Apply a single migration file"""
    try:
        print(f"\n{'='*60}")
        print(f"Applying: {description}")
        print(f"File: {migration_file}")
        print(f"{'='*60}")
        
        # Read migration file
        with open(migration_file, 'r') as f:
            sql = f.read()
        
        # Connect and execute
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute(sql)
                conn.commit()
        
        print(f"✅ SUCCESS: {description}")
        return True
        
    except Exception as e:
        print(f"❌ ERROR: {description}")
        print(f"Error: {str(e)}")
        return False

def main():
    """Apply all pending migrations"""
    migrations = [
        {
            'file': '../database_schema/11_ADD_MUST_CHANGE_PASSWORD.sql',
            'description': 'Add must_change_password column to users table'
        },
        {
            'file': '../database_schema/12_ADD_PERIOD_ENROLLMENTS.sql',
            'description': 'Add period_enrollments table and evaluation_period_id to enrollments'
        }
    ]
    
    print("\n" + "="*60)
    print("DATABASE MIGRATION SCRIPT")
    print("="*60)
    print(f"Target: Supabase PostgreSQL")
    print(f"Migrations to apply: {len(migrations)}")
    
    results = []
    for migration in migrations:
        result = apply_migration(migration['file'], migration['description'])
        results.append(result)
    
    print("\n" + "="*60)
    print("MIGRATION SUMMARY")
    print("="*60)
    print(f"Total: {len(results)}")
    print(f"Successful: {sum(results)}")
    print(f"Failed: {len(results) - sum(results)}")
    
    if all(results):
        print("\n✅ All migrations applied successfully!")
    else:
        print("\n⚠️ Some migrations failed. Please review the errors above.")

if __name__ == '__main__':
    main()
