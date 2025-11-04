-- ===============================================
-- TEST USER ACCOUNTS - ALL ROLES
-- Run this in Supabase SQL Editor to create test accounts
-- Password for all accounts: "password123"
-- ===============================================

-- Note: The password hash below is bcrypt hash of "password123"
-- You can generate new hashes using: bcrypt.hashpw(b"your_password", bcrypt.gensalt())

-- ================================================
-- 0. CREATE DEPARTMENT FIRST
-- ================================================
INSERT INTO departments (department_name, department_code, college) 
VALUES ('College of Computing Arts and Sciences', 'CCAS', 'College of Computing Arts and Sciences')
ON CONFLICT (department_code) DO NOTHING;

-- ================================================
-- 1. ADMIN USER
-- Email: admin@lpu.edu.ph
-- Password: password123
-- ================================================
INSERT INTO users (email, password_hash, role, first_name, last_name, is_active, department_id) 
VALUES (
    'admin@lpu.edu.ph', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLhJ1VFq', 
    'admin', 
    'System', 
    'Administrator', 
    TRUE,
    NULL
) ON CONFLICT (email) DO NOTHING;

-- ================================================
-- 2. INSTRUCTOR USER
-- Email: instructor@lpu.edu.ph
-- Password: password123
-- Department: CCAS (ID will be fetched dynamically)
-- ================================================
INSERT INTO users (email, password_hash, role, first_name, last_name, is_active, department_id) 
VALUES (
    'instructor@lpu.edu.ph', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLhJ1VFq', 
    'instructor', 
    'John', 
    'Doe', 
    TRUE,
    (SELECT department_id FROM departments WHERE department_code = 'CCAS' LIMIT 1)
) ON CONFLICT (email) DO NOTHING;

-- ================================================
-- 3. DEPARTMENT HEAD USER
-- Email: depthead@lpu.edu.ph
-- Password: password123
-- Department: CCAS (ID will be fetched dynamically)
-- ================================================
INSERT INTO users (email, password_hash, role, first_name, last_name, is_active, department_id) 
VALUES (
    'depthead@lpu.edu.ph', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLhJ1VFq', 
    'department_head', 
    'Jane', 
    'Smith', 
    TRUE,
    (SELECT department_id FROM departments WHERE department_code = 'CCAS' LIMIT 1)
) ON CONFLICT (email) DO NOTHING;

-- ================================================
-- 4. SECRETARY USER
-- Email: secretary@lpu.edu.ph
-- Password: password123
-- Department: CCAS (ID will be fetched dynamically)
-- ================================================

-- First, create the user
INSERT INTO users (email, password_hash, role, first_name, last_name, is_active, department_id, can_access_department_data) 
VALUES (
    'secretary@lpu.edu.ph', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLhJ1VFq', 
    'secretary', 
    'Mary', 
    'Johnson', 
    TRUE,
    (SELECT department_id FROM departments WHERE department_code = 'CCAS' LIMIT 1),
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Then, create the secretary_users record
INSERT INTO secretary_users (user_id, department_id, access_level, can_view_evaluations, can_view_analytics, can_export_data, assigned_by, is_active)
SELECT 
    u.id,
    (SELECT department_id FROM departments WHERE department_code = 'CCAS' LIMIT 1),
    'department',
    TRUE,
    TRUE,
    TRUE,
    (SELECT id FROM users WHERE email = 'admin@lpu.edu.ph' LIMIT 1),
    TRUE
FROM users u
WHERE u.email = 'secretary@lpu.edu.ph'
ON CONFLICT (user_id) DO NOTHING;

-- ================================================
-- 5. STUDENT USER
-- Email: student@lpu.edu.ph
-- Password: password123
-- ================================================

-- First, create the user account
INSERT INTO users (email, password_hash, role, first_name, last_name, is_active) 
VALUES (
    'student@lpu.edu.ph', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLhJ1VFq', 
    'student', 
    'Bob', 
    'Williams', 
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Then, create the student record
INSERT INTO students (user_id, student_number, first_name, last_name, email, year_level, program, department_id, is_active)
SELECT 
    u.id,
    '2024001',
    'Bob',
    'Williams',
    'student@lpu.edu.ph',
    '3rd Year',
    'Computer Science',
    (SELECT department_id FROM departments WHERE department_code = 'CCAS' LIMIT 1),
    TRUE
FROM users u
WHERE u.email = 'student@lpu.edu.ph'
ON CONFLICT (student_number) DO NOTHING;

-- ================================================
-- 6. CREATE SAMPLE PROGRAM, COURSE, AND CLASS SECTION FOR TESTING
-- ================================================

-- Insert sample program
INSERT INTO programs (name, code, description) 
VALUES (
    'Bachelor of Science in Computer Science',
    'BSCS',
    'Four-year undergraduate program in Computer Science'
) ON CONFLICT (code) DO NOTHING;

-- Insert sample course
INSERT INTO courses (program_id, course_code, course_name, description, units, is_active)
SELECT 
    p.id,
    'CS101',
    'Introduction to Programming',
    'Basic programming concepts and problem solving',
    3,
    TRUE
FROM programs p
WHERE p.code = 'BSCS'
ON CONFLICT DO NOTHING;

-- Insert sample class section
INSERT INTO class_sections (course_id, class_code, instructor_id, semester, academic_year, max_students)
SELECT 
    c.id,
    'CS101-1A',
    (SELECT id FROM users WHERE email = 'instructor@lpu.edu.ph' LIMIT 1),
    '1st',
    '2024-2025',
    40
FROM courses c
WHERE c.course_code = 'CS101'
ON CONFLICT (class_code) DO NOTHING;

-- Enroll the student in the class
INSERT INTO enrollments (student_id, class_section_id, enrollment_date, status)
SELECT 
    s.id,
    cs.id,
    CURRENT_TIMESTAMP,
    'active'
FROM students s
JOIN class_sections cs ON cs.class_code = 'CS101-1A'
WHERE s.student_number = '2024001'
ON CONFLICT (student_id, class_section_id) DO NOTHING;

-- ================================================
-- 7. CREATE AN ACTIVE EVALUATION PERIOD
-- ================================================

INSERT INTO evaluation_periods (
    name, 
    description, 
    start_date, 
    end_date, 
    semester, 
    academic_year, 
    status, 
    is_active,
    created_by
) VALUES (
    'Midterm Evaluation - Fall 2024',
    'Midterm course evaluation period for Fall semester 2024-2025',
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE + INTERVAL '25 days',
    '1st',
    '2024-2025',
    'active',
    TRUE,
    (SELECT id FROM users WHERE email = 'admin@lpu.edu.ph' LIMIT 1)
) ON CONFLICT DO NOTHING;

-- ================================================
-- VERIFICATION - CHECK CREATED ACCOUNTS
-- ================================================

SELECT 
    'USER ACCOUNTS CREATED:' as info;

SELECT 
    email,
    role,
    first_name || ' ' || last_name as full_name,
    CASE WHEN is_active THEN 'Active' ELSE 'Inactive' END as status
FROM users
WHERE email IN (
    'admin@lpu.edu.ph',
    'instructor@lpu.edu.ph',
    'depthead@lpu.edu.ph',
    'secretary@lpu.edu.ph',
    'student@lpu.edu.ph'
)
ORDER BY 
    CASE role
        WHEN 'admin' THEN 1
        WHEN 'instructor' THEN 2
        WHEN 'department_head' THEN 3
        WHEN 'secretary' THEN 4
        WHEN 'student' THEN 5
    END;

-- ================================================
-- LOGIN CREDENTIALS SUMMARY
-- ================================================

SELECT 
    '========================================' as separator
UNION ALL
SELECT 'TEST USER ACCOUNTS - LOGIN CREDENTIALS'
UNION ALL
SELECT '========================================'
UNION ALL
SELECT ''
UNION ALL
SELECT '1. ADMIN:'
UNION ALL
SELECT '   Email: admin@lpu.edu.ph'
UNION ALL
SELECT '   Password: password123'
UNION ALL
SELECT ''
UNION ALL
SELECT '2. INSTRUCTOR:'
UNION ALL
SELECT '   Email: instructor@lpu.edu.ph'
UNION ALL
SELECT '   Password: password123'
UNION ALL
SELECT ''
UNION ALL
SELECT '3. DEPARTMENT HEAD:'
UNION ALL
SELECT '   Email: depthead@lpu.edu.ph'
UNION ALL
SELECT '   Password: password123'
UNION ALL
SELECT ''
UNION ALL
SELECT '4. SECRETARY:'
UNION ALL
SELECT '   Email: secretary@lpu.edu.ph'
UNION ALL
SELECT '   Password: password123'
UNION ALL
SELECT ''
UNION ALL
SELECT '5. STUDENT:'
UNION ALL
SELECT '   Email: student@lpu.edu.ph'
UNION ALL
SELECT '   Password: password123'
UNION ALL
SELECT '========================================';
