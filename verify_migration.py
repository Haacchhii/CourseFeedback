"""
Verify Migration Integrity
Compare Supabase vs Render schemas and data
"""
import psycopg2

SUPABASE_URL = "postgresql://postgres.esdohggqyckrtlpzbyhh:Napakabangis0518@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
RENDER_URL = "postgresql://coursefeedback_user:RsqgOp2Cf4gRiY8PPHKgAKV15jYytMTL@dpg-d4orgtvgi27c73cfu4h0-a.oregon-postgres.render.com/coursefeedback_piea"

def get_table_info(conn, table_name):
    """Get column names and row count for a table"""
    cursor = conn.cursor()
    
    # Get columns
    cursor.execute(f"""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = '{table_name}' AND table_schema = 'public'
        ORDER BY ordinal_position
    """)
    columns = cursor.fetchall()
    
    # Get row count
    try:
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
    except:
        count = 0
    
    return columns, count

def verify_critical_tables():
    """Verify critical tables have proper data"""
    supabase_conn = psycopg2.connect(SUPABASE_URL)
    render_conn = psycopg2.connect(RENDER_URL)
    
    critical_tables = ['users', 'programs', 'courses', 'students', 'class_sections', 
                      'enrollments', 'evaluations', 'evaluation_periods']
    
    print("=" * 80)
    print("🔍 MIGRATION VERIFICATION REPORT")
    print("=" * 80)
    
    for table in critical_tables:
        print(f"\n📋 Table: {table}")
        print("-" * 80)
        
        # Get info from both databases
        supabase_cols, supabase_count = get_table_info(supabase_conn, table)
        render_cols, render_count = get_table_info(render_conn, table)
        
        supabase_col_names = {col[0] for col in supabase_cols}
        render_col_names = {col[0] for col in render_cols}
        
        # Row count comparison
        print(f"  📊 Row Counts:")
        print(f"     Supabase: {supabase_count:>6} rows")
        print(f"     Render:   {render_count:>6} rows")
        
        if supabase_count == render_count:
            print(f"     ✅ Counts match!")
        elif render_count > 0:
            print(f"     ⚠️  Partial migration ({render_count}/{supabase_count})")
        else:
            print(f"     ❌ No data migrated")
        
        # Column comparison
        common = supabase_col_names & render_col_names
        supabase_only = supabase_col_names - render_col_names
        render_only = render_col_names - supabase_col_names
        
        print(f"\n  📝 Column Analysis:")
        print(f"     Common columns: {len(common)}")
        
        if supabase_only:
            print(f"     ⚠️  Supabase-only: {', '.join(sorted(supabase_only))}")
        if render_only:
            print(f"     ℹ️  Render-only: {', '.join(sorted(render_only))}")
        
        # Sample data check for users table
        if table == 'users' and render_count > 0:
            render_cursor = render_conn.cursor()
            render_cursor.execute(f"""
                SELECT role, COUNT(*) as count 
                FROM users 
                GROUP BY role 
                ORDER BY role
            """)
            roles = render_cursor.fetchall()
            print(f"\n  👥 User Roles Distribution:")
            for role, count in roles:
                print(f"     {role:>20}: {count:>3} users")
        
        # Sample data check for evaluations
        if table == 'evaluations' and render_count > 0:
            render_cursor = render_conn.cursor()
            render_cursor.execute(f"""
                SELECT sentiment, COUNT(*) as count 
                FROM evaluations 
                WHERE sentiment IS NOT NULL
                GROUP BY sentiment 
                ORDER BY sentiment
            """)
            sentiments = render_cursor.fetchall()
            if sentiments:
                print(f"\n  💭 Evaluation Sentiments:")
                for sentiment, count in sentiments:
                    print(f"     {sentiment:>10}: {count:>3}")
    
    supabase_conn.close()
    render_conn.close()
    
    print("\n" + "=" * 80)
    print("✅ VERIFICATION COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    verify_critical_tables()
