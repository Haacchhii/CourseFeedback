import os
from dotenv import load_dotenv
import psycopg

load_dotenv()
url = os.getenv('DATABASE_URL').replace('postgresql+psycopg://', 'postgresql://')
conn = psycopg.connect(url)
cur = conn.cursor()

print('=== BSCS-DS YEAR 3 COURSES ===')
cur.execute('''
    SELECT c.id, c.subject_code, c.subject_name, c.year_level, c.semester
    FROM courses c
    WHERE c.program_id = 1 AND c.year_level = 3
    ORDER BY c.semester, c.subject_code
''')
courses = cur.fetchall()
print(f'Found {len(courses)} courses for BSCS-DS Year 3:')
for course in courses:
    print(f'  - Course ID={course[0]}, Code={course[1]}, Name={course[2]}, Semester={course[4]}')

print('\n=== EXISTING CLASS SECTIONS FOR THESE COURSES ===')
if courses:
    course_ids = [c[0] for c in courses]
    placeholders = ','.join(['%s'] * len(course_ids))
    cur.execute(f'''
        SELECT cs.id, cs.class_code, c.subject_code, c.subject_name
        FROM class_sections cs
        JOIN courses c ON cs.course_id = c.id
        WHERE c.id IN ({placeholders})
    ''', course_ids)
    sections = cur.fetchall()
    print(f'Found {len(sections)} class sections')
    for sec in sections:
        print(f'  - Section ID={sec[0]}, Code={sec[1]}, Course={sec[2]} - {sec[3]}')

conn.close()
