"""
Create missing tables in Render from Supabase schema
"""
import psycopg2

SUPABASE_URL = "postgresql://postgres.esdohggqyckrtlpzbyhh:Napakabangis0518@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
RENDER_URL = "postgresql://coursefeedback_user:RsqgOp2Cf4gRiY8PPHKgAKV15jYytMTL@dpg-d4orgtvgi27c73cfu4h0-a.oregon-postgres.render.com/coursefeedback_piea"

def get_create_table_statement(source_cursor, table_name):
    """Generate CREATE TABLE statement from source table"""
    # Get columns with full details
    source_cursor.execute(f"""
        SELECT 
            column_name,
            data_type,
            character_maximum_length,
            is_nullable,
            column_default,
            numeric_precision,
            numeric_scale
        FROM information_schema.columns 
        WHERE table_name = '{table_name}' AND table_schema = 'public'
        ORDER BY ordinal_position
    """)
    columns = source_cursor.fetchall()
    
    if not columns:
        return None
    
    col_defs = []
    for col_name, data_type, max_len, is_null, col_def, num_prec, num_scale in columns:
        # Build type
        if data_type == 'character varying':
            type_str = f"VARCHAR({max_len})" if max_len else "TEXT"
        elif data_type == 'timestamp without time zone':
            type_str = "TIMESTAMP"
        elif data_type == 'integer':
            type_str = "INTEGER"
        elif data_type == 'bigint':
            type_str = "BIGINT"
        elif data_type == 'boolean':
            type_str = "BOOLEAN"
        elif data_type == 'jsonb':
            type_str = "JSONB"
        elif data_type == 'json':
            type_str = "JSON"
        elif data_type == 'text':
            type_str = "TEXT"
        elif data_type == 'numeric':
            if num_prec and num_scale:
                type_str = f"NUMERIC({num_prec},{num_scale})"
            else:
                type_str = "NUMERIC"
        elif data_type == 'double precision':
            type_str = "DOUBLE PRECISION"
        else:
            type_str = data_type.upper()
        
        # Nullable
        null_str = "" if is_null == 'YES' else " NOT NULL"
        
        # Default (skip auto-increment defaults)
        default_str = ""
        if col_def and 'nextval' not in str(col_def):
            default_str = f" DEFAULT {col_def}"
        
        col_defs.append(f"    {col_name} {type_str}{null_str}{default_str}")
    
    # Get primary key
    source_cursor.execute(f"""
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = '{table_name}' 
            AND tc.constraint_type = 'PRIMARY KEY'
            AND tc.table_schema = 'public'
    """)
    pk_cols = [row[0] for row in source_cursor.fetchall()]
    
    if pk_cols:
        col_defs.append(f"    PRIMARY KEY ({', '.join(pk_cols)})")
    
    create_stmt = f"""
CREATE TABLE IF NOT EXISTS {table_name} (
{',\n'.join(col_defs)}
);
"""
    return create_stmt

def create_missing_tables():
    """Create all tables that exist in Supabase but not in Render"""
    source_conn = psycopg2.connect(SUPABASE_URL)
    target_conn = psycopg2.connect(RENDER_URL)
    
    source_cursor = source_conn.cursor()
    target_cursor = target_conn.cursor()
    
    # Get all tables from Supabase
    source_cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name
    """)
    source_tables = {row[0] for row in source_cursor.fetchall()}
    
    # Get all tables from Render
    target_cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name
    """)
    target_tables = {row[0] for row in target_cursor.fetchall()}
    
    # Find missing tables
    missing = source_tables - target_tables
    
    print(f"\n📋 Found {len(missing)} missing tables in Render")
    print(f"   Missing: {', '.join(sorted(missing))}\n")
    
    for table in sorted(missing):
        print(f"🔧 Creating table: {table}")
        create_stmt = get_create_table_statement(source_cursor, table)
        if create_stmt:
            try:
                target_cursor.execute(create_stmt)
                target_conn.commit()
                print(f"   ✅ Created successfully")
            except Exception as e:
                print(f"   ❌ Error: {e}")
                target_conn.rollback()
    
    source_conn.close()
    target_conn.close()
    
    print(f"\n✅ Table creation complete!")

if __name__ == "__main__":
    create_missing_tables()
