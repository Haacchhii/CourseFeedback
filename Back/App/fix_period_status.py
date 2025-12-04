from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()
engine = create_engine(os.getenv('DATABASE_URL'))
db = engine.connect()

print("Checking evaluation period status...")
r = db.execute(text("SELECT id, name, status FROM evaluation_periods WHERE id = 12")).fetchone()
print(f"Period 12: {r[1]}, Status: {r[2]}")

print("\nUpdating to 'active'...")
db.execute(text("UPDATE evaluation_periods SET status = 'active' WHERE id = 12"))
db.commit()

r2 = db.execute(text("SELECT id, name, status FROM evaluation_periods WHERE id = 12")).fetchone()
print(f"✅ New status: {r2[2]}")
