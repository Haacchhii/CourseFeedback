"""Check and fix student year level"""
import os
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Check the student record
    result = conn.execute(text("""
        SELECT s.id, s.student_number, s.year_level, u.email, u.first_name, u.last_name
        FROM students s
        JOIN users u ON s.user_id = u.id
        WHERE u.email = 'iturraldejose@lpubatangas.edu.ph'
    """))
    
    row = result.fetchone()
    if row:
        print(f'Student: {row[3]} - {row[4]} {row[5]}')
        print(f'Student Number: {row[1]}')
        print(f'Year Level in DB: {row[2]}')
        
        # Fix year level to 3
        if row[2] != 3:
            conn.execute(text("""
                UPDATE students SET year_level = 3 WHERE id = :id
            """), {"id": row[0]})
            conn.commit()
            print(f'Updated year_level to 3')
    else:
        print('Student not found')
