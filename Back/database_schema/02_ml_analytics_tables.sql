-- ===============================================
-- ML & ANALYTICS TABLES
-- Purpose: Tables for machine learning processing, sentiment analysis, and notifications
-- Tables: analysis_results, firebase_sync_log, notification_queue
-- ===============================================

-- ================================================
-- 1. ANALYSIS RESULTS TABLE
-- Purpose: Store aggregated ML analysis results for class sections
-- Use Case: Sentiment analysis, anomaly detection, trend analysis
-- ================================================

CREATE TABLE IF NOT EXISTS analysis_results (
    id SERIAL PRIMARY KEY,
    class_section_id INTEGER REFERENCES class_sections(id),
    analysis_type VARCHAR(50) NOT NULL, -- 'sentiment', 'anomaly', 'trend'
    
    -- Aggregated Results
    total_evaluations INTEGER DEFAULT 0,
    positive_count INTEGER DEFAULT 0,
    neutral_count INTEGER DEFAULT 0,
    negative_count INTEGER DEFAULT 0,
    anomaly_count INTEGER DEFAULT 0,
    
    -- Statistical Measures
    avg_overall_rating FLOAT,
    avg_sentiment_score FLOAT,
    confidence_interval FLOAT,
    
    -- Detailed Results (JSON format for flexibility)
    detailed_results JSONB,
    
    -- Metadata
    analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    model_version VARCHAR(20),
    processing_time_ms INTEGER
);

-- Ensure unique analysis per class section per type per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_analysis_per_class_type 
ON analysis_results(class_section_id, analysis_type, (analysis_date::date));

-- ================================================
-- 2. FIREBASE SYNC LOG TABLE
-- Purpose: Track synchronization between PostgreSQL and Firebase
-- Use Case: Real-time data sync, troubleshooting sync issues
-- ================================================

CREATE TABLE IF NOT EXISTS firebase_sync_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER NOT NULL,
    firebase_doc_id VARCHAR(255),
    sync_type VARCHAR(20) NOT NULL, -- 'create', 'update', 'delete'
    sync_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'synced', 'failed'
    sync_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0
);

-- ================================================
-- 3. NOTIFICATION QUEUE TABLE
-- Purpose: Queue for push notifications and email alerts
-- Use Case: Anomaly alerts, evaluation reminders, system notifications
-- ================================================

CREATE TABLE IF NOT EXISTS notification_queue (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    notification_type VARCHAR(50) NOT NULL, -- 'anomaly_alert', 'evaluation_complete', 'dashboard_update'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional notification data
    firebase_token VARCHAR(500), -- FCM token
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- VERIFICATION QUERY
-- ================================================

-- Check if all ML tables were created
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('analysis_results', 'firebase_sync_log', 'notification_queue')
ORDER BY table_name;
