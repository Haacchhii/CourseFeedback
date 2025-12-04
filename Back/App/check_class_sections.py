from sqlalchemy import create_engine, inspect
import os
from dotenv import load_dotenv

load_dotenv()
engine = create_engine(os.getenv('DATABASE_URL'))
inspector = inspect(engine)

print('class_sections columns:')
cols = inspector.get_columns('class_sections')
for col in cols:
    print(f"  {col['name']} - {col['type']}")
