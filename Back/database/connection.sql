-- Database Verification Queries
-- Copy and paste these queries in pgAdmin 4 Query Tool to verify your setup

-- 1. Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected result: 8 tables
-- class_sections, courses, department_heads, enrollments, evaluations, programs, students, users

-- 2. Check programs data
SELECT id, code, name, duration_years 
FROM programs 
ORDER BY code;

-- Expected result: 5 programs
-- BSIT, BSCS-DS, BSCS, BSCY, BMA

-- 3. Check current data counts
SELECT 
    'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL SELECT 
    'students' as table_name, COUNT(*) as record_count FROM students
UNION ALL SELECT 
    'courses' as table_name, COUNT(*) as record_count FROM courses
UNION ALL SELECT 
    'class_sections' as table_name, COUNT(*) as record_count FROM class_sections
UNION ALL SELECT 
    'enrollments' as table_name, COUNT(*) as record_count FROM enrollments
UNION ALL SELECT 
    'evaluations' as table_name, COUNT(*) as record_count FROM evaluations
UNION ALL SELECT 
    'department_heads' as table_name, COUNT(*) as record_count FROM department_heads
ORDER BY table_name;

-- Before migration: Should show 0 records in most tables (except programs with 5 records)
-- After migration: Should show multiple records in users, students, courses, etc.

-- 4. Test connection with simple query
SELECT 
    'Database connection successful!' as status,
    current_database() as database_name,
    current_user as username,
    version() as postgresql_version;
