"""
Check and create instructors table if it doesn't exist
"""
import sys
from pathlib import Path
from database.connection import engine
from sqlalchemy import text

def check_and_create_instructors_table():
    """Check if instructors table exists and create if needed"""
    
    print("=" * 70)
    print("CHECKING INSTRUCTORS TABLE")
    print("=" * 70)
    
    with engine.connect() as conn:
        try:
            # Check if table exists
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'instructors'
                );
            """))
            table_exists = result.scalar()
            
            if table_exists:
                # Count instructors
                count_result = conn.execute(text("SELECT COUNT(*) FROM instructors"))
                count = count_result.scalar()
                print(f"\n✅ Instructors table already exists")
                print(f"📊 Current instructors: {count}")
                
                # List instructors
                instructors = conn.execute(text("""
                    SELECT i.id, i.name, i.department, u.email
                    FROM instructors i
                    JOIN users u ON i.user_id = u.id
                    ORDER BY i.id
                """)).fetchall()
                
                if instructors:
                    print("\n👥 Instructor List:")
                    for instructor in instructors:
                        print(f"  ID {instructor.id}: {instructor.name} ({instructor.department}) - {instructor.email}")
                
                return True
            else:
                print("\n⚠️ Instructors table NOT FOUND")
                print("📝 Creating instructors table...")
                
                # Read and execute migration file
                migration_file = Path(__file__).parent.parent / "database_schema" / "07_ADD_INSTRUCTORS_TABLE.sql"
                
                if not migration_file.exists():
                    print(f"❌ Migration file not found: {migration_file}")
                    return False
                
                # Read SQL file
                with open(migration_file, 'r') as f:
                    sql = f.read()
                
                # Execute migration (split by semicolons, skip DO blocks for now)
                trans = conn.begin()
                try:
                    # Execute the main SQL
                    conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS instructors (
                            id SERIAL PRIMARY KEY,
                            user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                            name VARCHAR(255) NOT NULL,
                            department VARCHAR(255),
                            specialization VARCHAR(255),
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        );
                    """))
                    
                    conn.execute(text("""
                        CREATE INDEX IF NOT EXISTS idx_instructors_user_id ON instructors(user_id);
                    """))
                    
                    conn.execute(text("""
                        CREATE INDEX IF NOT EXISTS idx_instructors_department ON instructors(department);
                    """))
                    
                    # Migrate existing instructor users
                    result = conn.execute(text("""
                        INSERT INTO instructors (user_id, name, department, created_at)
                        SELECT 
                            u.id,
                            CONCAT(u.first_name, ' ', u.last_name) as name,
                            u.department,
                            u.created_at
                        FROM users u
                        WHERE u.role = 'instructor'
                          AND NOT EXISTS (
                            SELECT 1 FROM instructors i WHERE i.user_id = u.id
                          )
                        RETURNING id
                    """))
                    
                    migrated_count = len(result.fetchall())
                    
                    trans.commit()
                    
                    print(f"\n✅ Instructors table created successfully")
                    print(f"📊 Migrated {migrated_count} existing instructor user(s)")
                    
                    # Verify
                    count_result = conn.execute(text("SELECT COUNT(*) FROM instructors"))
                    final_count = count_result.scalar()
                    print(f"📊 Total instructors: {final_count}")
                    
                    return True
                    
                except Exception as e:
                    trans.rollback()
                    print(f"❌ Error during migration: {e}")
                    import traceback
                    traceback.print_exc()
                    return False
                    
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    try:
        success = check_and_create_instructors_table()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
