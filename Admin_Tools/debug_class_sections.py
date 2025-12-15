import psycopg2

SUPABASE_URL = "postgresql://postgres.esdohggqyckrtlpzbyhh:Napakabangis0518@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

conn = psycopg2.connect(SUPABASE_URL)
cursor = conn.cursor()

cursor.execute("""
    SELECT column_name, ordinal_position
    FROM information_schema.columns 
    WHERE table_name = 'class_sections' AND table_schema = 'public'
    ORDER BY ordinal_position
""")

print("\nclass_sections columns in Supabase:")
for col, pos in cursor.fetchall():
    print(f"  {pos}. {col}")

cursor.execute("SELECT * FROM class_sections LIMIT 1")
row = cursor.fetchone()
print(f"\nSample row: {row}")
print(f"Length: {len(row)}")

conn.close()
