"""
Check what tables exist in Render database
"""
import psycopg2

RENDER_URL = "postgresql://coursefeedback_user:RsqgOp2Cf4gRiY8PPHKgAKV15jYytMTL@dpg-d4orgtvgi27c73cfu4h0-a.oregon-postgres.render.com/coursefeedback_piea"

conn = psycopg2.connect(RENDER_URL)
cursor = conn.cursor()

cursor.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
""")

tables = cursor.fetchall()

print(f"\n📊 Found {len(tables)} tables in Render database:\n")
for table in tables:
    print(f"  - {table[0]}")
    
    # Get row count
    cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
    count = cursor.fetchone()[0]
    print(f"    ({count} rows)")

cursor.close()
conn.close()
