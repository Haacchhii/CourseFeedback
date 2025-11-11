-- ============================================================
-- FIX USERS TABLE - Remove Supabase Conflicts
-- ============================================================
-- This script fixes the users table by removing conflicts
-- with Supabase's built-in authentication system
-- Run this in Supabase SQL Editor FIRST before anything else
-- ============================================================

-- Step 1: Drop all dependent tables (we'll recreate relationships)
DROP TABLE IF EXISTS public.evaluations CASCADE;
DROP TABLE IF EXISTS public.enrollments CASCADE;
DROP TABLE IF EXISTS public.class_sections CASCADE;
DROP TABLE IF EXISTS public.instructors CASCADE;
DROP TABLE IF EXISTS public.secretaries CASCADE;
DROP TABLE IF EXISTS public.department_heads CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;

-- Step 2: Drop the problematic users table
DROP TABLE IF EXISTS public.users CASCADE;

-- Step 3: Create clean users table (NO Supabase auth conflicts)
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'instructor', 'department_head', 'secretary', 'admin')),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 4: Recreate dependent tables with proper foreign keys

-- Students Table
CREATE TABLE public.students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    student_number VARCHAR(50) UNIQUE NOT NULL,
    program_id INTEGER REFERENCES public.programs(id) ON DELETE SET NULL,
    year_level INTEGER CHECK (year_level BETWEEN 1 AND 4),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Instructors Table
CREATE TABLE public.instructors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    specialization VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Department Heads Table
CREATE TABLE public.department_heads (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    department VARCHAR(200) NOT NULL,
    programs TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Secretaries Table
CREATE TABLE public.secretaries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    programs INTEGER[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Class Sections Table
CREATE TABLE public.class_sections (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    instructor_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    class_code VARCHAR(50) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    max_students INTEGER DEFAULT 40,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enrollments Table
CREATE TABLE public.enrollments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_section_id INTEGER NOT NULL REFERENCES public.class_sections(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
    UNIQUE(student_id, class_section_id)
);

-- Evaluations Table
CREATE TABLE public.evaluations (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_section_id INTEGER NOT NULL REFERENCES public.class_sections(id) ON DELETE CASCADE,
    rating_teaching INTEGER CHECK (rating_teaching BETWEEN 1 AND 5),
    rating_content INTEGER CHECK (rating_content BETWEEN 1 AND 5),
    rating_engagement INTEGER CHECK (rating_engagement BETWEEN 1 AND 5),
    rating_overall INTEGER CHECK (rating_overall BETWEEN 1 AND 5),
    text_feedback TEXT,
    suggestions TEXT,
    sentiment VARCHAR(20),
    sentiment_score DOUBLE PRECISION,
    sentiment_confidence DOUBLE PRECISION,
    is_anomaly BOOLEAN DEFAULT FALSE,
    anomaly_score DOUBLE PRECISION,
    anomaly_reason TEXT,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submission_ip VARCHAR(45),
    processing_status VARCHAR(20) DEFAULT 'pending',
    processed_at TIMESTAMP,
    UNIQUE(student_id, class_section_id)
);

-- Audit Logs Table
CREATE TABLE public.audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'Info' CHECK (severity IN ('Info', 'Warning', 'Critical')),
    status VARCHAR(20) DEFAULT 'Success' CHECK (status IN ('Success', 'Failed', 'Blocked')),
    ip_address VARCHAR(45),
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 5: Create indexes for performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_active ON public.users(is_active);
CREATE INDEX idx_students_user_id ON public.students(user_id);
CREATE INDEX idx_students_program_id ON public.students(program_id);
CREATE INDEX idx_students_number ON public.students(student_number);
CREATE INDEX idx_instructors_user_id ON public.instructors(user_id);
CREATE INDEX idx_dept_heads_user_id ON public.department_heads(user_id);
CREATE INDEX idx_secretaries_user_id ON public.secretaries(user_id);
CREATE INDEX idx_class_sections_course_id ON public.class_sections(course_id);
CREATE INDEX idx_class_sections_instructor_id ON public.class_sections(instructor_id);
CREATE INDEX idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_class_section_id ON public.enrollments(class_section_id);
CREATE INDEX idx_evaluations_student_id ON public.evaluations(student_id);
CREATE INDEX idx_evaluations_class_section_id ON public.evaluations(class_section_id);
CREATE INDEX idx_evaluations_sentiment ON public.evaluations(sentiment);
CREATE INDEX idx_evaluations_anomaly ON public.evaluations(is_anomaly);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Step 6: Verify the fix
SELECT 
    'Users table fixed!' as status,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public') as column_count,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('users', 'students', 'instructors', 'department_heads', 'secretaries') AND table_schema = 'public') as tables_created;

-- Show clean users table structure
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;
