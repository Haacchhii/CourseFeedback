"""
Retroactively enroll student into existing BSCS-DS Year 3 sections
"""
import os
from dotenv import load_dotenv
import psycopg
from datetime import datetime

load_dotenv()
url = os.getenv('DATABASE_URL').replace('postgresql+psycopg://', 'postgresql://')
conn = psycopg.connect(url)
cur = conn.cursor()

print('=== ENROLLING STUDENT INTO EXISTING SECTIONS ===\n')

# Get the student
cur.execute('''
    SELECT s.id, s.student_number, u.first_name, u.last_name
    FROM students s
    JOIN users u ON s.user_id = u.id
    WHERE s.program_id = 1 AND s.year_level = 3
''')
student = cur.fetchone()
if not student:
    print('No student found!')
    conn.close()
    exit()

student_id = student[0]
print(f'Student: ID={student_id}, No={student[1]}, Name={student[2]} {student[3]}')

# Get all Year 3 sections
cur.execute('''
    SELECT cs.id, cs.class_code, c.subject_code, c.subject_name
    FROM class_sections cs
    JOIN courses c ON cs.course_id = c.id
    WHERE c.program_id = 1 AND c.year_level = 3
    ORDER BY cs.class_code
''')
sections = cur.fetchall()
print(f'\nFound {len(sections)} sections to enroll into:')

enrolled_count = 0
skipped_count = 0

for section in sections:
    section_id = section[0]
    class_code = section[1]
    
    # Check if already enrolled
    cur.execute('''
        SELECT id FROM enrollments
        WHERE student_id = %s AND class_section_id = %s
    ''', (student_id, section_id))
    existing = cur.fetchone()
    
    if existing:
        print(f'  ⏭️  {class_code} - Already enrolled')
        skipped_count += 1
    else:
        # Create enrollment
        cur.execute('''
            INSERT INTO enrollments (student_id, class_section_id, enrolled_at, status)
            VALUES (%s, %s, %s, %s)
        ''', (student_id, section_id, datetime.now(), 'active'))
        print(f'  ✅ {class_code} - Enrolled!')
        enrolled_count += 1

conn.commit()
conn.close()

print(f'\n✅ COMPLETE: Enrolled in {enrolled_count} sections, Skipped {skipped_count}')
