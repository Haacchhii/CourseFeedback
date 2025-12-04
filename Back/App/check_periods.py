from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()
engine = create_engine(os.getenv('DATABASE_URL'))

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT id, name, semester, academic_year, status, start_date, end_date
        FROM evaluation_periods
        ORDER BY created_at DESC
    """))
    
    print("All evaluation periods:")
    print()
    for row in result:
        print(f"ID: {row[0]}")
        print(f"  Name: {row[1]}")
        print(f"  Semester: {row[2]}")
        print(f"  Academic Year: {row[3]}")
        print(f"  Status: {row[4]}")
        print(f"  Start: {row[5]}")
        print(f"  End: {row[6]}")
        print()
