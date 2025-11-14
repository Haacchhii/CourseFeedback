"""Test if the Evaluation model matches the database structure"""
from models.enhanced_models import Evaluation
from database.connection import get_db
from sqlalchemy import inspect

db = next(get_db())

# Get model columns
print("\n=== Model Columns (enhanced_models.py) ===")
model_columns = {col.name: str(col.type) for col in Evaluation.__table__.columns}
for col_name, col_type in sorted(model_columns.items()):
    print(f"{col_name}: {col_type}")

# Get database columns
print("\n=== Database Columns (actual table) ===")
inspector = inspect(db.bind)
db_columns = {col['name']: str(col['type']) for col in inspector.get_columns('evaluations')}
for col_name, col_type in sorted(db_columns.items()):
    print(f"{col_name}: {col_type}")

# Check for mismatches
print("\n=== Mismatch Check ===")
model_cols = set(model_columns.keys())
db_cols = set(db_columns.keys())

missing_in_model = db_cols - model_cols
missing_in_db = model_cols - db_cols

if missing_in_model:
    print(f"❌ Columns in DB but NOT in model: {missing_in_model}")
else:
    print("✅ All DB columns are in the model")

if missing_in_db:
    print(f"⚠️  Columns in model but NOT in DB: {missing_in_db}")
else:
    print("✅ All model columns exist in DB")

if not missing_in_model and not missing_in_db:
    print("\n✅ MODEL AND DATABASE ARE PERFECTLY ALIGNED!")
