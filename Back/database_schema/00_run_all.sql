-- ===============================================
-- MASTER SCRIPT - RUN ALL DATABASE SCHEMAS
-- Purpose: Execute all schema files in correct dependency order
-- Usage: Run this single file to set up the entire database
-- ===============================================

-- ================================================
-- INSTRUCTIONS
-- ================================================
-- For Supabase SQL Editor:
-- 1. Copy and paste the contents of each file in order
-- 2. Run each section one at a time
-- 3. Check for errors before proceeding to next section
--
-- For psql command line:
-- \i 01_core_tables.sql
-- \i 02_ml_analytics_tables.sql
-- \i 03_admin_tables.sql
-- \i 04_secretary_system.sql
-- \i 05_views.sql
-- \i 06_functions.sql
-- \i 07_triggers.sql
-- \i 08_indexes.sql
-- \i 09_sample_data.sql  -- Optional: Comment out for production
-- ================================================

\echo 'Starting database schema setup...'
\echo ''

-- ================================================
-- STEP 1: CORE TABLES
-- ================================================
\echo '=== STEP 1/9: Setting up core tables ==='
\i 01_core_tables.sql
\echo 'Core tables setup complete'
\echo ''

-- ================================================
-- STEP 2: ML & ANALYTICS TABLES
-- ================================================
\echo '=== STEP 2/9: Setting up ML and analytics tables ==='
\i 02_ml_analytics_tables.sql
\echo 'ML and analytics tables setup complete'
\echo ''

-- ================================================
-- STEP 3: ADMIN TABLES
-- ================================================
\echo '=== STEP 3/9: Setting up admin tables ==='
\i 03_admin_tables.sql
\echo 'Admin tables setup complete'
\echo ''

-- ================================================
-- STEP 4: SECRETARY SYSTEM
-- ================================================
\echo '=== STEP 4/9: Setting up secretary system ==='
\i 04_secretary_system.sql
\echo 'Secretary system setup complete'
\echo ''

-- ================================================
-- STEP 5: DATABASE VIEWS
-- ================================================
\echo '=== STEP 5/9: Creating database views ==='
\i 05_views.sql
\echo 'Database views created'
\echo ''

-- ================================================
-- STEP 6: FUNCTIONS
-- ================================================
\echo '=== STEP 6/9: Creating functions ==='
\i 06_functions.sql
\echo 'Functions created'
\echo ''

-- ================================================
-- STEP 7: TRIGGERS
-- ================================================
\echo '=== STEP 7/9: Creating triggers ==='
\i 07_triggers.sql
\echo 'Triggers created'
\echo ''

-- ================================================
-- STEP 8: INDEXES
-- ================================================
\echo '=== STEP 8/9: Creating performance indexes ==='
\i 08_indexes.sql
\echo 'Indexes created'
\echo ''

-- ================================================
-- STEP 9: SAMPLE DATA (OPTIONAL)
-- ================================================
\echo '=== STEP 9/9: Loading sample data (optional) ==='
-- COMMENT OUT THE NEXT LINE FOR PRODUCTION
\i 09_sample_data.sql
\echo 'Sample data loaded'
\echo ''

-- ================================================
-- FINAL VERIFICATION
-- ================================================
\echo '=== VERIFICATION ==='
\echo ''

-- Count tables
\echo 'Tables created:'
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- Count views
\echo 'Views created:'
SELECT COUNT(*) as view_count 
FROM information_schema.views 
WHERE table_schema = 'public';

-- Count functions
\echo 'Functions created:'
SELECT COUNT(*) as function_count 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION';

-- Count indexes
\echo 'Indexes created:'
SELECT COUNT(*) as index_count 
FROM pg_indexes 
WHERE schemaname = 'public';

-- Count triggers
\echo 'Triggers created:'
SELECT COUNT(*) as trigger_count 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

\echo ''
\echo '✅ Database schema setup complete!'
\echo ''
\echo 'Summary of created objects:'
\echo '- Core tables (users, students, courses, evaluations, etc.)'
\echo '- ML & Analytics tables (analysis_results, firebase_sync_log, notification_queue)'
\echo '- Admin tables (evaluation_periods, system_settings, audit_logs, export_history)'
\echo '- Secretary system (departments, secretary_users)'
\echo '- 7 Database views for reporting'
\echo '- 7 Helper functions'
\echo '- 3 Automated triggers'
\echo '- 40+ Performance indexes'
\echo '- Sample data (if not commented out)'
\echo ''
\echo 'Next steps:'
\echo '1. Update your backend DATABASE_URL environment variable'
\echo '2. Test database connection: python Back/App/main.py'
\echo '3. Verify all routes are registered'
\echo '4. Run your application tests'
\echo ''

-- ================================================
-- QUICK HEALTH CHECK
-- ================================================
\echo '=== QUICK HEALTH CHECK ==='

-- Check if key tables exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN '✓'
        ELSE '✗'
    END as users_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'evaluations') THEN '✓'
        ELSE '✗'
    END as evaluations_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings') THEN '✓'
        ELSE '✗'
    END as system_settings_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN '✓'
        ELSE '✗'
    END as audit_logs_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'evaluation_analytics') THEN '✓'
        ELSE '✗'
    END as evaluation_analytics_view,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'log_audit_event') THEN '✓'
        ELSE '✗'
    END as log_audit_event_function;

\echo ''
\echo 'Legend: ✓ = Created, ✗ = Missing'
\echo ''
