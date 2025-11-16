import os
from dotenv import load_dotenv
import psycopg

load_dotenv()
url = os.getenv('DATABASE_URL').replace('postgresql+psycopg://', 'postgresql://')
conn = psycopg.connect(url)
cur = conn.cursor()

print('=== BSCS-DS PROGRAM INFO ===')
cur.execute('SELECT id, program_code, program_name FROM programs WHERE program_code = %s', ('BSCS-DS',))
program = cur.fetchone()
if program:
    print(f'Program: ID={program[0]}, Code={program[1]}, Name={program[2]}')
    
    print('\n=== CLASS SECTIONS FOR BSCS-DS YEAR 3 ===')
    cur.execute('''
        SELECT cs.id, cs.class_code, c.subject_code, c.subject_name, 
               cs.semester, cs.academic_year
        FROM class_sections cs
        JOIN courses c ON cs.course_id = c.id
        WHERE c.program_id = %s AND c.year_level = 3
        ORDER BY cs.class_code
    ''', (program[0],))
    sections = cur.fetchall()
    print(f'Found {len(sections)} class sections:')
    for sec in sections:
        print(f'  - Section ID={sec[0]}, Code={sec[1]}, Course={sec[2]} - {sec[3]}, Semester={sec[4]}, AY={sec[5]}')
        
        # Check enrolled students in this section
        cur.execute('SELECT COUNT(*) FROM enrollments WHERE class_section_id = %s', (sec[0],))
        count = cur.fetchone()[0]
        print(f'    Enrolled students: {count}')
    
    print('\n=== PROGRAM SECTIONS ===')
    cur.execute('''
        SELECT ps.id, ps.section_name, ps.year_level, ps.program_id
        FROM program_sections ps
        WHERE ps.program_id = %s AND ps.year_level = 3
    ''', (program[0],))
    prog_sections = cur.fetchall()
    print(f'Found {len(prog_sections)} program sections:')
    for ps in prog_sections:
        print(f'  - Program Section ID={ps[0]}, Name={ps[1]}, YearLevel={ps[2]}')
        
        # Check students in this program section
        cur.execute('SELECT COUNT(*) FROM program_section_students WHERE program_section_id = %s', (ps[0],))
        count = cur.fetchone()[0]
        print(f'    Assigned students: {count}')

else:
    print('BSCS-DS program not found!')

conn.close()
