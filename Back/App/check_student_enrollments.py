import os
from dotenv import load_dotenv
import psycopg

load_dotenv()
url = os.getenv('DATABASE_URL').replace('postgresql+psycopg://', 'postgresql://')
conn = psycopg.connect(url)
cur = conn.cursor()

print('=== USER INFO ===')
cur.execute('SELECT id, email, role FROM users WHERE email = %s', ('iturraldejose@lpubatangas.edu.ph',))
user = cur.fetchone()
if user:
    print(f'User: ID={user[0]}, Email={user[1]}, Role={user[2]}')
    
    print('\n=== STUDENT RECORD ===')
    cur.execute('SELECT id, user_id, student_number, program_id, year_level FROM students WHERE user_id = %s', (user[0],))
    student = cur.fetchone()
    if student:
        print(f'Student: ID={student[0]}, UserID={student[1]}, StudentNo={student[2]}, ProgramID={student[3]}, YearLevel={student[4]}')
        
        print('\n=== ENROLLMENTS ===')
        cur.execute('''
            SELECT e.id, e.student_id, e.class_section_id, e.status, 
                   cs.class_code, c.subject_code, c.subject_name
            FROM enrollments e
            JOIN class_sections cs ON e.class_section_id = cs.id
            JOIN courses c ON cs.course_id = c.id
            WHERE e.student_id = %s
        ''', (student[0],))
        enrollments = cur.fetchall()
        print(f'Found {len(enrollments)} enrollments:')
        for enr in enrollments:
            print(f'  - EnrollmentID={enr[0]}, SectionID={enr[2]}, Status={enr[3]}, ClassCode={enr[4]}, Course={enr[5]} - {enr[6]}')
    else:
        print('No student record found for this user!')
else:
    print('User not found!')

conn.close()
