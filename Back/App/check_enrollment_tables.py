from sqlalchemy import create_engine, inspect
import os
from dotenv import load_dotenv

load_dotenv()
engine = create_engine(os.getenv('DATABASE_URL'))
inspector = inspect(engine)

print('section_students columns:')
cols = inspector.get_columns('section_students')
for col in cols:
    print(f"  - {col['name']} ({col['type']})")

print('\nenrollments columns:')
cols2 = inspector.get_columns('enrollments')
for col in cols2:
    print(f"  - {col['name']} ({col['type']})")
