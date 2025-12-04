from sqlalchemy import create_engine, inspect
import os
from dotenv import load_dotenv

load_dotenv()
engine = create_engine(os.getenv('DATABASE_URL'))
inspector = inspect(engine)
cols = inspector.get_columns('evaluation_periods')
print('Columns in evaluation_periods:')
for col in cols:
    print(f"  - {col['name']} ({col['type']})")
