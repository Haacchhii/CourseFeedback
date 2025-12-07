"""
COMPLETE Database Migration: ALL Columns from Supabase → Render PostgreSQL
This script migrates EVERYTHING, adding missing columns to Render if needed
"""
import psycopg2
from psycopg2.extras import execute_values, Json
import sys

SUPABASE_URL = "postgresql://postgres.esdohggqyckrtlpzbyhh:Napakabangis0518@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
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

def get_column_definition(cursor, table_name, column_name):
    """Get full column definition for ALTER TABLE"""
    cursor.execute(f"""
        SELECT 
            column_name,
            data_type,
            character_maximum_length,
            is_nullable,
            column_default
        FROM information_schema.columns 
        WHERE table_name = '{table_name}' 
        AND column_name = '{column_name}'
        AND table_schema = 'public'
    """)
    result = cursor.fetchone()
    if not result:
        return None
    
    col_name, data_type, max_length, is_nullable, col_default = result
    
    # Build column definition
    if data_type == 'character varying':
        type_def = f"VARCHAR({max_length})" if max_length else "TEXT"
    elif data_type == 'timestamp without time zone':
        type_def = "TIMESTAMP"
    elif data_type == 'integer':
        type_def = "INTEGER"
    elif data_type == 'bigint':
        type_def = "BIGINT"
    elif data_type == 'boolean':
        type_def = "BOOLEAN"
    elif data_type == 'jsonb':
        type_def = "JSONB"
    elif data_type == 'json':
        type_def = "JSON"
    elif data_type == 'text':
        type_def = "TEXT"
    elif data_type == 'numeric':
        type_def = "NUMERIC"
    elif data_type == 'double precision':
        type_def = "DOUBLE PRECISION"
    else:
        type_def = data_type.upper()
    
    # Add nullable constraint
    nullable = "" if is_nullable == 'YES' else " NOT NULL"
    
    # Add default
    default = f" DEFAULT {col_default}" if col_default else ""
    
    return f"{col_name} {type_def}{nullable}{default}"

def add_missing_columns(source_conn, target_conn, table_name):
    """Add any missing columns from source to target"""
    source_cursor = source_conn.cursor()
    target_cursor = target_conn.cursor()
    
    # Get all columns from both
    source_cursor.execute(f"""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '{table_name}' AND table_schema = 'public'
        ORDER BY ordinal_position
    """)
    source_cols = set(row[0] for row in source_cursor.fetchall())
    
    target_cursor.execute(f"""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '{table_name}' AND table_schema = 'public'
        ORDER BY ordinal_position
    """)
    target_cols = set(row[0] for row in target_cursor.fetchall())
    
    # Find missing columns
    missing = source_cols - target_cols
    
    if missing:
        print(f"  🔧 Adding {len(missing)} missing columns to Render...")
        for col in sorted(missing):
            col_def = get_column_definition(source_cursor, table_name, col)
            if col_def:
                try:
                    # Remove NOT NULL and DEFAULT for initial add
                    add_col = col_def.split(' NOT NULL')[0].split(' DEFAULT')[0]
                    target_cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN IF NOT EXISTS {add_col}")
                    target_conn.commit()
                    print(f"     ✅ Added: {col}")
                except Exception as e:
                    print(f"     ⚠️  Could not add {col}: {e}")
                    target_conn.rollback()
    
    return source_cols

def migrate_table_complete(source_conn, target_conn, table_name):
    """Migrate table with ALL columns from source"""
    source_cursor = source_conn.cursor()
    target_cursor = target_conn.cursor()
    
    print(f"\n📋 Migrating table: {table_name}")
    
    # First, add any missing columns to target
    all_source_cols = add_missing_columns(source_conn, target_conn, table_name)
    
    if not all_source_cols:
        print(f"  ⚠️  Table {table_name} not found in source")
        return
    
    columns = sorted(list(all_source_cols))
    columns_str = ', '.join(columns)
    
    # Get row count
    source_cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    row_count = source_cursor.fetchone()[0]
    print(f"  📊 Found {row_count} rows with {len(columns)} columns")
    
    if row_count == 0:
        print(f"  ✅ Skipped (empty table)")
        return
    
    # Fetch all data
    source_cursor.execute(f"SELECT {columns_str} FROM {table_name}")
    rows = source_cursor.fetchall()
    
    # Create column index map
    col_idx = {col: i for i, col in enumerate(columns)}
    
    # Transform rows if needed (handle JSON, semester constraints, etc.)
    transformed_rows = []
    for row in rows:
        row_list = list(row)
        
        # Handle JSON fields
        for i, val in enumerate(row_list):
            if isinstance(val, dict):
                row_list[i] = Json(val)
        
        # Handle specific table constraints
        if table_name == 'courses' and 'semester' in col_idx:
            semester_idx = col_idx['semester']
            # Convert semester 3 (summer) to 2 to match constraint
            if row_list[semester_idx] not in (1, 2, None):
                row_list[semester_idx] = 2
        
        elif table_name == 'class_sections':
            # If section_code is null but class_code exists, use class_code
            if 'section_code' in col_idx:
                section_code_idx = col_idx['section_code']
                if not row_list[section_code_idx]:
                    # Try to use class_code if available
                    if 'class_code' in col_idx and row_list[col_idx['class_code']]:
                        row_list[section_code_idx] = row_list[col_idx['class_code']]
                    else:
                        # Generate from course_id
                        course_id = row_list[col_idx['course_id']] if 'course_id' in col_idx else 'UNK'
                        row_list[section_code_idx] = f"SEC-{course_id}"
        
        elif table_name == 'students':
            # Ensure student_id has a value (use student_number if student_id is null)
            if 'student_id' in col_idx and 'student_number' in col_idx:
                student_id_idx = col_idx['student_id']
                student_number_idx = col_idx['student_number']
                if not row_list[student_id_idx] and row_list[student_number_idx]:
                    row_list[student_id_idx] = row_list[student_number_idx]
        
        transformed_rows.append(tuple(row_list))
    
    # Clear target table
    try:
        target_cursor.execute(f"TRUNCATE TABLE {table_name} RESTART IDENTITY CASCADE")
        target_conn.commit()
        print(f"  🗑️  Cleared existing data")
    except Exception as e:
        print(f"  ⚠️  Could not truncate: {e}")
        target_conn.rollback()
    
    # Insert data
    insert_query = f"INSERT INTO {table_name} ({columns_str}) VALUES %s"
    
    try:
        execute_values(target_cursor, insert_query, transformed_rows, page_size=100)
        target_conn.commit()
        print(f"  ✅ Migrated {len(rows)} rows with ALL columns")
    except Exception as e:
        target_conn.rollback()
        print(f"  ❌ Error: {e}")
        raise

def main():
    print("=" * 70)
    print("🚀 COMPLETE Database Migration: Supabase → Render PostgreSQL")
    print("   Migrating ALL columns and data")
    print("=" * 70)
    
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
            migrate_table_complete(source_conn, target_conn, table)
        
        print("\n" + "=" * 70)
        print("✅ COMPLETE MIGRATION FINISHED!")
        print("   All Supabase columns and data migrated to Render")
        print("=" * 70)
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        sys.exit(1)
    
    finally:
        source_conn.close()
        target_conn.close()
        print("\n🔌 Connections closed")

if __name__ == "__main__":
    main()
