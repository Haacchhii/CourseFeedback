#!/usr/bin/env python3
"""Test script to debug the courses API query"""

import os
import sys
from dotenv import load_dotenv
load_dotenv()

import psycopg2

DATABASE_URL = os.getenv("DATABASE_URL")
# Fix the URL format for psycopg2
if DATABASE_URL and DATABASE_URL.startswith("postgresql+psycopg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql+psycopg://", "postgresql://")

def test_courses_query():
    print("Testing courses query for BSCS-DS (program_id=1), 3rd year, 1st semester...")
    print("=" * 60)
    
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    # Direct query to check courses for program_id=1, year_level=3, semester=1
    query = """
        SELECT id, subject_code, subject_name, program_id, year_level, semester
        FROM courses
        WHERE program_id = 1 AND year_level = 3 AND semester = 1
        ORDER BY subject_code
    """
    cur.execute(query)
    results = cur.fetchall()
    
    print(f"\nFound {len(results)} courses:")
    for row in results:
        print(f"  ID: {row[0]}, Code: {row[1]}, Name: {row[2]}, Program: {row[3]}, Year: {row[4]}, Sem: {row[5]}")
    
    # Also check what program_sections exist for the same criteria
    print("\n" + "=" * 60)
    print("Checking program sections for same criteria...")
    
    query2 = """
        SELECT ps.id, ps.section_name, p.program_code, ps.year_level, ps.semester, ps.school_year
        FROM program_sections ps
        JOIN programs p ON ps.program_id = p.id
        WHERE ps.program_id = 1 AND ps.year_level = 3 AND ps.semester = 1 AND ps.is_active = true
        ORDER BY ps.section_name
    """
    cur.execute(query2)
    results2 = cur.fetchall()
    
    print(f"\nFound {len(results2)} program sections:")
    for row in results2:
        print(f"  ID: {row[0]}, Name: {row[1]}, Program: {row[2]}, Year: {row[3]}, Sem: {row[4]}, SY: {row[5]}")
    
    # Check if there's a mismatch in semester values
    print("\n" + "=" * 60)
    print("Checking distinct semester values in courses table...")
    cur.execute("SELECT DISTINCT semester FROM courses ORDER BY semester")
    semesters = cur.fetchall()
    print(f"Distinct semester values: {[s[0] for s in semesters]}")
    
    # Check data type of semester column
    print("\n" + "=" * 60)
    print("Checking semester column data type...")
    cur.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'semester'
    """)
    col_info = cur.fetchone()
    print(f"Semester column type: {col_info}")
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    test_courses_query()
