-- ============================================================
-- IMPORT CSV FILES TO RENDER DATABASE
-- Step-by-step guide to import your Supabase data
-- ============================================================

-- PREREQUISITES:
-- 1. You have exported all tables as CSV from Supabase
-- 2. You have the Render database connection details
-- 3. Tables already exist (run DATABASE_COMPLETE_SETUP.sql first if not)

-- ============================================================
-- METHOD 1: Using psql COPY command (RECOMMENDED)
-- ============================================================

-- Get your Render External Database URL from:
-- Render Dashboard > PostgreSQL service > Connect > External Database URL

-- Example format:
-- postgresql://coursefeedback:password@dpg-xxx.oregon-postgres.render.com/coursefeedback

-- Run these commands in PowerShell (replace with your actual Render database URL):

-- Set the connection
$RENDER_DB = "postgresql://coursefeedback:password@dpg-xxx.oregon-postgres.render.com/coursefeedback"

-- Import each CSV file (adjust paths to your CSV files)
psql "$RENDER_DB" -c "\COPY programs FROM 'C:\path\to\programs.csv' WITH CSV HEADER"
psql "$RENDER_DB" -c "\COPY users FROM 'C:\path\to\users.csv' WITH CSV HEADER"
psql "$RENDER_DB" -c "\COPY students FROM 'C:\path\to\students.csv' WITH CSV HEADER"
psql "$RENDER_DB" -c "\COPY secretaries FROM 'C:\path\to\secretaries.csv' WITH CSV HEADER"
psql "$RENDER_DB" -c "\COPY department_heads FROM 'C:\path\to\department_heads.csv' WITH CSV HEADER"
psql "$RENDER_DB" -c "\COPY instructors FROM 'C:\path\to\instructors.csv' WITH CSV HEADER"
psql "$RENDER_DB" -c "\COPY courses FROM 'C:\path\to\courses.csv' WITH CSV HEADER"
psql "$RENDER_DB" -c "\COPY class_sections FROM 'C:\path\to\class_sections.csv' WITH CSV HEADER"
psql "$RENDER_DB" -c "\COPY enrollments FROM 'C:\path\to\enrollments.csv' WITH CSV HEADER"
psql "$RENDER_DB" -c "\COPY evaluations FROM 'C:\path\to\evaluations.csv' WITH CSV HEADER"
psql "$RENDER_DB" -c "\COPY evaluation_periods FROM 'C:\path\to\evaluation_periods.csv' WITH CSV HEADER"
psql "$RENDER_DB" -c "\COPY system_settings FROM 'C:\path\to\system_settings.csv' WITH CSV HEADER"
psql "$RENDER_DB" -c "\COPY audit_logs FROM 'C:\path\to\audit_logs.csv' WITH CSV HEADER"


-- ============================================================
-- METHOD 2: Using pgAdmin or DBeaver (GUI)
-- ============================================================

-- 1. Open pgAdmin or DBeaver
-- 2. Create new connection using Render External Database URL
-- 3. Right-click each table > Import/Export Data
-- 4. Select your CSV files and import


-- ============================================================
-- AFTER IMPORT: Reset sequences
-- ============================================================

-- After importing, you need to reset the ID sequences
-- Run these SQL commands:

SELECT setval('programs_id_seq', (SELECT MAX(id) FROM programs));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('students_id_seq', (SELECT MAX(id) FROM students));
SELECT setval('secretaries_id_seq', (SELECT MAX(id) FROM secretaries));
SELECT setval('department_heads_id_seq', (SELECT MAX(id) FROM department_heads));
SELECT setval('instructors_id_seq', (SELECT MAX(id) FROM instructors));
SELECT setval('courses_id_seq', (SELECT MAX(id) FROM courses));
SELECT setval('class_sections_id_seq', (SELECT MAX(id) FROM class_sections));
SELECT setval('enrollments_id_seq', (SELECT MAX(id) FROM enrollments));
SELECT setval('evaluations_id_seq', (SELECT MAX(id) FROM evaluations));
SELECT setval('evaluation_periods_id_seq', (SELECT MAX(id) FROM evaluation_periods));
SELECT setval('system_settings_id_seq', (SELECT MAX(id) FROM system_settings));
SELECT setval('audit_logs_id_seq', (SELECT MAX(id) FROM audit_logs));


-- ============================================================
-- VERIFY IMPORT
-- ============================================================

SELECT 'programs' as table_name, COUNT(*) as count FROM programs
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'students', COUNT(*) FROM students
UNION ALL SELECT 'courses', COUNT(*) FROM courses
UNION ALL SELECT 'evaluations', COUNT(*) FROM evaluations;
