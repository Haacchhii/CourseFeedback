from database.connection import get_db
from sqlalchemy import text

db = next(get_db())
result = db.execute(text("""
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'evaluations' 
    ORDER BY ordinal_position
"""))

print("\n=== Evaluations Table Columns ===")
for row in result:
    print(f"{row[0]}: {row[1]}")
