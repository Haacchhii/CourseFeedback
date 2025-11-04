-- ===============================================
-- DATABASE VIEWS
-- Purpose: Pre-built queries for analytics and reporting
-- Views: evaluation_analytics, department_overview, audit_log_summary, settings_by_category, 
--        export_statistics, secretary_department_overview, secretary_dashboard_stats
-- ===============================================

-- ================================================
-- 1. EVALUATION ANALYTICS VIEW
-- Purpose: Comprehensive evaluation metrics with sentiment and anomaly detection
-- Use Case: Course performance analysis, instructor evaluation reports
-- ================================================

CREATE OR REPLACE VIEW evaluation_analytics AS
SELECT 
    cs.id as class_section_id,
    cs.class_code,
    c.course_name,
    c.course_code,
    p.name as program_name,
    CONCAT(u.first_name, ' ', u.last_name) as instructor_name,
    cs.semester,
    cs.academic_year,
    
    -- Basic statistics
    COUNT(e.id) as total_evaluations,
    ROUND(AVG(e.rating_overall)::numeric, 2) as avg_overall_rating,
    ROUND(AVG(e.rating_teaching)::numeric, 2) as avg_teaching_rating,
    ROUND(AVG(e.rating_content)::numeric, 2) as avg_content_rating,
    ROUND(AVG(e.rating_engagement)::numeric, 2) as avg_engagement_rating,
    
    -- Sentiment analysis
    COUNT(CASE WHEN e.sentiment = 'positive' THEN 1 END) as positive_count,
    COUNT(CASE WHEN e.sentiment = 'neutral' THEN 1 END) as neutral_count,
    COUNT(CASE WHEN e.sentiment = 'negative' THEN 1 END) as negative_count,
    ROUND(AVG(e.sentiment_score)::numeric, 3) as avg_sentiment_score,
    
    -- Anomaly detection
    COUNT(CASE WHEN e.is_anomaly = true THEN 1 END) as anomaly_count,
    ROUND((COUNT(CASE WHEN e.is_anomaly = true THEN 1 END)::float / NULLIF(COUNT(e.id), 0) * 100)::numeric, 2) as anomaly_percentage,
    
    -- Response rate
    cs.max_students,
    ROUND((COUNT(e.id)::float / NULLIF(cs.max_students, 0) * 100)::numeric, 2) as response_rate_percentage
    
FROM class_sections cs
JOIN courses c ON cs.course_id = c.id
JOIN programs p ON c.program_id = p.id
LEFT JOIN users u ON cs.instructor_id = u.id
LEFT JOIN evaluations e ON cs.id = e.class_section_id
GROUP BY cs.id, cs.class_code, c.course_name, c.course_code, p.name, u.first_name, u.last_name, cs.semester, cs.academic_year, cs.max_students;

-- ================================================
-- 2. DEPARTMENT OVERVIEW VIEW
-- Purpose: Program-level statistics for department heads
-- Use Case: Department performance monitoring, program comparisons
-- ================================================

CREATE OR REPLACE VIEW department_overview AS
SELECT 
    p.name as program_name,
    p.code as program_code,
    COUNT(DISTINCT cs.id) as total_classes,
    COUNT(DISTINCT c.id) as total_courses,
    COUNT(DISTINCT e.id) as total_evaluations,
    ROUND(AVG(e.rating_overall)::numeric, 2) as avg_program_rating,
    COUNT(CASE WHEN e.sentiment = 'positive' THEN 1 END) as positive_feedback,
    COUNT(CASE WHEN e.sentiment = 'negative' THEN 1 END) as negative_feedback,
    COUNT(CASE WHEN e.is_anomaly = true THEN 1 END) as total_anomalies
FROM programs p
LEFT JOIN courses c ON p.id = c.program_id
LEFT JOIN class_sections cs ON c.id = cs.course_id
LEFT JOIN evaluations e ON cs.id = e.class_section_id
GROUP BY p.id, p.name, p.code;

-- ================================================
-- 3. AUDIT LOG SUMMARY VIEW
-- Purpose: Daily action summaries for security monitoring
-- Use Case: Security auditing, identifying unusual patterns
-- ================================================

CREATE OR REPLACE VIEW audit_log_summary AS
SELECT 
    DATE(timestamp) as log_date,
    action,
    entity_type,
    user_role,
    COUNT(*) as action_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(CASE WHEN status = 'failure' THEN 1 END) as failed_actions,
    COUNT(CASE WHEN severity IN ('error', 'critical') THEN 1 END) as error_count
FROM audit_logs
GROUP BY DATE(timestamp), action, entity_type, user_role
ORDER BY log_date DESC, action_count DESC;

-- ================================================
-- 4. SETTINGS BY CATEGORY VIEW
-- Purpose: System settings overview grouped by category
-- Use Case: Admin dashboard, configuration management
-- ================================================

CREATE OR REPLACE VIEW settings_by_category AS
SELECT 
    category,
    COUNT(*) as setting_count,
    COUNT(CASE WHEN setting_value IS NOT NULL AND setting_value != '' THEN 1 END) as configured_count,
    MAX(last_modified_at) as last_updated
FROM system_settings
GROUP BY category;

-- ================================================
-- 5. EXPORT STATISTICS VIEW
-- Purpose: Export metrics and performance
-- Use Case: Monitor export usage, identify popular export types
-- ================================================

CREATE OR REPLACE VIEW export_statistics AS
SELECT 
    export_type,
    export_format,
    COUNT(*) as total_exports,
    SUM(total_records) as total_records_exported,
    SUM(file_size_bytes) as total_size_bytes,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_exports,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_exports,
    AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_duration_seconds
FROM export_history
WHERE is_deleted = FALSE
GROUP BY export_type, export_format;

-- ================================================
-- 6. SECRETARY DEPARTMENT OVERVIEW VIEW
-- Purpose: Secretary access and department statistics
-- Use Case: Secretary management, department assignment overview
-- ================================================

CREATE OR REPLACE VIEW secretary_department_overview AS
SELECT 
    s.secretary_id,
    u.email,
    CONCAT(u.first_name, ' ', u.last_name) as secretary_name,
    d.department_name,
    d.department_code,
    s.access_level,
    s.can_view_evaluations,
    s.can_view_analytics,
    s.can_export_data,
    s.is_active,
    -- Count statistics
    (SELECT COUNT(*) FROM users u2 WHERE u2.department_id = s.department_id AND u2.role = 'instructor') as total_instructors,
    (SELECT COUNT(*) FROM students st WHERE st.department_id = s.department_id AND st.is_active = TRUE) as total_students,
    (SELECT COUNT(DISTINCT c.id) 
     FROM courses c 
     JOIN class_sections cs ON c.id = cs.course_id
     JOIN users i ON cs.instructor_id = i.id 
     WHERE i.department_id = s.department_id) as total_courses
FROM secretary_users s
JOIN users u ON s.user_id = u.id
JOIN departments d ON s.department_id = d.department_id
WHERE s.is_active = TRUE;

-- ================================================
-- 7. SECRETARY DASHBOARD STATS VIEW
-- Purpose: Comprehensive dashboard metrics for secretaries
-- Use Case: Secretary dashboard, department performance at-a-glance
-- ================================================

CREATE OR REPLACE VIEW secretary_dashboard_stats AS
SELECT 
    su.secretary_id,
    d.department_name,
    d.department_code,
    
    -- Instructor statistics
    (SELECT COUNT(*) FROM users u2 WHERE u2.department_id = su.department_id AND u2.role = 'instructor' AND u2.is_active = TRUE) as active_instructors,
    
    -- Student statistics  
    (SELECT COUNT(*) FROM students st WHERE st.department_id = su.department_id AND st.is_active = TRUE) as active_students,
    
    -- Course statistics
    (SELECT COUNT(DISTINCT c.id) 
     FROM courses c 
     JOIN class_sections cs ON c.id = cs.course_id
     JOIN users i ON cs.instructor_id = i.id 
     WHERE i.department_id = su.department_id AND c.is_active = TRUE) as active_courses,
     
    -- Evaluation statistics
    (SELECT COUNT(*) 
     FROM evaluations e 
     JOIN class_sections cs ON e.class_section_id = cs.id
     JOIN courses c ON cs.course_id = c.id
     JOIN users i ON cs.instructor_id = i.id 
     WHERE i.department_id = su.department_id) as total_evaluations,
     
    -- Recent evaluations (last 30 days)
    (SELECT COUNT(*) 
     FROM evaluations e 
     JOIN class_sections cs ON e.class_section_id = cs.id
     JOIN courses c ON cs.course_id = c.id
     JOIN users i ON cs.instructor_id = i.id 
     WHERE i.department_id = su.department_id 
     AND e.submission_date >= CURRENT_DATE - INTERVAL '30 days') as recent_evaluations,
     
    -- Average rating
    (SELECT ROUND(AVG(e.rating_overall), 2) 
     FROM evaluations e 
     JOIN class_sections cs ON e.class_section_id = cs.id
     JOIN courses c ON cs.course_id = c.id
     JOIN users i ON cs.instructor_id = i.id 
     WHERE i.department_id = su.department_id) as avg_department_rating
     
FROM secretary_users su
JOIN departments d ON su.department_id = d.department_id
WHERE su.is_active = TRUE;

-- ================================================
-- VERIFICATION QUERY
-- ================================================

-- List all views created
SELECT table_name as view_name, view_definition 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN (
    'evaluation_analytics', 
    'department_overview', 
    'audit_log_summary', 
    'settings_by_category', 
    'export_statistics',
    'secretary_department_overview',
    'secretary_dashboard_stats'
)
ORDER BY table_name;
