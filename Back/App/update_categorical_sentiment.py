"""Update sentiment categorical values based on sentiment_score"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

def main():
    session = Session()
    
    try:
        print("=" * 80)
        print("UPDATING CATEGORICAL SENTIMENT FROM SENTIMENT_SCORE")
        print("=" * 80)
        print()
        
        # Update sentiment based on sentiment_score
        # sentiment_score is 0-1 scale
        # positive: >= 0.7, neutral: 0.4-0.7, negative: < 0.4
        result = session.execute(text("""
            UPDATE evaluations
            SET sentiment = CASE
                WHEN sentiment_score >= 0.7 THEN 'positive'
                WHEN sentiment_score >= 0.4 THEN 'neutral'
                ELSE 'negative'
            END
            WHERE sentiment_score IS NOT NULL
            AND status = 'completed'
        """))
        
        session.commit()
        
        print(f"✅ Updated {result.rowcount} evaluations with categorical sentiment")
        print()
        
        # Show distribution
        distribution = session.execute(text("""
            SELECT sentiment, COUNT(*) as count
            FROM evaluations
            WHERE status = 'completed'
            GROUP BY sentiment
            ORDER BY sentiment
        """)).fetchall()
        
        print("Sentiment Distribution:")
        for row in distribution:
            sentiment = row[0] if row[0] else 'NULL'
            count = row[1]
            print(f"   {sentiment}: {count}")
        
        print()
        print("=" * 80)
        
    except Exception as e:
        session.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

if __name__ == "__main__":
    main()
