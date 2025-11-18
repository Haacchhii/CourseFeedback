-- ============================================================
-- EXPORT YOUR SUPABASE DATABASE
-- Run this guide to export your complete database
-- ============================================================

-- METHOD 1: Using Supabase Dashboard (EASIEST)
-- ============================================
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to: Database > Backups (or Database section)
-- 3. Look for "Export" or "Download backup" option
-- 4. Download the SQL dump file

-- METHOD 2: Using pg_dump (Command Line)
-- =========================================
-- You'll need the connection string from Supabase

-- 1. Get your Supabase connection details:
--    Project Settings > Database > Connection String (Direct connection)
--    Example: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

-- 2. Run pg_dump command in PowerShell:

-- Full database export (schema + data):
pg_dump "postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" -f supabase_backup.sql

-- If you don't have pg_dump installed:
-- Download from: https://www.postgresql.org/download/windows/
-- Or use the one that comes with PostgreSQL installation

-- 3. The exported file will be: supabase_backup.sql


-- METHOD 3: Export via Supabase CLI
-- ===================================
-- 1. Install Supabase CLI: npm install -g supabase
-- 2. Login: supabase login
-- 3. Link project: supabase link --project-ref [YOUR-PROJECT-REF]
-- 4. Export: supabase db dump -f supabase_backup.sql


-- ============================================================
-- IMPORT TO RENDER DATABASE
-- ============================================================

-- METHOD 1: Using Render Dashboard (RECOMMENDED)
-- ================================================
-- 1. Go to your Render PostgreSQL service
-- 2. Click "Connect" > "External Connection" 
-- 3. Copy the "External Database URL"
-- 4. Use a PostgreSQL client (pgAdmin, DBeaver, etc.)
-- 5. Connect using the External URL
-- 6. Run your SQL dump file

-- METHOD 2: Using psql Command Line
-- ===================================
-- 1. Get External Database URL from Render dashboard
-- 2. Run in PowerShell:

psql "postgresql://[render-db-url]" -f supabase_backup.sql

-- Example:
-- psql "postgresql://coursefeedback:password@dpg-xxx.oregon-postgres.render.com/coursefeedback" -f supabase_backup.sql


-- METHOD 3: Using Render Web Shell (Simple queries only)
-- ========================================================
-- 1. Go to your Render PostgreSQL service
-- 2. Click "Shell" tab
-- 3. Paste and run SQL commands directly
-- 4. NOTE: May have size limits, better for small databases


-- ============================================================
-- AFTER IMPORT - VERIFY DATA
-- ============================================================

-- Check all tables exist:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check row counts:
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL SELECT 'students', COUNT(*) FROM students
UNION ALL SELECT 'courses', COUNT(*) FROM courses
UNION ALL SELECT 'evaluations', COUNT(*) FROM evaluations;

-- Test a user login (verify passwords work):
SELECT id, email, role, is_active 
FROM users 
WHERE email = 'admin@lpubatangas.edu.ph';
