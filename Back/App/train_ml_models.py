"""
Train Initial ML Models
Trains both SVM sentiment analyzer and DBSCAN anomaly detector
Run this script to create the initial ML models
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ml_services.sentiment_analyzer import SentimentAnalyzer, create_training_data
from ml_services.anomaly_detector import AnomalyDetector
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def train_sentiment_model():
    """Train and save the SVM sentiment analysis model"""
    logger.info("=" * 60)
    logger.info("TRAINING SENTIMENT ANALYSIS MODEL")
    logger.info("=" * 60)
    
    # Create analyzer
    analyzer = SentimentAnalyzer()
    
    # Get training data
    texts, labels = create_training_data()
    logger.info(f"Training data: {len(texts)} samples")
    
    # Count labels
    from collections import Counter
    label_counts = Counter(labels)
    logger.info(f"Label distribution: {dict(label_counts)}")
    
    # Train model
    metrics = analyzer.train(texts, labels, test_size=0.2)
    
    logger.info("\n" + "=" * 60)
    logger.info("TRAINING RESULTS")
    logger.info("=" * 60)
    logger.info(f"Accuracy: {metrics['accuracy']:.4f}")
    logger.info(f"Train samples: {metrics['train_samples']}")
    logger.info(f"Test samples: {metrics['test_samples']}")
    
    # Print classification report
    report = metrics['report']
    logger.info("\nPer-class metrics:")
    for label in ['positive', 'neutral', 'negative']:
        if label in report:
            logger.info(f"  {label}:")
            logger.info(f"    Precision: {report[label]['precision']:.4f}")
            logger.info(f"    Recall: {report[label]['recall']:.4f}")
            logger.info(f"    F1-score: {report[label]['f1-score']:.4f}")
    
    # Save model
    model_path = analyzer.save_model()
    logger.info(f"\n✅ Model saved to: {model_path}")
    
    # Test predictions
    logger.info("\n" + "=" * 60)
    logger.info("TEST PREDICTIONS")
    logger.info("=" * 60)
    
    test_cases = [
        "Excellent course! The instructor was very knowledgeable and engaging.",
        "The course was okay, nothing particularly special.",
        "Terrible experience, very poor teaching and organization.",
        "Great learning experience with comprehensive materials.",
        "Average teaching, some topics were good but others lacked depth.",
        "Horrible course, complete waste of time."
    ]
    
    for text in test_cases:
        sentiment, confidence = analyzer.predict(text)
        logger.info(f"\nText: {text[:60]}...")
        logger.info(f"Prediction: {sentiment} (confidence: {confidence:.4f})")
    
    return analyzer

def test_anomaly_detection():
    """Test the anomaly detection system"""
    logger.info("\n" + "=" * 60)
    logger.info("TESTING ANOMALY DETECTION")
    logger.info("=" * 60)
    
    # Create detector
    detector = AnomalyDetector()
    
    # Test cases
    test_cases = [
        {
            'name': '✓ Normal evaluation (varied ratings)',
            'ratings': {
                'relevance_subject_knowledge': 4,
                'relevance_practical_skills': 3,
                'relevance_team_work': 4,
                'org_curriculum': 3,
                'teaching_tlas_useful': 4,
                'assessment_start': 3,
                'environment_classrooms': 3
            }
        },
        {
            'name': '⚠ Straight-lining (all 4s - suspicious)',
            'ratings': {
                'relevance_subject_knowledge': 4,
                'relevance_practical_skills': 4,
                'relevance_team_work': 4,
                'org_curriculum': 4,
                'teaching_tlas_useful': 4,
                'assessment_start': 4,
                'environment_classrooms': 4
            }
        },
        {
            'name': '⚠ All minimum ratings (all 1s - bot behavior)',
            'ratings': {
                'relevance_subject_knowledge': 1,
                'relevance_practical_skills': 1,
                'relevance_team_work': 1,
                'org_curriculum': 1,
                'teaching_tlas_useful': 1,
                'assessment_start': 1,
                'environment_classrooms': 1
            }
        },
        {
            'name': '⚠ Alternating pattern (4,1,4,1... - suspicious)',
            'ratings': {
                'relevance_subject_knowledge': 4,
                'relevance_practical_skills': 1,
                'relevance_team_work': 4,
                'org_curriculum': 1,
                'teaching_tlas_useful': 4,
                'assessment_start': 1,
                'environment_classrooms': 4
            }
        },
        {
            'name': '✓ Slightly negative but normal',
            'ratings': {
                'relevance_subject_knowledge': 2,
                'relevance_practical_skills': 3,
                'relevance_team_work': 2,
                'org_curriculum': 2,
                'teaching_tlas_useful': 3,
                'assessment_start': 2,
                'environment_classrooms': 2
            }
        },
        {
            'name': '⚠ Very low variance (almost identical - suspicious)',
            'ratings': {
                'relevance_subject_knowledge': 3,
                'relevance_practical_skills': 3,
                'relevance_team_work': 3,
                'org_curriculum': 3,
                'teaching_tlas_useful': 3,
                'assessment_start': 3,
                'environment_classrooms': 3
            }
        }
    ]
    
    for test in test_cases:
        logger.info(f"\n{test['name']}")
        logger.info(f"Ratings: {list(test['ratings'].values())}")
        
        is_anomaly, score, reason = detector.detect(test['ratings'])
        
        if is_anomaly:
            logger.info(f"🚨 ANOMALY DETECTED")
            logger.info(f"   Score: {score:.3f}")
            logger.info(f"   Reason: {reason}")
        else:
            logger.info(f"✅ Normal pattern")
            logger.info(f"   Score: {score:.3f}")
    
    logger.info("\n✅ Anomaly detection system ready!")

def main():
    """Main training script"""
    logger.info("\n🚀 STARTING ML MODEL TRAINING")
    logger.info("=" * 60)
    
    try:
        # Train sentiment model
        analyzer = train_sentiment_model()
        
        # Test anomaly detection
        test_anomaly_detection()
        
        logger.info("\n" + "=" * 60)
        logger.info("✅ ALL ML MODELS READY!")
        logger.info("=" * 60)
        logger.info("\nNext steps:")
        logger.info("1. The SVM model is saved and will be used automatically")
        logger.info("2. Anomaly detection runs in real-time during evaluations")
        logger.info("3. Restart the backend server to load the new models")
        logger.info("4. Submit evaluations to see ML in action!")
        
    except Exception as e:
        logger.error(f"❌ Error during training: {e}", exc_info=True)
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
