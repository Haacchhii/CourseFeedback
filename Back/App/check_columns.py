import os
from dotenv import load_dotenv
import psycopg

load_dotenv()
url = os.getenv('DATABASE_URL').replace('postgresql+psycopg://', 'postgresql://')
conn = psycopg.connect(url)
cur = conn.cursor()

print("Enrollments table columns:")
cur.execute("""
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'enrollments' 
    ORDER BY ordinal_position
""")
for row in cur.fetchall():
    print(f"  {row[0]}: {row[1]}")

conn.close()
