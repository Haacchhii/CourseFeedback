"""Check admin users"""
from database.connection import get_db
from sqlalchemy import text

db = next(get_db())

r = db.execute(text("SELECT email, role FROM users WHERE role = 'admin' LIMIT 5"))
print("Admin users:")
for row in r:
    print(f"  {row}")
