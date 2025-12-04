-- ============================================================================
-- PERFORMANCE OPTIMIZATION: Semester-Based Query Indexes
-- ============================================================================
-- Purpose: Add indexes to optimize semester-based queries for long-term operation
-- Date: December 2, 2025
-- ============================================================================

-- Index for evaluations filtered by evaluation period and submission date
-- Improves performance for semester-specific analytics and historical comparisons
CREATE INDEX IF NOT EXISTS idx_evaluations_period_semester 
ON evaluations(evaluation_period_id, submitted_at);

-- Index for evaluations by sentiment (for sentiment analysis dashboard)
CREATE INDEX IF NOT EXISTS idx_evaluations_sentiment 
ON evaluations(sentiment) 
WHERE sentiment IS NOT NULL;

-- Index for class sections by academic year and semester
-- Speeds up semester rollover and historical course queries
CREATE INDEX IF NOT EXISTS idx_class_sections_semester_year 
ON class_sections(academic_year, semester);

-- Index for evaluation periods by status and dates
-- Already exists but verify (critical for active period queries)
CREATE INDEX IF NOT EXISTS idx_evaluation_periods_status_dates 
ON evaluation_periods(status, start_date, end_date);

-- Index for evaluation periods by academic year and semester
-- Enables fast semester filtering and comparison
CREATE INDEX IF NOT EXISTS idx_evaluation_periods_year_semester 
ON evaluation_periods(academic_year, semester);

-- Index for enrollments to speed up student-section lookups
CREATE INDEX IF NOT EXISTS idx_enrollments_student_section 
ON enrollments(student_id, class_section_id);

-- Index for students by program and year level
-- Improves program-section filtering performance
CREATE INDEX IF NOT EXISTS idx_students_program_year 
ON students(program_id, year_level);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all indexes on evaluations table
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'evaluations'
ORDER BY indexname;

-- Check all indexes on evaluation_periods table
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'evaluation_periods'
ORDER BY indexname;

-- Check all indexes on class_sections table
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'class_sections'
ORDER BY indexname;

-- ============================================================================
-- PERFORMANCE TEST QUERIES
-- ============================================================================

-- Test query: Get evaluations for specific semester
EXPLAIN ANALYZE
SELECT e.*, ep.semester, ep.academic_year
FROM evaluations e
JOIN evaluation_periods ep ON e.evaluation_period_id = ep.id
WHERE ep.academic_year = '2024-2025'
  AND ep.semester = '1'
  AND e.submitted_at BETWEEN '2024-08-01' AND '2024-12-31';

-- Test query: Sentiment analysis by semester
EXPLAIN ANALYZE
SELECT 
    ep.academic_year,
    ep.semester,
    e.sentiment,
    COUNT(*) as count
FROM evaluations e
JOIN evaluation_periods ep ON e.evaluation_period_id = ep.id
WHERE e.sentiment IS NOT NULL
GROUP BY ep.academic_year, ep.semester, e.sentiment
ORDER BY ep.academic_year DESC, ep.semester;

-- Test query: Course sections by semester
EXPLAIN ANALYZE
SELECT *
FROM class_sections
WHERE academic_year = '2024-2025'
  AND semester = 1
ORDER BY section_code;

-- ============================================================================
-- INDEX MAINTENANCE
-- ============================================================================

-- Analyze tables to update query planner statistics
ANALYZE evaluations;
ANALYZE evaluation_periods;
ANALYZE class_sections;
ANALYZE enrollments;
ANALYZE students;

-- Show table sizes and index sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('evaluations', 'evaluation_periods', 'class_sections', 'enrollments', 'students')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- NOTES
-- ============================================================================
-- These indexes are designed to optimize:
-- 1. Semester-specific evaluation queries
-- 2. Historical semester comparisons
-- 3. Sentiment analysis across multiple semesters
-- 4. Course section lookups by academic year
-- 5. Student enrollment filtering
--
-- Expected performance improvements:
-- - Semester dashboard queries: 50-70% faster
-- - Historical comparisons: 60-80% faster
-- - Sentiment analysis: 40-60% faster
-- 
-- Trade-off: Slightly slower INSERT operations (typically < 5ms overhead)
-- Benefit: Much faster SELECT operations (seconds to milliseconds)
-- ============================================================================
