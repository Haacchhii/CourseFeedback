from database.connection import get_db
from models.enhanced_models import EvaluationPeriod

db = next(get_db())
periods = db.query(EvaluationPeriod).all()

print("\n=== Current Evaluation Periods in Database ===")
for p in periods:
    print(f"\nID: {p.id}")
    print(f"Name: {p.name}")
    print(f"Status (raw): {repr(p.status)}")
    print(f"Start: {p.start_date}")
    print(f"End: {p.end_date}")
    print("-" * 50)
