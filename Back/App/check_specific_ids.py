from database.connection import SessionLocal
from models.enhanced_models import Evaluation

db = SessionLocal()

print("=" * 70)
print("CHECK SPECIFIC EVALUATION IDS")
print("=" * 70)

eval_ids = [199, 206, 57, 196, 59, 208, 61, 62, 209, 207]

for eval_id in eval_ids:
    ev = db.query(Evaluation).filter(Evaluation.id == eval_id).first()
    if ev:
        print(f"\nID {eval_id}:")
        print(f"  Student: {ev.student_id}")
        print(f"  Period: {ev.evaluation_period_id}")
        print(f"  Sentiment: {ev.sentiment}")
        print(f"  Submitted: {ev.submission_date}")
    else:
        print(f"\nID {eval_id}: NOT FOUND")

db.close()
