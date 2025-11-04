-- ===============================================
-- SECRETARY SYSTEM TABLES
-- Purpose: Department-level data access and management for secretary role
-- Tables: departments, secretary_users
-- ===============================================

-- ================================================
-- 1. DEPARTMENTS TABLE
-- Purpose: Organize users and students by department
-- Use Case: Department-level reporting, secretary access control
-- ================================================

CREATE TABLE IF NOT EXISTS departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    department_code VARCHAR(10) NOT NULL UNIQUE,
    college VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Insert sample departments
INSERT INTO departments (department_name, department_code, college) VALUES
('Computer Science', 'CS', 'College of Engineering'),
('Information Technology', 'IT', 'College of Engineering'),
('Business Administration', 'BA', 'College of Business'),
('Education', 'EDUC', 'College of Education'),
('Engineering', 'ENG', 'College of Engineering')
ON CONFLICT (department_code) DO NOTHING;

-- ================================================
-- 2. SECRETARY USERS TABLE
-- Purpose: Extended information and permissions for secretary role
-- Use Case: Department-wide data access, controlled by access level
-- ================================================

CREATE TABLE IF NOT EXISTS secretary_users (
    secretary_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id INTEGER NOT NULL REFERENCES departments(department_id),
    access_level VARCHAR(20) DEFAULT 'department' CHECK (access_level IN ('department', 'college', 'university')),
    can_view_evaluations BOOLEAN DEFAULT TRUE,
    can_view_analytics BOOLEAN DEFAULT TRUE,
    can_export_data BOOLEAN DEFAULT TRUE,
    assigned_by INTEGER REFERENCES users(id), -- Admin who assigned secretary access
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    CONSTRAINT unique_secretary_per_user UNIQUE(user_id),
    CONSTRAINT unique_secretary_per_department UNIQUE(department_id) -- One secretary per department
);

-- ================================================
-- 3. ADD FOREIGN KEY CONSTRAINTS TO EXISTING TABLES
-- Purpose: Link users and students to departments
-- ================================================

-- Add foreign key for users
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_department') THEN
        ALTER TABLE users 
        ADD CONSTRAINT fk_users_department 
        FOREIGN KEY (department_id) REFERENCES departments(department_id);
    END IF;
END $$;

-- Add foreign key for students
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_students_department') THEN
        ALTER TABLE students 
        ADD CONSTRAINT fk_students_department 
        FOREIGN KEY (department_id) REFERENCES departments(department_id);
    END IF;
END $$;

-- ================================================
-- VERIFICATION QUERY
-- ================================================

-- Check if secretary tables were created
SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('departments', 'secretary_users')
ORDER BY table_name;

-- Check sample departments
SELECT * FROM departments ORDER BY department_code;
