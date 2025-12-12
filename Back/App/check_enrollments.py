#!/usr/bin/env python3
"""Check database enrollments"""
import os
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine, text
DATABASE_URL = os.getenv('DATABASE_URL').replace('postgresql+psycopg://', 'postgresql://')
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Check class_sections table for CS 17 section
    print("=" * 60)
    print("Checking for CS 17 related sections:")
    result = conn.execute(text("""
        SELECT cs.id, cs.class_code, cs.semester, cs.academic_year 
        FROM class_sections cs 
        WHERE cs.class_code LIKE '%CS 17%' OR cs.class_code LIKE '%CS17%'
        ORDER BY cs.id DESC
    """))
    for row in result:
        print(f'  ID={row[0]}, Code={row[1]}, Sem={row[2]}, Year={row[3]}')
    
    # Check enrollments for CS 17 sections
    print()
    print("=" * 60)
    print("Enrollments for those sections:")
    result = conn.execute(text("""
        SELECT e.id, e.student_id, e.class_section_id, cs.class_code 
        FROM enrollments e 
        JOIN class_sections cs ON e.class_section_id = cs.id 
        WHERE cs.class_code LIKE '%CS 17%' OR cs.class_code LIKE '%CS17%'
    """))
    enrollments = list(result)
    if enrollments:
        for row in enrollments:
            print(f'  EnrollmentID={row[0]}, StudentID={row[1]}, SectionID={row[2]}, Code={row[3]}')
    else:
        print("  No enrollments found!")
    
    # Check if student 11 exists
    print()
    print("=" * 60)
    print("Checking student 11 details:")
    result = conn.execute(text("""
        SELECT s.id, s.user_id, s.student_number, u.first_name, u.last_name
        FROM students s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = 11
    """))
    row = result.fetchone()
    if row:
        print(f'  StudentID={row[0]}, UserID={row[1]}, Number={row[2]}, Name={row[3]} {row[4]}')
    else:
        print("  Student 11 not found!")
    
    # Check section_students for program section 3
    print()
    print("=" * 60)
    print("Section students for program section 31 (BSCS-DS-3A):")
    result = conn.execute(text("""
        SELECT ss.id, ss.section_id, ss.student_id, ps.section_name
        FROM section_students ss
        JOIN program_sections ps ON ss.section_id = ps.id
        WHERE ps.section_name LIKE '%BSCS-DS%3%'
    """))
    for row in result:
        print(f'  ID={row[0]}, SectionID={row[1]}, StudentID(user_id)={row[2]}, Name={row[3]}')
