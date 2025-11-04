-- ===============================================
-- SAMPLE DATA FOR TESTING
-- Purpose: Populate database with test data for development and testing
-- Note: This is optional - only run in development/staging environments
-- ===============================================

-- ================================================
-- 1. SAMPLE USERS
-- Purpose: Test users for each role
-- ================================================

-- Admin user
DO $$
BEGIN
    INSERT INTO users (email, password_hash, role, first_name, last_name, is_active, firebase_uid) 
    VALUES ('admin@lpu.edu.ph', '$2b$12$sample_hash', 'admin', 'Admin', 'User', TRUE, 'firebase_uid_admin')
    ON CONFLICT (email) DO NOTHING;
EXCEPTION
    WHEN undefined_column THEN
        INSERT INTO users (email, password_hash, role, first_name, last_name, is_active) 
        VALUES ('admin@lpu.edu.ph', '$2b$12$sample_hash', 'admin', 'Admin', 'User', TRUE)
        ON CONFLICT (email) DO NOTHING;
END $$;

-- Instructor user
DO $$
BEGIN
    INSERT INTO users (email, password_hash, role, first_name, last_name, is_active, firebase_uid, department_id) 
    VALUES ('instructor@lpu.edu.ph', '$2b$12$sample_hash', 'instructor', 'John', 'Doe', TRUE, 'firebase_uid_123', 1)
    ON CONFLICT (email) DO NOTHING;
EXCEPTION
    WHEN undefined_column THEN
        INSERT INTO users (email, password_hash, role, first_name, last_name, is_active) 
        VALUES ('instructor@lpu.edu.ph', '$2b$12$sample_hash', 'instructor', 'John', 'Doe', TRUE)
        ON CONFLICT (email) DO NOTHING;
END $$;

-- Department head user
DO $$
BEGIN
    INSERT INTO users (email, password_hash, role, first_name, last_name, is_active, department_id) 
    VALUES ('dept_head@lpu.edu.ph', '$2b$12$sample_hash', 'department_head', 'Jane', 'Smith', TRUE, 1)
    ON CONFLICT (email) DO NOTHING;
END $$;

-- Secretary user (if departments table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'departments') THEN
        INSERT INTO users (email, password_hash, role, first_name, last_name, is_active, department_id, can_access_department_data) 
        VALUES ('secretary@lpu.edu.ph', '$2b$12$sample_hash', 'secretary', 'Mary', 'Johnson', TRUE, 1, TRUE)
        ON CONFLICT (email) DO NOTHING;
        
        -- Create secretary user record
        INSERT INTO secretary_users (user_id, department_id, access_level, assigned_by)
        SELECT u.id, 1, 'department', (SELECT id FROM users WHERE email = 'admin@lpu.edu.ph' LIMIT 1)
        FROM users u
        WHERE u.email = 'secretary@lpu.edu.ph'
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
END $$;

-- Student user
INSERT INTO users (email, password_hash, role, first_name, last_name, is_active) 
VALUES ('student@lpu.edu.ph', '$2b$12$sample_hash', 'student', 'Bob', 'Williams', TRUE)
ON CONFLICT (email) DO NOTHING;

-- ================================================
-- 2. SAMPLE EVALUATION PERIOD
-- Purpose: Active evaluation period for testing
-- ================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'evaluation_periods') THEN
        INSERT INTO evaluation_periods (
            name, description, start_date, end_date, semester, academic_year, 
            status, is_active, created_by
        ) VALUES (
            'Midterm Evaluation - Fall 2024',
            'Midterm course evaluation period for Fall semester 2024',
            CURRENT_DATE - INTERVAL '5 days',
            CURRENT_DATE + INTERVAL '10 days',
            '1st',
            '2024-2025',
            'active',
            TRUE,
            (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
        ) ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ================================================
-- 3. UPDATE SAMPLE CLASS SECTION WITH INSTRUCTOR
-- Purpose: Link existing class sections to instructor
-- ================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'class_sections') THEN
        UPDATE class_sections 
        SET instructor_id = (SELECT id FROM users WHERE email = 'instructor@lpu.edu.ph' LIMIT 1)
        WHERE instructor_id IS NULL 
        LIMIT 5;
    END IF;
END $$;

-- ================================================
-- 4. SAMPLE AUDIT LOG ENTRY
-- Purpose: Test audit log functionality
-- ================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        INSERT INTO audit_logs (
            user_id, username, user_role, action, entity_type, 
            entity_name, ip_address, timestamp, status, severity
        ) VALUES (
            (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
            'admin@lpu.edu.ph',
            'admin',
            'system_setup',
            'database',
            'Sample Data Initialization',
            '127.0.0.1',
            CURRENT_TIMESTAMP,
            'success',
            'info'
        );
    END IF;
END $$;

-- ================================================
-- 5. SAMPLE NOTIFICATION
-- Purpose: Test notification queue
-- ================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_queue') THEN
        INSERT INTO notification_queue (
            user_id, notification_type, title, message, status
        ) VALUES (
            (SELECT id FROM users WHERE role = 'student' LIMIT 1),
            'evaluation_complete',
            'Evaluation Period Open',
            'The midterm evaluation period is now open. Please submit your feedback.',
            'pending'
        );
    END IF;
END $$;

-- ================================================
-- VERIFICATION QUERIES
-- ================================================

-- Count sample users by role
SELECT role, COUNT(*) as user_count 
FROM users 
GROUP BY role 
ORDER BY role;

-- Check evaluation periods
SELECT id, name, start_date, end_date, status, is_active 
FROM evaluation_periods 
ORDER BY created_at DESC 
LIMIT 5;

-- Check system settings count
SELECT category, COUNT(*) as settings_count 
FROM system_settings 
GROUP BY category 
ORDER BY category;

-- Check departments
SELECT * FROM departments ORDER BY department_code;

-- Check secretary users
SELECT 
    u.email,
    u.first_name || ' ' || u.last_name as name,
    d.department_name,
    su.access_level
FROM secretary_users su
JOIN users u ON su.user_id = u.id
JOIN departments d ON su.department_id = d.department_id
WHERE su.is_active = TRUE;

-- ================================================
-- CLEANUP (OPTIONAL)
-- Run these commands if you need to remove sample data
-- ================================================

-- DELETE FROM audit_logs WHERE entity_name = 'Sample Data Initialization';
-- DELETE FROM notification_queue WHERE title = 'Evaluation Period Open';
-- DELETE FROM evaluation_periods WHERE name LIKE '%Fall 2024%';
-- DELETE FROM users WHERE email IN ('admin@lpu.edu.ph', 'instructor@lpu.edu.ph', 'dept_head@lpu.edu.ph', 'secretary@lpu.edu.ph', 'student@lpu.edu.ph');
