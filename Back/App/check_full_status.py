import os
from dotenv import load_dotenv
import psycopg

load_dotenv()
url = os.getenv('DATABASE_URL').replace('postgresql+psycopg://', 'postgresql://')
conn = psycopg.connect(url)
cur = conn.cursor()

print('=== STUDENT INFO ===')
cur.execute('''
    SELECT u.id as user_id, u.email, s.id as student_id, s.student_number, 
           p.program_code, s.year_level
    FROM users u
    JOIN students s ON s.user_id = u.id
    JOIN programs p ON s.program_id = p.id
    WHERE u.email = %s
''', ('iturraldejose@lpubatangas.edu.ph',))
student_info = cur.fetchone()
if student_info:
    print(f'UserID={student_info[0]}, Email={student_info[1]}')
    print(f'StudentID={student_info[2]}, StudentNo={student_info[3]}')
    print(f'Program={student_info[4]}, YearLevel={student_info[5]}')
    student_id = student_info[2]
    user_id = student_info[0]
    
    print('\n=== CLASS SECTIONS FOR BSCS-DS YEAR 3 ===')
    cur.execute('''
        SELECT cs.id, cs.class_code, c.subject_code, c.subject_name, 
               cs.semester, cs.academic_year
        FROM class_sections cs
        JOIN courses c ON cs.course_id = c.id
        WHERE c.program_id = 1 AND c.year_level = 3
        ORDER BY cs.semester, c.subject_code
    ''')
    sections = cur.fetchall()
    print(f'Found {len(sections)} class sections')
    for sec in sections:
        print(f'  Section ID={sec[0]}, Code={sec[1]}, Course={sec[2]} - {sec[3]}, Sem={sec[4]}')
    
    print('\n=== STUDENT ENROLLMENTS ===')
    cur.execute('''
        SELECT e.id, e.student_id, e.class_section_id, e.status, e.enrolled_at,
               cs.class_code, c.subject_code, c.subject_name
        FROM enrollments e
        JOIN class_sections cs ON e.class_section_id = cs.id
        JOIN courses c ON cs.course_id = c.id
        WHERE e.student_id = %s
        ORDER BY cs.class_code
    ''', (student_id,))
    enrollments = cur.fetchall()
    print(f'Found {len(enrollments)} enrollments')
    for enr in enrollments:
        print(f'  EnrollID={enr[0]}, SectionID={enr[2]}, Status={enr[3]}, Code={enr[5]}, Course={enr[6]}')
    
    print('\n=== TESTING API QUERY (same as backend) ===')
    cur.execute('''
        SELECT DISTINCT
            c.id, c.subject_code, c.subject_name,
            cs.id as class_section_id, cs.class_code,
            cs.semester, cs.academic_year,
            p.program_name,
            u.first_name || ' ' || u.last_name as instructor_name,
            CASE 
                WHEN e.id IS NOT NULL THEN true 
                ELSE false 
            END as already_evaluated,
            e.id as evaluation_id
        FROM enrollments enr
        JOIN class_sections cs ON enr.class_section_id = cs.id
        JOIN courses c ON cs.course_id = c.id
        LEFT JOIN programs p ON c.program_id = p.id
        LEFT JOIN users u ON cs.instructor_id = u.id
        LEFT JOIN evaluations e ON cs.id = e.class_section_id AND e.student_id = %s
        WHERE enr.student_id = %s
        AND enr.status = 'active'
        ORDER BY c.subject_name
    ''', (student_id, student_id))
    api_results = cur.fetchall()
    print(f'API would return {len(api_results)} courses')
    for row in api_results:
        print(f'  Course ID={row[0]}, Code={row[1]}, Name={row[2]}, Section={row[4]}')
else:
    print('Student not found!')

conn.close()
