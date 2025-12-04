from database.connection import SessionLocal
from models.enhanced_models import Evaluation
from sqlalchemy import func

db = SessionLocal()

print("=" * 70)
print("EVALUATION SENTIMENT CHECK")
print("=" * 70)

# Check sentiment distribution
sentiment_counts = db.query(
    Evaluation.sentiment, 
    func.count(Evaluation.id)
).filter(
    Evaluation.submission_date.isnot(None)
).group_by(Evaluation.sentiment).all()

print("\nSentiment distribution for submitted evaluations:")
for sentiment, count in sentiment_counts:
    print(f"  {sentiment}: {count}")

# Sample evaluations with null sentiment
null_sentiment = db.query(Evaluation).filter(
    Evaluation.submission_date.isnot(None),
    Evaluation.sentiment.is_(None)
).limit(5).all()

print(f"\nSample evaluations with NULL sentiment:")
for ev in null_sentiment:
    print(f"  ID: {ev.id}, Student: {ev.student_id}, Submitted: {ev.submission_date}, Sentiment: {ev.sentiment}")

# Total submitted evaluations
total_submitted = db.query(func.count(Evaluation.id)).filter(
    Evaluation.submission_date.isnot(None)
).scalar()

print(f"\nTotal submitted evaluations: {total_submitted}")

db.close()
