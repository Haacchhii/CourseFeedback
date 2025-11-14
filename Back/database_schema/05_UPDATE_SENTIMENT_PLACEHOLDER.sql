-- Update Existing Evaluations with Placeholder Sentiment Analysis
-- This script adds sentiment to all existing evaluations based on their ratings

-- Add sentiment columns if they don't exist (should already exist)
ALTER TABLE evaluations 
ADD COLUMN IF NOT EXISTS sentiment VARCHAR(20),
ADD COLUMN IF NOT EXISTS sentiment_score NUMERIC(4,3);

-- Update all existing evaluations with placeholder sentiment
UPDATE evaluations
SET 
    sentiment = CASE 
        WHEN (rating_teaching + rating_content + rating_engagement + rating_overall) / 4.0 >= 3.5 
            THEN 'positive'
        WHEN (rating_teaching + rating_content + rating_engagement + rating_overall) / 4.0 >= 2.5 
            THEN 'neutral'
        ELSE 'negative'
    END,
    sentiment_score = CASE 
        WHEN (rating_teaching + rating_content + rating_engagement + rating_overall) / 4.0 >= 3.5 
            THEN 0.8 + ((rating_teaching + rating_content + rating_engagement + rating_overall) / 4.0 - 3.5) * 0.4
        WHEN (rating_teaching + rating_content + rating_engagement + rating_overall) / 4.0 >= 2.5 
            THEN 0.4 + ((rating_teaching + rating_content + rating_engagement + rating_overall) / 4.0 - 2.5) * 0.4
        ELSE ((rating_teaching + rating_content + rating_engagement + rating_overall) / 4.0 - 1.0) * 0.267
    END,
    processing_status = 'completed'
WHERE sentiment IS NULL OR processing_status = 'pending';

-- Verify the update
SELECT 
    sentiment,
    COUNT(*) as count,
    ROUND(AVG((rating_teaching + rating_content + rating_engagement + rating_overall) / 4.0), 2) as avg_rating,
    ROUND(AVG(sentiment_score), 3) as avg_sentiment_score
FROM evaluations
GROUP BY sentiment
ORDER BY sentiment;

-- Show total updated
SELECT 
    COUNT(*) as total_evaluations,
    COUNT(*) FILTER (WHERE sentiment IS NOT NULL) as with_sentiment,
    COUNT(*) FILTER (WHERE sentiment = 'positive') as positive,
    COUNT(*) FILTER (WHERE sentiment = 'neutral') as neutral,
    COUNT(*) FILTER (WHERE sentiment = 'negative') as negative
FROM evaluations;
