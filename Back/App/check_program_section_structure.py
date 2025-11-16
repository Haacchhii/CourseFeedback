import os
from dotenv import load_dotenv
import psycopg

load_dotenv()
url = os.getenv('DATABASE_URL').replace('postgresql+psycopg://', 'postgresql://')
conn = psycopg.connect(url)
cur = conn.cursor()

print('=== CHECKING PROGRAM SECTION STRUCTURE ===')
cur.execute("""
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'program_sections'
    ORDER BY ordinal_position
""")
columns = cur.fetchall()
print('program_sections columns:')
for col in columns:
    print(f'  - {col[0]}: {col[1]}')

print('\n=== LOOKING FOR PROGRAM SECTION STUDENTS RELATIONSHIP ===')
cur.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE '%program%section%'
    ORDER BY table_name
""")
tables = cur.fetchall()
print('Related tables:')
for table in tables:
    print(f'  - {table[0]}')

print('\n=== STUDENTS IN PROGRAM SECTION BSCS-DS-3A ===')
cur.execute("""
    SELECT s.id, s.student_number, u.first_name, u.last_name, s.program_id, s.year_level
    FROM students s
    JOIN users u ON s.user_id = u.id
    WHERE s.program_id = 1 AND s.year_level = 3
    ORDER BY s.student_number
""")
students = cur.fetchall()
print(f'Found {len(students)} students in BSCS-DS Year 3:')
for student in students:
    print(f'  - ID={student[0]}, StudentNo={student[1]}, Name={student[2]} {student[3]}')

conn.close()
