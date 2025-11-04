-- ===============================================
-- PERFORMANCE INDEXES
-- Purpose: Optimize query performance for analytics and searches
-- Coverage: All major tables for evaluations, ML analytics, admin features, and secretary system
-- ===============================================

-- ================================================
-- EVALUATIONS TABLE INDEXES
-- Purpose: Fast evaluation queries and ML processing lookups
-- ================================================

CREATE INDEX IF NOT EXISTS idx_evaluations_sentiment ON evaluations(sentiment, sentiment_score);
CREATE INDEX IF NOT EXISTS idx_evaluations_anomaly ON evaluations(is_anomaly, anomaly_score);
CREATE INDEX IF NOT EXISTS idx_evaluations_date ON evaluations(submission_date);
CREATE INDEX IF NOT EXISTS idx_evaluations_processing ON evaluations(processing_status, processed_at);
CREATE INDEX IF NOT EXISTS idx_evaluations_student ON evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_class_section ON evaluations(class_section_id);

-- ================================================
-- USERS TABLE INDEXES
-- Purpose: Fast user lookups by role, department, and activity status
-- ================================================

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_department_role ON users(department_id, role);
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);

-- ================================================
-- CLASS SECTIONS TABLE INDEXES
-- Purpose: Fast course and instructor lookups
-- ================================================

CREATE INDEX IF NOT EXISTS idx_class_sections_course ON class_sections(course_id);
CREATE INDEX IF NOT EXISTS idx_class_sections_instructor ON class_sections(instructor_id);
CREATE INDEX IF NOT EXISTS idx_class_sections_semester ON class_sections(semester, academic_year);

-- ================================================
-- STUDENTS TABLE INDEXES
-- Purpose: Fast student searches and department filtering
-- ================================================

CREATE INDEX IF NOT EXISTS idx_students_user ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_department ON students(department_id);
CREATE INDEX IF NOT EXISTS idx_students_active ON students(is_active);
CREATE INDEX IF NOT EXISTS idx_students_number ON students(student_number);

-- ================================================
-- COURSES TABLE INDEXES
-- Purpose: Fast course searches and active status filtering
-- ================================================

CREATE INDEX IF NOT EXISTS idx_courses_program ON courses(program_id);
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active);
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(course_code);

-- ================================================
-- ANALYSIS RESULTS TABLE INDEXES
-- Purpose: Fast analytics queries and date-based reporting
-- ================================================

CREATE INDEX IF NOT EXISTS idx_analysis_results_date ON analysis_results(analysis_date);
CREATE INDEX IF NOT EXISTS idx_analysis_results_type ON analysis_results(analysis_type, class_section_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_class_section ON analysis_results(class_section_id);

-- ================================================
-- FIREBASE SYNC LOG TABLE INDEXES
-- Purpose: Fast sync status queries and error tracking
-- ================================================

CREATE INDEX IF NOT EXISTS idx_firebase_sync ON firebase_sync_log(table_name, record_id, sync_status);
CREATE INDEX IF NOT EXISTS idx_firebase_sync_status ON firebase_sync_log(sync_status, sync_timestamp);

-- ================================================
-- NOTIFICATION QUEUE TABLE INDEXES
-- Purpose: Fast notification delivery and status tracking
-- ================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notification_queue(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notification_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notification_queue(notification_type);

-- ================================================
-- EVALUATION PERIODS TABLE INDEXES
-- Purpose: Fast active period lookups and date range queries
-- ================================================

CREATE INDEX IF NOT EXISTS idx_evaluation_periods_active ON evaluation_periods(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_evaluation_periods_dates ON evaluation_periods(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_evaluation_periods_status ON evaluation_periods(status);
CREATE INDEX IF NOT EXISTS idx_evaluation_periods_semester ON evaluation_periods(semester, academic_year);

-- ================================================
-- SYSTEM SETTINGS TABLE INDEXES
-- Purpose: Fast settings retrieval by category
-- ================================================

CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(category, setting_key);

-- ================================================
-- AUDIT LOGS TABLE INDEXES
-- Purpose: Fast security auditing and log searches
-- ================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip ON audit_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);

-- ================================================
-- EXPORT HISTORY TABLE INDEXES
-- Purpose: Fast export tracking and cleanup
-- ================================================

CREATE INDEX IF NOT EXISTS idx_export_history_user ON export_history(exported_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_history_type ON export_history(export_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_history_status ON export_history(status);
CREATE INDEX IF NOT EXISTS idx_export_history_expires ON export_history(expires_at) WHERE is_deleted = FALSE;

-- ================================================
-- SECRETARY USERS TABLE INDEXES
-- Purpose: Fast secretary lookups and access control checks
-- ================================================

CREATE INDEX IF NOT EXISTS idx_secretary_users_user ON secretary_users(user_id);
CREATE INDEX IF NOT EXISTS idx_secretary_users_department ON secretary_users(department_id);
CREATE INDEX IF NOT EXISTS idx_secretary_users_active ON secretary_users(is_active);

-- ================================================
-- DEPARTMENTS TABLE INDEXES
-- Purpose: Fast department searches
-- ================================================

CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(department_code);
CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(is_active);

-- ================================================
-- ENROLLMENTS TABLE INDEXES (if exists)
-- Purpose: Fast enrollment lookups
-- ================================================

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_section ON enrollments(class_section_id);

-- ================================================
-- VERIFICATION QUERY
-- ================================================

-- List all indexes by table
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN (
    'users', 'students', 'courses', 'class_sections', 'evaluations', 'enrollments',
    'analysis_results', 'firebase_sync_log', 'notification_queue',
    'evaluation_periods', 'system_settings', 'audit_logs', 'export_history',
    'departments', 'secretary_users'
)
ORDER BY tablename, indexname;

-- Index usage statistics (run after some usage)
-- SELECT 
--     schemaname,
--     tablename,
--     indexname,
--     idx_scan as index_scans,
--     idx_tup_read as tuples_read,
--     idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;
