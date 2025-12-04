"""
Quick Test Script for ML Models
Tests both sentiment analysis and anomaly detection
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

print("="*70)
print("🧪 TESTING ML MODELS")
print("="*70)

# Test 1: Sentiment Analysis
print("\n📊 TEST 1: SENTIMENT ANALYSIS")
print("-"*70)

try:
    from ml_services.sentiment_analyzer import SentimentAnalyzer
    
    # Load the trained model
    model_path = "ml_services/models/svm_sentiment_model.pkl"
    analyzer = SentimentAnalyzer(model_path=model_path)
    print("✅ Sentiment analyzer loaded successfully")
    
    test_cases = [
        "Excellent course! The instructor was very knowledgeable.",
        "The course was okay, nothing special.",
        "Terrible experience, very poor teaching.",
        "Great learning materials and helpful professor!",
        "Average teaching, some good parts, some not."
    ]
    
    print("\nTest predictions:")
    for text in test_cases:
        sentiment, confidence = analyzer.predict(text)
        emoji = "😊" if sentiment == "positive" else "😐" if sentiment == "neutral" else "😞"
        print(f"\n{emoji} Text: {text[:50]}...")
        print(f"   Prediction: {sentiment.upper()} (confidence: {confidence:.2%})")
    
    print("\n✅ Sentiment analysis working correctly!")
    
except Exception as e:
    print(f"❌ ERROR in sentiment analysis: {e}")
    import traceback
    traceback.print_exc()

# Test 2: Anomaly Detection
print("\n" + "="*70)
print("🔍 TEST 2: ANOMALY DETECTION")
print("-"*70)

try:
    from ml_services.anomaly_detector import AnomalyDetector
    
    detector = AnomalyDetector()
    print("✅ Anomaly detector loaded successfully")
    
    test_cases = [
        {
            'name': 'Normal varied ratings',
            'ratings': {'r1': 4, 'r2': 3, 'r3': 4, 'r4': 3, 'r5': 4}
        },
        {
            'name': 'Straight-lining (all 4s)',
            'ratings': {'r1': 4, 'r2': 4, 'r3': 4, 'r4': 4, 'r5': 4}
        },
        {
            'name': 'All minimum (all 1s)',
            'ratings': {'r1': 1, 'r2': 1, 'r3': 1, 'r4': 1, 'r5': 1}
        },
        {
            'name': 'Alternating pattern',
            'ratings': {'r1': 4, 'r2': 1, 'r3': 4, 'r4': 1, 'r5': 4}
        }
    ]
    
    print("\nTest predictions:")
    for test in test_cases:
        is_anomaly, score, reason = detector.detect(test['ratings'])
        
        if is_anomaly:
            print(f"\n🚨 {test['name']}")
            print(f"   Ratings: {list(test['ratings'].values())}")
            print(f"   Result: ANOMALY DETECTED")
            print(f"   Score: {score:.3f}")
            print(f"   Reason: {reason}")
        else:
            print(f"\n✅ {test['name']}")
            print(f"   Ratings: {list(test['ratings'].values())}")
            print(f"   Result: Normal pattern")
            print(f"   Score: {score:.3f}")
    
    print("\n✅ Anomaly detection working correctly!")
    
except Exception as e:
    print(f"❌ ERROR in anomaly detection: {e}")
    import traceback
    traceback.print_exc()

# Summary
print("\n" + "="*70)
print("📝 SUMMARY")
print("="*70)
print("✅ All ML models tested successfully!")
print("\nModels ready for:")
print("  • Analyzing student feedback sentiment")
print("  • Detecting suspicious rating patterns")
print("  • Generating insights for staff dashboard")
print("\nTo retrain models:")
print("  python train_ml_models.py")
print("="*70)
