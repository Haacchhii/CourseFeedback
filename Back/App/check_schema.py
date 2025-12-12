"""Check database schema and verify structure"""
from database.connection import get_db, engine
from sqlalchemy import text, inspect

# Get inspector
inspector = inspect(engine)

# Check class_sections table
print('=== class_sections columns ===')
columns = inspector.get_columns('class_sections')
for col in columns:
    print(f"  {col['name']}: {col['type']}")

# Check analysis_results table
print()
print('=== analysis_results columns ===')
try:
    columns = inspector.get_columns('analysis_results')
    for col in columns:
        print(f"  {col['name']}: {col['type']}")
except Exception as e:
    print(f'  Table does not exist or error: {e}')

# Check for any admin user
print()
print('=== Admin Users ===')
db = next(get_db())
admins = db.execute(text("SELECT id, email, role FROM users WHERE role = 'admin'")).fetchall()
for admin in admins:
    print(f"  ID: {admin[0]}, Email: {admin[1]}, Role: {admin[2]}")

# Check secretary and dept head
print()
print('=== Secretary Users ===')
secs = db.execute(text("SELECT id, email, role FROM users WHERE role = 'secretary'")).fetchall()
for s in secs:
    print(f"  ID: {s[0]}, Email: {s[1]}, Role: {s[2]}")

print()
print('=== Department Head Users ===')
dhs = db.execute(text("SELECT id, email, role FROM users WHERE role = 'department_head'")).fetchall()
for d in dhs:
    print(f"  ID: {d[0]}, Email: {d[1]}, Role: {d[2]}")

print()
print('=== Student Users (first 3) ===')
students = db.execute(text("SELECT id, email, role FROM users WHERE role = 'student' LIMIT 3")).fetchall()
for s in students:
    print(f"  ID: {s[0]}, Email: {s[1]}, Role: {s[2]}")
