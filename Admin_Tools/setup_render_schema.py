"""
Setup Render PostgreSQL Database Schema
Run this BEFORE migrating data
"""
import psycopg2
import os
import glob

# Render PostgreSQL
RENDER_URL = "postgresql://coursefeedback_user:RsqgOp2Cf4gRiY8PPHKgAKV15jYytMTL@dpg-d4orgtvgi27c73cfu4h0-a.oregon-postgres.render.com/coursefeedback_piea"

SCHEMA_DIR = "Back/database_schema"

# Use the complete database setup file
SCHEMA_FILES = [
    "DATABASE_COMPLETE_SETUP.sql",
]

def execute_sql_file(conn, cursor, filepath):
    """Execute SQL commands from a file"""
    print(f"\n📄 Executing: {os.path.basename(filepath)}")
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            sql = f.read()
            
        # Remove comments
        lines = sql.split('\n')
        clean_lines = [line for line in lines if not line.strip().startswith('--')]
        sql = '\n'.join(clean_lines)
            
        # Execute the whole file at once
        cursor.execute(sql)
        conn.commit()
        
        print(f"  ✅ Completed {os.path.basename(filepath)}")
        return True
        
    except Exception as e:
        print(f"  ❌ Error in {os.path.basename(filepath)}: {e}")
        conn.rollback()
        return False

def main():
    print("=" * 60)
    print("🔧 Setting up Render PostgreSQL Database Schema")
    print("=" * 60)
    
    # Connect to Render
    print("\n🔌 Connecting to Render PostgreSQL...")
    try:
        conn = psycopg2.connect(RENDER_URL)
        conn.autocommit = False  # Use transactions
        cursor = conn.cursor()
        print("  ✅ Connected to Render")
    except Exception as e:
        print(f"  ❌ Failed to connect: {e}")
        return
    
    # Execute schema files
    success_count = 0
    for filename in SCHEMA_FILES:
        filepath = os.path.join(SCHEMA_DIR, filename)
        if os.path.exists(filepath):
            if execute_sql_file(conn, cursor, filepath):
                success_count += 1
        else:
            print(f"\n⚠️  File not found: {filepath}")
    
    # Close connection
    cursor.close()
    conn.close()
    
    print("\n" + "=" * 60)
    print(f"✅ Schema setup complete! ({success_count}/{len(SCHEMA_FILES)} files)")
    print("=" * 60)
    print("\n🚀 Now you can run: python migrate_database.py")

if __name__ == "__main__":
    main()
