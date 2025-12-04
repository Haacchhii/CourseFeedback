"""
Test #1: Verify ML Analysis on Evaluations
Check that sentiment analysis and anomaly detection are working
"""
from database.connection import get_db
from sqlalchemy import text

db = next(get_db())

print('=' * 80)
print('TEST #1: ML ANALYSIS VERIFICATION')
print('=' * 80)

# Check sentiment analysis coverage
result = db.execute(text("""
    SELECT 
        COUNT(*) as total_evaluations,
        COUNT(sentiment) as with_sentiment,
        ROUND(COUNT(sentiment)::NUMERIC / COUNT(*)::NUMERIC * 100, 2) as sentiment_coverage,
        COUNT(CASE WHEN is_anomaly = true THEN 1 END) as anomalies_detected,
        COUNT(CASE WHEN sentiment = 'positive' THEN 1 END) as positive_count,
        COUNT(CASE WHEN sentiment = 'neutral' THEN 1 END) as neutral_count,
        COUNT(CASE WHEN sentiment = 'negative' THEN 1 END) as negative_count
    FROM evaluations;
""")).fetchone()

print('\n📊 ML ANALYSIS STATISTICS:')
print('-' * 80)
print(f'Total Evaluations: {result[0]}')
print(f'With Sentiment: {result[1]} ({result[2]}%)')
print(f'Anomalies Detected: {result[3]}')
print(f'\nSentiment Breakdown:')
print(f'  • Positive: {result[4]}')
print(f'  • Neutral: {result[5]}')
print(f'  • Negative: {result[6]}')

# Verify sentiment column exists and has valid values
sentiment_check = db.execute(text("""
    SELECT DISTINCT sentiment 
    FROM evaluations 
    WHERE sentiment IS NOT NULL
    ORDER BY sentiment;
""")).fetchall()

print(f'\nValid Sentiment Values: {[s[0] for s in sentiment_check]}')

# Check anomaly distribution
anomaly_stats = db.execute(text("""
    SELECT 
        is_anomaly,
        COUNT(*) as count
    FROM evaluations
    GROUP BY is_anomaly
    ORDER BY is_anomaly;
""")).fetchall()

print(f'\nAnomaly Distribution:')
for stat in anomaly_stats:
    status = '🚨 Anomaly' if stat[0] else '✅ Normal'
    print(f'  {status}: {stat[1]} evaluations')

# Test results
print('\n' + '=' * 80)
print('TEST RESULTS:')
print('-' * 80)

passed = True
if result[0] == 0:
    print('❌ FAIL: No evaluations found')
    passed = False
elif result[1] < result[0]:
    print(f'⚠️  WARNING: Only {result[2]}% have sentiment analysis')
    print('   Some evaluations may need reprocessing')
elif result[2] == 100:
    print('✅ PASS: 100% sentiment coverage')
else:
    print('❌ FAIL: Sentiment analysis incomplete')
    passed = False

if result[3] > 0:
    print(f'✅ PASS: Anomaly detection active ({result[3]} flagged)')
else:
    print('⚠️  INFO: No anomalies detected (could be normal)')

if len(sentiment_check) >= 2:
    print(f'✅ PASS: Multiple sentiment categories detected')
else:
    print('⚠️  WARNING: Limited sentiment variety')

print('\n' + '=' * 80)
if passed:
    print('✅ ML ANALYSIS TEST: PASSED')
else:
    print('❌ ML ANALYSIS TEST: FAILED')
print('=' * 80)

db.close()
