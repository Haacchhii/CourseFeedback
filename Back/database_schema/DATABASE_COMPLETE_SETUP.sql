-- ============================================================
-- COMPLETE DATABASE SETUP FOR COURSE FEEDBACK SYSTEM
-- Generated: November 9, 2025
-- ============================================================

-- This file contains all SQL statements needed to set up the complete database
-- Run this file in your PostgreSQL/Supabase database

-- ============================================================
-- PART 1: CORE SCHEMA (Tables)
-- ============================================================

-- Programs Table
CREATE TABLE IF NOT EXISTS programs (
    id SERIAL PRIMARY KEY,
    program_code VARCHAR(20) UNIQUE NOT NULL,
    program_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'instructor', 'department_head', 'secretary', 'admin')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students Table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    program_id INTEGER REFERENCES programs(id),
    year_level INTEGER CHECK (year_level BETWEEN 1 AND 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Department Heads Table
CREATE TABLE IF NOT EXISTS department_heads (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    department VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Secretaries Table
CREATE TABLE IF NOT EXISTS secretaries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Instructors Table
CREATE TABLE IF NOT EXISTS instructors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    specialization VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    program_id INTEGER REFERENCES programs(id),
    subject_code VARCHAR(50) NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    year_level INTEGER CHECK (year_level BETWEEN 1 AND 4),
    semester INTEGER CHECK (semester IN (1, 2)),
    units DECIMAL(3,1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subject_code, program_id)
);

-- Class Sections Table
CREATE TABLE IF NOT EXISTS class_sections (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    instructor_id INTEGER REFERENCES users(id),
    section_code VARCHAR(50) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    semester INTEGER CHECK (semester IN (1, 2)),
    schedule TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enrollments Table
CREATE TABLE IF NOT EXISTS enrollments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    class_section_id INTEGER REFERENCES class_sections(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, class_section_id)
);

-- Evaluations Table
CREATE TABLE IF NOT EXISTS evaluations (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    class_section_id INTEGER REFERENCES class_sections(id) ON DELETE CASCADE,
    rating_overall INTEGER CHECK (rating_overall BETWEEN 1 AND 5),
    rating_teaching INTEGER CHECK (rating_teaching BETWEEN 1 AND 5),
    rating_knowledge INTEGER CHECK (rating_knowledge BETWEEN 1 AND 5),
    rating_communication INTEGER CHECK (rating_communication BETWEEN 1 AND 5),
    rating_engagement INTEGER CHECK (rating_engagement BETWEEN 1 AND 5),
    comments TEXT,
    sentiment VARCHAR(20),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, class_section_id)
);

-- ============================================================
-- PART 2: ENHANCED TABLES (Admin Features)
-- ============================================================

-- Evaluation Periods Table
CREATE TABLE IF NOT EXISTS evaluation_periods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    semester VARCHAR(50) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
    total_students INTEGER DEFAULT 0,
    completed_evaluations INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'Info' CHECK (severity IN ('Info', 'Warning', 'Critical')),
    status VARCHAR(20) DEFAULT 'Success' CHECK (status IN ('Success', 'Failed', 'Blocked')),
    ip_address VARCHAR(45),
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value TEXT,
    data_type VARCHAR(20) DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, key)
);

-- ============================================================
-- PART 3: INDEXES (Performance Optimization)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_program_id ON students(program_id);
CREATE INDEX IF NOT EXISTS idx_courses_program_id ON courses(program_id);
CREATE INDEX IF NOT EXISTS idx_class_sections_course_id ON class_sections(course_id);
CREATE INDEX IF NOT EXISTS idx_class_sections_instructor_id ON class_sections(instructor_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_section_id ON enrollments(class_section_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_student_id ON evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_class_section_id ON evaluations(class_section_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_periods_status ON evaluation_periods(status, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================
-- PART 4: DEFAULT DATA
-- ============================================================

-- Insert default evaluation period
INSERT INTO evaluation_periods (
    name, 
    semester, 
    academic_year, 
    start_date, 
    end_date, 
    status
) 
VALUES (
    'First Semester Evaluation 2024-2025',
    'First Semester',
    '2024-2025',
    '2024-09-01 00:00:00',
    '2025-01-31 23:59:59',
    'active'
) ON CONFLICT DO NOTHING;

-- ============================================================
-- SETUP COMPLETE
-- ============================================================

SELECT 'Database setup complete!' as message,
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables;
