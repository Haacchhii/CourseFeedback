"""Check table columns"""
from database.connection import get_db
from sqlalchemy import text

db = next(get_db())

print("Evaluation Periods columns:")
r = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'evaluation_periods' ORDER BY ordinal_position"))
for row in r:
    print(f"  - {row[0]}")

print("\nEvaluation Periods data:")
r = db.execute(text("SELECT * FROM evaluation_periods ORDER BY id DESC LIMIT 5"))
for row in r:
    print(f"  - {row}")

print("\nEnrollment count:")
r = db.execute(text("SELECT COUNT(*) FROM enrollments"))
print(f"  {r.scalar()}")

print("\nSample Enrollments:")
r = db.execute(text("SELECT * FROM enrollments LIMIT 5"))
for row in r:
    print(f"  - {row}")
