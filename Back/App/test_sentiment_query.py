"""Test sentiment analysis query to diagnose frontend issue"""
from database.connection import SessionLocal
from models.enhanced_models import Evaluation, Enrollment, EvaluationPeriod
from sqlalchemy import and_, func, cast, Date
from datetime import datetime, timedelta

db = SessionLocal()

# Get active period
active_period = db.query(EvaluationPeriod).filter(
    EvaluationPeriod.status == 'active'
).first()
print(f"Active period: {active_period.id if active_period else None}")

# Calculate date range (month)
now = datetime.now()
start_date = now - timedelta(days=30)
print(f"Date range: {start_date.date()} to {now.date()}")

# Test the exact query from secretary.py
date_col = cast(func.date_trunc('day', Evaluation.submission_date), Date)
query = db.query(
    date_col.label('date'),
    Evaluation.sentiment,
    func.count(Evaluation.id).label('count')
).join(
    Enrollment, and_(
        Evaluation.class_section_id == Enrollment.class_section_id,
        Evaluation.student_id == Enrollment.student_id
    )
).filter(
    Evaluation.submission_date >= start_date
)

if active_period:
    query = query.filter(Enrollment.evaluation_period_id == active_period.id)

sentiments = query.group_by(
    date_col,
    Evaluation.sentiment
).order_by(date_col).all()

print(f"\nResults from query: {len(sentiments)} rows")
for date, sentiment, count in sentiments[:10]:  # Show first 10
    print(f"  {date}: {sentiment} = {count}")

# Also test overall statistics
total_query = db.query(func.count(Evaluation.id)).join(
    Enrollment, and_(
        Evaluation.class_section_id == Enrollment.class_section_id,
        Evaluation.student_id == Enrollment.student_id
    )
).filter(
    Evaluation.submission_date >= start_date
)
if active_period:
    total_query = total_query.filter(Enrollment.evaluation_period_id == active_period.id)
total_evals = total_query.scalar() or 0

print(f"\nTotal evaluations in range: {total_evals}")

# Test sentiment summary
sentiment_query = db.query(
    Evaluation.sentiment,
    func.count(Evaluation.id).label('count')
).join(
    Enrollment, and_(
        Evaluation.class_section_id == Enrollment.class_section_id,
        Evaluation.student_id == Enrollment.student_id
    )
).filter(
    Evaluation.submission_date >= start_date
)
if active_period:
    sentiment_query = sentiment_query.filter(Enrollment.evaluation_period_id == active_period.id)
sentiment_counts = sentiment_query.group_by(Evaluation.sentiment).all()

print("\nSentiment distribution:")
for sentiment, count in sentiment_counts:
    print(f"  {sentiment}: {count}")

db.close()
