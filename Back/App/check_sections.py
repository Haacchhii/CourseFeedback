from sqlalchemy import create_engine, inspect, text
import os
from dotenv import load_dotenv

load_dotenv()
engine = create_engine(os.getenv('DATABASE_URL'))
inspector = inspect(engine)

print('program_sections columns:')
cols = inspector.get_columns('program_sections')
for col in cols:
    print(f"  {col['name']} - {col['type']}")

# Check actual sections with enrollments
print('\nSections from image (BSIT-3A, BSPSY):')
with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT ps.id, ps.section_name, p.program_code, ps.year_level, ps.semester
        FROM program_sections ps
        JOIN programs p ON ps.program_id = p.id
        WHERE ps.section_name LIKE '%3A%' OR p.program_code = 'BSPSY'
        ORDER BY p.program_code, ps.section_name
        LIMIT 10
    """))
    for row in result:
        print(f"  ID: {row[0]}, {row[2]}-{row[1]} (Year {row[3]}, Sem {row[4]})")
