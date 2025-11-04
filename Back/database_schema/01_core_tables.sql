-- ===============================================
-- CORE TABLES - Base Database Structure
-- Purpose: Essential tables for the evaluation system
-- Tables: users, students, courses, programs, class_sections, enrollments, evaluations
-- ===============================================

-- ================================================
-- 1. USERS TABLE ENHANCEMENTS
-- Purpose: Manage all system users (students, instructors, admins, department heads, secretaries)
-- ================================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS department_id INTEGER,
ADD COLUMN IF NOT EXISTS can_access_department_data BOOLEAN DEFAULT FALSE;

-- Update role constraint to include all roles
ALTER TABLE users 
ALTER COLUMN role TYPE VARCHAR(50),
DROP CONSTRAINT IF EXISTS users_role_check,
ADD CONSTRAINT users_role_check CHECK (role IN ('student', 'instructor', 'department_head', 'admin', 'secretary'));

-- ================================================
-- 2. STUDENTS TABLE ENHANCEMENTS
-- Purpose: Extended student information
-- ================================================

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS department_id INTEGER,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS year_level VARCHAR(20),
ADD COLUMN IF NOT EXISTS program VARCHAR(100),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS student_number VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- ================================================
-- 3. COURSES TABLE ENHANCEMENTS
-- Purpose: Course management with active status
-- ================================================

ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- ================================================
-- 4. CLASS SECTIONS TABLE ENHANCEMENTS
-- Purpose: Link instructors and enable Firebase sync
-- ================================================

ALTER TABLE class_sections 
ADD COLUMN IF NOT EXISTS instructor_id INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS firebase_sync_id VARCHAR(255);

-- ================================================
-- 5. EVALUATIONS TABLE ENHANCEMENTS
-- Purpose: Add ML processing fields, sentiment analysis, and audit trail
-- ================================================

ALTER TABLE evaluations 
ADD COLUMN IF NOT EXISTS text_feedback TEXT,
ADD COLUMN IF NOT EXISTS suggestions TEXT,
ADD COLUMN IF NOT EXISTS sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative')),
ADD COLUMN IF NOT EXISTS sentiment_score FLOAT CHECK (sentiment_score BETWEEN 0 AND 1),
ADD COLUMN IF NOT EXISTS is_anomaly BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS anomaly_score FLOAT,
ADD COLUMN IF NOT EXISTS submission_ip VARCHAR(45),
ADD COLUMN IF NOT EXISTS firebase_doc_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'flagged')),
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;

-- ================================================
-- VERIFICATION QUERY
-- ================================================

-- Check users table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check evaluations table enhancements
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'evaluations' 
AND table_schema = 'public'
AND column_name IN ('sentiment', 'sentiment_score', 'is_anomaly', 'processing_status')
ORDER BY ordinal_position;
