from database.connection import SessionLocal
from models.enhanced_models import Evaluation, EvaluationPeriod
from sqlalchemy import func

db = SessionLocal()

print("=" * 70)
print("EVALUATION PERIOD SENTIMENT CHECK")
print("=" * 70)

# Get active period
active_period = db.query(EvaluationPeriod).filter(EvaluationPeriod.status == 'active').first()
print(f"\nActive period: ID={active_period.id}, Name='{active_period.name}'" if active_period else "No active period")

# Check sentiment by period
period_sentiments = db.query(
    Evaluation.evaluation_period_id,
    Evaluation.sentiment,
    func.count(Evaluation.id)
).filter(
    Evaluation.submission_date.isnot(None)
).group_by(Evaluation.evaluation_period_id, Evaluation.sentiment).all()

print("\nSentiment distribution by period:")
for period_id, sentiment, count in period_sentiments:
    period = db.query(EvaluationPeriod).filter(EvaluationPeriod.id == period_id).first()
    period_name = period.name if period else "Unknown"
    print(f"  Period {period_id} ({period_name}): {sentiment} = {count}")

# Check specific evaluation 238
eval_238 = db.query(Evaluation).filter(Evaluation.id == 238).first()
if eval_238:
    print(f"\nEvaluation 238:")
    print(f"  Period ID: {eval_238.evaluation_period_id}")
    print(f"  Student ID: {eval_238.student_id}")
    print(f"  Sentiment: {eval_238.sentiment}")
    print(f"  Submitted: {eval_238.submission_date}")
else:
    print("\nEvaluation 238 not found")

# Check evaluations in active period
if active_period:
    active_evals = db.query(Evaluation).filter(
        Evaluation.evaluation_period_id == active_period.id,
        Evaluation.submission_date.isnot(None)
    ).limit(5).all()
    
    print(f"\nSample evaluations from active period {active_period.id}:")
    for ev in active_evals:
        print(f"  ID: {ev.id}, Student: {ev.student_id}, Sentiment: {ev.sentiment}")

db.close()
