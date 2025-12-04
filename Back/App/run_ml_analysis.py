"""Run ML analysis on completed evaluations to populate sentiment_score and is_anomaly"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
import json
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import SVC
from sklearn.cluster import DBSCAN
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/course_feedback')
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

def calculate_sentiment(ratings_dict, text_feedback=None):
    """Calculate sentiment score from ratings (0-1 scale)"""
    if not ratings_dict:
        return 0.5
    
    # Average rating (1-4 scale) normalized to 0-1
    ratings_list = [v for v in ratings_dict.values() if isinstance(v, (int, float))]
    if not ratings_list:
        return 0.5
    
    avg_rating = np.mean(ratings_list)
    # Normalize from 1-4 scale to 0-1 scale
    sentiment = (avg_rating - 1) / 3
    return round(sentiment, 3)

def detect_anomalies(evaluations):
    """Detect anomalies using simple statistical method (replacing DBSCAN for demo)"""
    if len(evaluations) < 5:
        return [False] * len(evaluations)
    
    # Calculate z-scores for overall ratings
    ratings = [e['rating_overall'] for e in evaluations]
    mean_rating = np.mean(ratings)
    std_rating = np.std(ratings)
    
    anomalies = []
    for rating in ratings:
        if std_rating == 0:
            anomalies.append(False)
        else:
            z_score = abs((rating - mean_rating) / std_rating)
            # Flag as anomaly if z-score > 2 (more than 2 standard deviations)
            anomalies.append(z_score > 2)
    
    return anomalies

def main():
    session = Session()
    
    try:
        print("=" * 80)
        print("RUNNING ML ANALYSIS ON EVALUATIONS")
        print("=" * 80)
        print()
        
        # Get all completed evaluations
        evaluations = session.execute(text("""
            SELECT 
                id,
                ratings,
                text_feedback,
                rating_overall,
                rating_teaching,
                rating_content,
                rating_engagement
            FROM evaluations
            WHERE status = 'completed'
            ORDER BY id
        """)).fetchall()
        
        print(f"📊 Found {len(evaluations)} completed evaluations")
        print()
        
        # Prepare evaluation data
        eval_data = []
        for e in evaluations:
            # ratings is already a dict from PostgreSQL JSONB
            ratings_dict = e[1] if e[1] else {}
            if isinstance(ratings_dict, str):
                ratings_dict = json.loads(ratings_dict)
            eval_data.append({
                'id': e[0],
                'ratings': ratings_dict,
                'text_feedback': e[2],
                'rating_overall': e[3],
                'rating_teaching': e[4],
                'rating_content': e[5],
                'rating_engagement': e[6]
            })
        
        # Calculate sentiment scores
        print("🎯 Calculating sentiment scores...")
        for eval_item in eval_data:
            sentiment = calculate_sentiment(eval_item['ratings'], eval_item['text_feedback'])
            eval_item['sentiment_score'] = sentiment
        
        # Detect anomalies
        print("🔍 Detecting anomalies...")
        anomalies = detect_anomalies(eval_data)
        for i, eval_item in enumerate(eval_data):
            eval_item['is_anomaly'] = anomalies[i]
        
        # Update database
        print("💾 Updating database...")
        update_count = 0
        anomaly_count = 0
        
        for eval_item in eval_data:
            session.execute(text("""
                UPDATE evaluations
                SET 
                    sentiment_score = :sentiment,
                    is_anomaly = :is_anomaly
                WHERE id = :eval_id
            """), {
                'eval_id': eval_item['id'],
                'sentiment': eval_item['sentiment_score'],
                'is_anomaly': eval_item['is_anomaly']
            })
            update_count += 1
            if eval_item['is_anomaly']:
                anomaly_count += 1
            
            if update_count % 20 == 0:
                print(f"   ✓ Updated {update_count}/{len(eval_data)} evaluations...")
        
        session.commit()
        
        print()
        print("=" * 80)
        print("✅ ML ANALYSIS COMPLETE")
        print("=" * 80)
        print()
        print(f"📊 Statistics:")
        print(f"   - Total evaluations analyzed: {update_count}")
        print(f"   - Anomalies detected: {anomaly_count} ({anomaly_count/update_count*100:.1f}%)")
        
        # Show sentiment distribution
        sentiments = [e['sentiment_score'] for e in eval_data]
        avg_sentiment = np.mean(sentiments)
        print(f"   - Average sentiment score: {avg_sentiment:.3f}")
        print(f"   - Sentiment range: {min(sentiments):.3f} - {max(sentiments):.3f}")
        
        # Show sample anomalies
        anomaly_samples = [e for e in eval_data if e['is_anomaly']]
        if anomaly_samples:
            print()
            print("🚨 Sample Anomalies:")
            for sample in anomaly_samples[:5]:
                print(f"   Eval ID {sample['id']}: Overall Rating = {sample['rating_overall']}, Sentiment = {sample['sentiment_score']:.3f}")
        
        print()
        print("✅ Sentiment and anomaly data ready for visualization!")
        
    except Exception as e:
        session.rollback()
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

if __name__ == "__main__":
    main()
