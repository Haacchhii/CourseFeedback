from database.connection import SessionLocal
from models.enhanced_models import Evaluation, ClassSection, Course

db = SessionLocal()

# Query like the endpoint does
query = db.query(Evaluation).join(
    ClassSection, Evaluation.class_section_id == ClassSection.id
).join(
    Course, ClassSection.course_id == Course.id
).filter(
    Evaluation.evaluation_period_id == 12
)

# Get first few
evals = query.limit(5).all()

print("=" * 70)
print("EVALUATION SENTIMENT LOADING TEST")
print("=" * 70)

for ev in evals:
    print(f"\nEval ID: {ev.id}")
    print(f"  Student ID: {ev.student_id}")
    print(f"  Sentiment (direct): {ev.sentiment}")
    print(f"  Has attr 'sentiment': {hasattr(ev, 'sentiment')}")
    print(f"  Sentiment type: {type(ev.sentiment)}")
    
    # Try to force load
    db.refresh(ev)
    print(f"  After refresh: {ev.sentiment}")

db.close()
