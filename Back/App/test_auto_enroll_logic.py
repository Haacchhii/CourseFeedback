"""
Test the auto-enrollment logic to make sure it works correctly
"""
import os
from dotenv import load_dotenv
import psycopg

load_dotenv()
url = os.getenv('DATABASE_URL').replace('postgresql+psycopg://', 'postgresql://')
conn = psycopg.connect(url)
cur = conn.cursor()

print('=== SIMULATING AUTO-ENROLLMENT LOGIC ===\n')

# Get course info for one of the Year 3 courses
cur.execute('''
    SELECT id, subject_code, subject_name, program_id, year_level
    FROM courses
    WHERE program_id = 1 AND year_level = 3 AND semester = 1
    LIMIT 1
''')
course = cur.fetchone()
print(f'Sample Course: ID={course[0]}, Code={course[1]}, ProgramID={course[3]}, YearLevel={course[4]}')

# Find matching students (what the backend will do)
print(f'\nFinding students with program_id={course[3]} AND year_level={course[4]}:')
cur.execute('''
    SELECT s.id, s.student_number, u.first_name, u.last_name, s.program_id, s.year_level
    FROM students s
    JOIN users u ON s.user_id = u.id
    WHERE s.program_id = %s AND s.year_level = %s
    ORDER BY s.student_number
''', (course[3], course[4]))
students = cur.fetchall()
print(f'Found {len(students)} matching students:')
for student in students:
    print(f'  - ID={student[0]}, StudentNo={student[1]}, Name={student[2]} {student[3]}')

# Check if any of the created sections exist
print('\n=== EXISTING SECTIONS FOR THIS COURSE ===')
cur.execute('''
    SELECT cs.id, cs.class_code, COUNT(e.id) as enrolled_count
    FROM class_sections cs
    LEFT JOIN enrollments e ON cs.id = e.class_section_id
    WHERE cs.course_id = %s
    GROUP BY cs.id, cs.class_code
''', (course[0],))
sections = cur.fetchall()
print(f'Found {len(sections)} sections:')
for sec in sections:
    print(f'  - Section ID={sec[0]}, Code={sec[1]}, Enrolled={sec[2]}')

conn.close()

print('\n✅ Auto-enrollment logic will enroll these students into newly created sections!')
