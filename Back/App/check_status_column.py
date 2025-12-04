from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)
db = engine.connect()

result = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'evaluations' AND column_name LIKE '%status%'")).fetchall()
print("Status columns in evaluations table:")
for r in result:
    print(f"  - {r[0]}")
