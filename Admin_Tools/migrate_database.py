"""
Database Migration Script: Supabase → Render PostgreSQL
Copies all tables and data from Supabase to Render
"""
import psycopg2
from psycopg2.extras import execute_values, Json
import sys
import json

# Source: Supabase (using pooler connection)
SUPABASE_URL = "postgresql://postgres.esdohggqyckrtlpzbyhh:Napakabangis0518@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Target: Render PostgreSQL (get this from Render dashboard)
RENDER_URL = "postgresql://coursefeedback_user:RsqgOp2Cf4gRiY8PPHKgAKV15jYytMTL@dpg-d4orgtvgi27c73cfu4h0-a.oregon-postgres.render.com/coursefeedback_piea"

# Tables to migrate (in order to respect foreign key constraints)
TABLES = [
    'users',
    'programs',
    'program_sections',
    'courses',
    'class_sections',
    'students',
    'department_heads',
    'secretaries',
    'enrollments',
    'section_students',
    'evaluation_periods',
    'evaluations',
    'password_reset_tokens',
    'audit_logs',
    'export_history',
    'system_settings'
]

# Data transformations for specific tables
def transform_row(table_name, row, columns):
    """Transform data to match target schema constraints"""
    row_list = list(row)
    
    if table_name == 'courses':
        # Convert semester 3 (summer) to semester 2
        semester_idx = columns.index('semester') if 'semester' in columns else None
        if semester_idx is not None and row_list[semester_idx] not in (1, 2):
            row_list[semester_idx] = 2  # Convert to semester 2
    
    elif table_name == 'class_sections':
        # Generate section_code if missing
        if 'section_code' in columns:
            section_code_idx = columns.index('section_code')
            if not row_list[section_code_idx]:
                # Generate from course_id and academic_year
                course_id = row_list[columns.index('course_id')] if 'course_id' in columns else 0
                academic_year = row_list[columns.index('academic_year')] if 'academic_year' in columns else 'UNK'
                row_list[section_code_idx] = f"SEC-{course_id}-{academic_year}"
    
    elif table_name == 'audit_logs':
        # Convert dict/JSON fields to Json objects
        if 'details' in columns:
            details_idx = columns.index('details')
            if row_list[details_idx] and isinstance(row_list[details_idx], dict):
                row_list[details_idx] = Json(row_list[details_idx])
    
    return tuple(row_list)

def get_table_columns(source_cursor, target_cursor, table_name):
    """Get common column names that exist in both source and target tables"""
    # Get source columns
    source_cursor.execute(f"""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '{table_name}' AND table_schema = 'public'
        ORDER BY ordinal_position
    """)
    source_cols = set(row[0] for row in source_cursor.fetchall())
    
    # Get target columns
    target_cursor.execute(f"""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '{table_name}' AND table_schema = 'public'
        ORDER BY ordinal_position
    """)
    target_cols = set(row[0] for row in target_cursor.fetchall())
    
    # Only use columns that exist in both
    common_cols = source_cols & target_cols
    
    # Special column mappings for different tables
    if table_name == 'class_sections':
        if 'class_code' in source_cols and 'section_code' in target_cols:
            common_cols.add('section_code')
            common_cols.discard('class_code')
            source_cols.discard('class_code')
            source_cols.add('section_code')
    
    elif table_name == 'students':
        if 'student_number' in source_cols and 'student_id' in target_cols:
            common_cols.add('student_id')
            common_cols.discard('student_number')
            source_cols.discard('student_number')
            source_cols.add('student_id')
    
    if source_cols - target_cols:
        print(f"  ℹ️  Skipping source-only columns: {', '.join(source_cols - target_cols)}")
    if target_cols - source_cols:
        print(f"  ℹ️  Target has extra columns: {', '.join(target_cols - source_cols)}")
    
    return sorted(list(common_cols))

def migrate_table(source_conn, target_conn, table_name):
    """Copy all data from source table to target table"""
    source_cursor = source_conn.cursor()
    target_cursor = target_conn.cursor()
    
    print(f"\n📋 Migrating table: {table_name}")
    
    # Get common columns between source and target
    columns = get_table_columns(source_cursor, target_cursor, table_name)
    if not columns:
        print(f"  ⚠️  Table {table_name} not found or has no columns")
        return
    
    columns_str = ', '.join(columns)
    
    # Get row count
    source_cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    row_count = source_cursor.fetchone()[0]
    print(f"  📊 Found {row_count} rows")
    
    if row_count == 0:
        print(f"  ✅ Skipped (empty table)")
        return
    
    # Fetch all data (with column mapping for special cases)
    select_cols = columns_str
    if table_name == 'class_sections' and 'section_code' in columns:
        # Map class_code to section_code
        select_cols = select_cols.replace('section_code', 'class_code AS section_code')
    elif table_name == 'students' and 'student_id' in columns:
        # Map student_number to student_id
        select_cols = select_cols.replace('student_id', 'student_number AS student_id')
    
    source_cursor.execute(f"SELECT {select_cols} FROM {table_name}")
    rows = source_cursor.fetchall()
    
    # Transform rows if needed
    transformed_rows = [transform_row(table_name, row, columns) for row in rows]
    
    # Clear target table (optional - remove if you want to keep existing data)
    try:
        target_cursor.execute(f"TRUNCATE TABLE {table_name} CASCADE")
        print(f"  🗑️  Cleared existing data")
    except Exception as e:
        print(f"  ⚠️  Could not truncate: {e}")
    
    # Insert data using execute_values (batch insert for performance)
    insert_query = f"INSERT INTO {table_name} ({columns_str}) VALUES %s"
    
    try:
        execute_values(target_cursor, insert_query, transformed_rows, page_size=100)
        target_conn.commit()
        print(f"  ✅ Migrated {len(rows)} rows successfully")
    except Exception as e:
        target_conn.rollback()
        print(f"  ❌ Error: {e}")
        raise

def main():
    print("=" * 60)
    print("🚀 Database Migration: Supabase → Render PostgreSQL")
    print("=" * 60)
    
    if "YOUR_RENDER" in RENDER_URL:
        print("\n❌ ERROR: Please update RENDER_URL in the script first!")
        print("\nGet your Render Internal Database URL from:")
        print("  Render Dashboard → PostgreSQL → Info → Internal Database URL")
        sys.exit(1)
    
    # Connect to databases
    print("\n🔌 Connecting to Supabase...")
    try:
        source_conn = psycopg2.connect(SUPABASE_URL)
        print("  ✅ Connected to Supabase")
    except Exception as e:
        print(f"  ❌ Failed to connect to Supabase: {e}")
        sys.exit(1)
    
    print("\n🔌 Connecting to Render PostgreSQL...")
    try:
        target_conn = psycopg2.connect(RENDER_URL)
        print("  ✅ Connected to Render")
    except Exception as e:
        print(f"  ❌ Failed to connect to Render: {e}")
        sys.exit(1)
    
    # Migrate each table
    try:
        for table in TABLES:
            migrate_table(source_conn, target_conn, table)
        
        print("\n" + "=" * 60)
        print("✅ Migration completed successfully!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        sys.exit(1)
    
    finally:
        source_conn.close()
        target_conn.close()
        print("\n🔌 Connections closed")

if __name__ == "__main__":
    main()
